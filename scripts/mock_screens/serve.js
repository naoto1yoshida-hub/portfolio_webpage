/*
 * 再現画面の撮影用サーバー。
 *
 * 守秘義務で実データを見せられないシステムの画面を、次の組み合わせで再現する。
 *   - 画面の骨組み・CSS・JS = 実物のプロジェクトから撮影時に読み込む（このリポジトリには複製しない）
 *   - 画面に流すデータ       = ここにある架空データ（apps/*.js）
 * 実物のサーバー・DB・.env には一切つながない。
 *
 *   node scripts/mock_screens/serve.js <app> [port]
 *   例: node scripts/mock_screens/serve.js drawing 8031
 *
 * 実物のプロジェクト群の場所は、環境変数 MOCK_PROJECTS_DIR で変えられる
 * （既定はこのリポジトリの2つ上 = projects/）。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const appName = process.argv[2];
const port = Number(process.argv[3] || 8031);
const PROJECTS = process.env.MOCK_PROJECTS_DIR || path.resolve(__dirname, '..', '..', '..', '..');

let app;
try {
  app = require('./apps/' + appName + '.js');
} catch (e) {
  console.error('使い方: node serve.js <app> [port]   app = ' +
    fs.readdirSync(path.join(__dirname, 'apps')).map((f) => f.replace(/\.js$/, '')).join(' | '));
  console.error(String(e.message));
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2',
};

/* Jinja の継承（extends / block）だけを解く。式は各アプリの replace で置き換える */
function renderJinja(templatesDir, name) {
  let child = fs.readFileSync(path.join(templatesDir, name), 'utf8');
  const ext = child.match(/\{%\s*extends\s+["']([^"']+)["']\s*%\}/);
  if (!ext) return child;
  const blocks = {};
  child.replace(/\{%\s*block\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endblock\s*%\}/g, (m, key, body) => {
    blocks[key] = body;
    return '';
  });
  const base = fs.readFileSync(path.join(templatesDir, ext[1]), 'utf8');
  return base.replace(/\{%\s*block\s+(\w+)\s*%\}([\s\S]*?)\{%\s*endblock\s*%\}/g,
    (m, key, fallback) => (key in blocks ? blocks[key] : fallback));
}

function send(res, status, type, body) {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const route = url.pathname;

  // 1. 架空データを返す API
  const api = app.api && app.api(req, url);
  if (api) {
    if (api.stream) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(api.stream);
    } else {
      send(res, api.status || 200, api.type || MIME['.json'], typeof api.body === 'string' ? api.body : JSON.stringify(api.body));
    }
    return;
  }

  // 2. ページ（実物のテンプレートを読み、式と固有名詞を置き換える）
  const page = app.pages && app.pages[route];
  if (page) {
    let html = page.file
      ? fs.readFileSync(path.join(__dirname, 'apps', page.file), 'utf8')
      : renderJinja(path.join(PROJECTS, app.templatesDir), page.template);
    (page.replace || []).concat(app.replace || []).forEach(([from, to]) => { html = html.replace(from, to); });
    const left = html.match(/\{[{%][^}]*[%}]\}/);
    if (left) console.warn('[warn] 置き換え漏れのテンプレート式: ' + left[0]);
    send(res, 200, MIME['.html'], html);
    return;
  }

  // 3. 静的ファイル（実物の CSS・JS と、ここで持つ架空の素材）
  for (const [prefix, dir, own] of app.statics || []) {
    if (!route.startsWith(prefix)) continue;
    const root = own ? path.join(__dirname, 'apps', dir) : path.join(PROJECTS, dir);
    const file = path.join(root, decodeURIComponent(route.slice(prefix.length)));
    if (file.startsWith(root) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
      return;
    }
  }

  send(res, 404, 'text/plain; charset=utf-8', 'not found: ' + route);
}).listen(port, '127.0.0.1', () => {
  console.log('[' + appName + '] http://127.0.0.1:' + port + '/   (実物の参照元: ' + PROJECTS + ')');
});
