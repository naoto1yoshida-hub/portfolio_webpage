"""
提出前の機械検査（TEGG Engineering 組織憲章 第14条・機械検査保有義務）。

散文の規範だけに頼らず、機械で検出できるものはここで全件落とす。
検出できないもの（構成の妥当性・コピーの強さ）に目視レビューの時間を回すための工程。

    python scripts/preflight.py

終了コード 0 = 全件パス / 1 = 1件以上NG
"""
import re
import sys
import unicodedata
from pathlib import Path

# Windows の既定は cp932 で、出力に含まれる日本語・記号で落ちるため UTF-8 に固定する
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from data import works, profile  # noqa: E402
import app as flask_app  # noqa: E402


results = []


def check(name, ng_items, hint=''):
    """検査1件の結果を記録する。ng_items が空ならパス。"""
    results.append({'name': name, 'ng': list(ng_items), 'hint': hint})


# ---------------------------------------------------------------------------
# 1. 架空数値・旧実績の残存
# ---------------------------------------------------------------------------
# 旧サイトはAI生成のモック画像に「自動化率87%」等の架空数値を焼き込んだまま公開していた。
# 同じ事故を繰り返さないための検査。

FORBIDDEN = [
    'AutoBiz',
    'automation_dashboard',
    'document_search.png',
    'rag_chatbot.png',
    '60%削減',
    '削減しました',
    '時間短縮',
    '自動化率',
    '対応時間を60',
]

def scan_text_files():
    exts = {'.html', '.py', '.css', '.js', '.svg'}
    skip = {'.git', '__pycache__', '.venv', 'node_modules', '.claude', '.playwright-mcp'}
    for path in ROOT.rglob('*'):
        if not path.is_file() or path.suffix not in exts:
            continue
        if any(part in skip for part in path.parts):
            continue
        if path.name == 'preflight.py':  # 検査語そのものを持つので除外
            continue
        yield path


TEXT_FILES = list(scan_text_files())

ng = []
for path in TEXT_FILES:
    body = path.read_text(encoding='utf-8', errors='ignore')
    for word in FORBIDDEN:
        if word in body:
            ng.append(f'{path.relative_to(ROOT)}: "{word}"')
check('架空数値・旧実績の残存', ng, '裏付けのない業務削減効果は掲載しない（第2条）')


# ---------------------------------------------------------------------------
# 2. 絵文字の混入（第7条）
# ---------------------------------------------------------------------------

def has_emoji(text):
    for ch in text:
        code = ord(ch)
        if (0x1F300 <= code <= 0x1FAFF) or (0x2600 <= code <= 0x27BF) or code == 0xFE0F:
            return ch
    return None


ng = []
for path in TEXT_FILES:
    found = has_emoji(path.read_text(encoding='utf-8', errors='ignore'))
    if found:
        ng.append(f'{path.relative_to(ROOT)}: {found!r} (U+{ord(found):04X})')
check('絵文字の混入', ng, '絵文字は成果物・UI・ドキュメント問わず使用禁止（第7条）')


# ---------------------------------------------------------------------------
# 3. 想定外の文字体系の混入（キリル文字・ハングル等の紛れ込み）
# ---------------------------------------------------------------------------
# 執筆中に別言語の文字が紛れることが実際にあったので機械で落とす。

ALLOWED_SCRIPTS = ('LATIN', 'HIRAGANA', 'KATAKANA', 'CJK', 'COMMON', 'HALFWIDTH', 'FULLWIDTH')

ng = []
for path in TEXT_FILES:
    if path.suffix not in {'.html', '.py'}:
        continue
    body = path.read_text(encoding='utf-8', errors='ignore')
    for ch in set(body):
        if ord(ch) < 0x80:
            continue
        try:
            name = unicodedata.name(ch)
        except ValueError:
            continue
        if name.startswith(('CYRILLIC', 'HANGUL', 'ARABIC', 'HEBREW', 'THAI', 'DEVANAGARI')):
            ng.append(f'{path.relative_to(ROOT)}: {ch!r} ({name})')
check('想定外の文字体系の混入', sorted(set(ng)), '日本語・英数字以外の文字が紛れていないか')


# ---------------------------------------------------------------------------
# 4. 数値に測定条件・時点が添えられているか
# ---------------------------------------------------------------------------

ng = []
for case in works.CASES:
    for stat in case['stats']:
        if not stat.get('note', '').strip():
            ng.append(f'{case["slug"]}: stats "{stat["label"]}" に note がない')
    for result in case['results']:
        if not result.get('note', '').strip():
            ng.append(f'{case["slug"]}: results "{result["metric"]}" に note がない')
for h in profile.HIGHLIGHTS:
    if not h.get('note', '').strip():
        ng.append(f'HIGHLIGHTS "{h["label"]}" に note がない')
check('数値の測定条件・時点', ng, 'すべての数値に測定条件と時点を添える（第1条）')


# ---------------------------------------------------------------------------
# 5. ケースデータの必須項目
# ---------------------------------------------------------------------------

REQUIRED = ['slug', 'title', 'lead', 'summary', 'client', 'period', 'role', 'status',
            'badge', 'tags', 'stats', 'challenge', 'approach', 'results', 'stack',
            'hardest', 'diagram', 'diagram_alt']

ng = []
for case in works.CASES:
    for key in REQUIRED:
        if not case.get(key):
            ng.append(f'{case.get("slug", "?")}: {key} が空')
    diagram = ROOT / 'static' / 'images' / 'diagrams' / case.get('diagram', '')
    if not diagram.exists():
        ng.append(f'{case.get("slug")}: 構成図 {case.get("diagram")} が存在しない')
check('ケースデータの必須項目', ng)


# ---------------------------------------------------------------------------
# 6. 全ページのメタ情報・画像alt・見出し
# ---------------------------------------------------------------------------

PAGES = ['/', '/works'] + [f'/works/{c["slug"]}' for c in works.CASES]

client = flask_app.app.test_client()
rendered = {}

ng = []
for path in PAGES:
    res = client.get(path)
    if res.status_code != 200:
        ng.append(f'{path}: HTTP {res.status_code}')
        continue
    rendered[path] = res.get_data(as_text=True)
check('全ページが200を返す', ng)

ng = []
for path, html in rendered.items():
    title = re.search(r'<title>(.*?)</title>', html, re.S)
    desc = re.search(r'<meta name="description" content="(.*?)"', html, re.S)
    og = re.search(r'<meta property="og:title"', html)
    canon = re.search(r'<link rel="canonical"', html)
    if not title or not title.group(1).strip():
        ng.append(f'{path}: title がない')
    if not desc or len(desc.group(1).strip()) < 20:
        ng.append(f'{path}: meta description がない/短い')
    if not og:
        ng.append(f'{path}: og:title がない')
    if not canon:
        ng.append(f'{path}: canonical がない')
    if len(re.findall(r'<h1', html)) != 1:
        ng.append(f'{path}: h1 が {len(re.findall(r"<h1", html))} 個')
check('メタ情報と h1', ng)

ng = []
for path, html in rendered.items():
    for tag in re.findall(r'<img [^>]*>', html):
        if 'alt="' not in tag or 'alt=""' in tag:
            ng.append(f'{path}: alt のない img — {tag[:70]}')
check('画像の alt', ng)


# ---------------------------------------------------------------------------
# 7. 内部リンクの疎通
# ---------------------------------------------------------------------------

ng = []
seen = set()
for path, html in rendered.items():
    for href in re.findall(r'href="(/[^"#]*)"', html):
        href = href.split('#')[0]
        if not href or href in seen:
            continue
        seen.add(href)
        res = client.get(href)
        if res.status_code != 200:
            ng.append(f'{path} → {href}: HTTP {res.status_code}')
check('内部リンクの疎通', ng)

ng = []
for path, html in rendered.items():
    for src in set(re.findall(r'src="(/static/[^"]+)"', html)):
        if client.get(src).status_code != 200:
            ng.append(f'{path} → {src}: 404')
check('静的ファイルの存在', ng)


# ---------------------------------------------------------------------------
# 8. 404 が 404 を返す
# ---------------------------------------------------------------------------

res = client.get('/works/this-does-not-exist')
check('存在しない slug が 404', [] if res.status_code == 404 else [f'HTTP {res.status_code}'])


# ---------------------------------------------------------------------------
# 結果
# ---------------------------------------------------------------------------

print('=' * 68)
print(' preflight — 提出前の機械検査')
print('=' * 68)

failed = 0
for r in results:
    if r['ng']:
        failed += 1
        print(f'\n[NG] {r["name"]}  ({len(r["ng"])}件)')
        if r['hint']:
            print(f'     → {r["hint"]}')
        for item in r['ng'][:20]:
            print(f'     - {item}')
        if len(r['ng']) > 20:
            print(f'     ... 他 {len(r["ng"]) - 20} 件')
    else:
        print(f'[OK] {r["name"]}')

print()
print('-' * 68)
if failed:
    print(f'NG {failed} / {len(results)} 件。修正するか、残す理由を完了報告に書くこと。')
    sys.exit(1)

print(f'全 {len(results)} 件パス。次は成果物の全数目視（サンプリング禁止）。')
sys.exit(0)
