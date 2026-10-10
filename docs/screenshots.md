# 実UI画面スクリーンショットの作り方

`static/images/screens/` に置いている画面は、**ローカルにダミーデータを投入して撮影したもの**です。
クライアントの実データは一切含みません。更新するときは以下の手順を繰り返します。

## 原則（守らないと公開できない）

1. **実データに触れない。** 対象プロジェクトを一時ディレクトリへ複製し、`.env` を削除してから起動する。
   `.env` を残すと `DATABASE_URL` 経由で本番の Neon Postgres につながる。**複製直後に必ず消すこと。**
2. **クライアント名を伏せる。** アプリ名（`Nagase Tasks` / `Nagase Estimate`）はサイドバーとフッターに出る。
   テンプレートを一括置換してから撮る。
3. **実在の社員名を伏せる。** 見積ツールの操作者プルダウンには実名が入っている。置換する。
4. **数字のスケールを確かめる。** 見積ツールの材料費・梱包材費・送料は「1個あたり」で単価計算に入る。
   総額を入れると単価が桁違いになる。撮る前に金額サマリーが現実的な水準か目視する。
5. 撮影後、**公開する画像を1枚ずつ開いて**、クライアント名・実名・実データが残っていないか確認する。

## 手順

### 1. 複製して .env を消す

```powershell
$src = "C:\Users\naoto\ai_company\projects\nagase_tasks"
$dst = "<一時ディレクトリ>\shot_tasks"
Get-ChildItem $src -Exclude @('.git','.venv','*.db','.vercel','__pycache__') |
  Copy-Item -Destination $dst -Recurse -Force
Get-ChildItem $dst -Force -Filter ".env*" |
  Where-Object { $_.Name -ne '.env.example' } | Remove-Item -Force
```

### 2. クライアント名・実名を伏せる

```powershell
Get-ChildItem "$dst\app\templates" -Filter *.html | ForEach-Object {
  $c = Get-Content $_.FullName -Raw -Encoding UTF8
  $c = $c -replace 'Nagase Tasks','社内タスク管理'          # 見積ツールは 'Nagase Estimate' → '見積もり作成ツール'
  $c = $c -replace '<option>松本</option>','<option>見積担当</option>'  # 見積ツールのみ
  Set-Content $_.FullName -Value $c -NoNewline -Encoding UTF8
}
```

### 3. ダミーデータを投入して起動

`scripts/demo_seeds/` に投入スクリプトを置いてあります。対象プロジェクトの `scripts/` へコピーして実行します。

```powershell
$env:APP_USERNAME='demo'; $env:APP_PASSWORD='demo'
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue   # 念のため

# 見積ツールはマスター投入が先
python scripts/seed_masters.py
python scripts/seed_demo.py

python -m uvicorn app.main:app --port 8021
```

### 4. 撮影

Playwright で `http_credentials={"username":"demo","password":"demo"}`、
`viewport 1440x900`、`device_scale_factor=2` で撮ります。

### 5. Web用に整える

```
python <一時ディレクトリ>/prep_screens.py
```

余白を切り、幅1600pxへ縮小して `static/images/screens/` に保存します。
元の 2880x1800 のままだと1枚300KB超になるため必ず通します。

### 6. サイトに登録する

- ケース詳細に出す場合: `data/works.py` の該当ケースに `screens` と `screens_note` を足す
- トップの継続導入ブロックに出す場合: `data/profile.py` の `CONTINUOUS["screen"]`

`alt` は「何が写っているか」を具体的に書きます（preflight が空 alt を落とします）。

### 7. 検査

```
python scripts/preflight.py
```

## 実物を起動できないシステムの撮り方（再現画面・2026-10-10 追加）

実データやDBが要って上の手順では起動できないシステムは、**画面の骨組み（テンプレート・CSS・JS）を実物から読み、
画面に流すデータだけを架空のものに差し替えて**撮ります。実物のサーバー・DB・`.env` にはつなぎません。
撮影用の仕組みは `scripts/mock_screens/` にあります。実物のコードはこのリポジトリに複製しません
（撮影時に隣のプロジェクトから読むだけ）。

```powershell
# 実物のプロジェクト群の場所（既定はこのリポジトリの2つ上 = projects/）
$env:MOCK_PROJECTS_DIR = "C:\Users\naoto\ai_company\projects"

node scripts/mock_screens/serve.js drawing 8031   # 図面検索。開いて図番欄に SMP と入れる
node scripts/mock_screens/serve.js quality 8032   # 品質管理ボット。apps/quality.js の question を送信する
node scripts/mock_screens/serve.js voice 8035     # 音声入力アプリ。/wall が3タブを並べた撮影用の画面
```

- **図面検索** — 実物の検索画面に、架空の図面12件を返す API をつなぐ。図面の絵は `apps/drawing.js` が描く架空の形状
- **品質管理ボット** — 実物のチャット画面に、架空の不適合記録と出典を返す API をつなぐ。
  テンプレートに書かれた入力例（実在の図番・客先名）は `apps/quality.js` の replace で架空のものに置き換えている
- **音声入力アプリ** — デスクトップアプリ。先に実物のフォルダで `npx vite --port 1420 --strictPort` を立て、
  裏側（Rust）への問い合わせに `apps/voice_ipc.js` が架空データを返す。設定の初期値は実機の設定ファイルを読むが、
  辞書と鍵の類はページへ渡さない。`http://localhost:8035/wall`（`127.0.0.1` ではなく `localhost`）で開く
- **EC在庫ダッシュボード** — こちらは実アプリを起動する。上の「複製して .env を消す」と同じ要領で一時フォルダへ複製し
  （`credentials/` も除く）、`app/api/sync/route.ts` を `apps/ec_sync_route.ts.txt` の中身で置き換え、
  サイドバーとメタ情報のクライアント名を消してから `next dev --webpack -p 8033` で起動する。
  `node_modules` をリンクで共有する場合、既定の Turbopack はリンクを拒否するので `--webpack` が要る。
  `http://localhost:8033` で開き、Cookie `hugmuu_auth=1` を付ける。表が横に収まるよう幅 1920 で撮る

撮ったら、公開する画像を1枚ずつ開いて、クライアント名・実名・実データが残っていないか確かめます。
`data/works.py` の `screens` には `label` に「実際の画面（架空データで再現）」と入れ、
`screens_note` に何を差し替えたかを書きます。

## 図面検索について（オーナー確定 2026-08-22）

**実物のシステムを動かして撮ることはしない。** 画面に受注単価と実図番がそのまま出るうえ、
PostgreSQL + pgvector と Vercel Blob が要りローカルでは起動できないため。この判断は確定済みです。
掲載している画面は、上の再現画面の方式（実物は動かさず、架空データだけを流す）で撮ったものです。
