/*
 * 図面検索システムの再現画面。
 * 実物の検索画面（テンプレート・CSS・JS）に、架空の図面データを返す API をつなぐ。
 * 図番・客先・品名・単価はすべて架空。図面の絵もここで描いた架空の形状。
 */

const CUSTOMERS = ['三洋製作所', '東和金属工業', '大成精機', '北陸テクノ'];

// [図番, 品名, 客先, 単価, 受注日, 形状, 区分]
const ROWS = [
  ['SMP-1042-03', 'カバー（絞り）', 0, 2337, '2026-08-21', 'cover', 'archive'],
  ['SMP-1042-01', 'カバー（絞り）試作', 0, 2610, '2026-03-04', 'cover', 'archive'],
  ['SMP-0871-01', 'ブラケット', 1, 486, '2026-07-30', 'bracket', 'archive'],
  ['SMP-0871-02', 'ブラケット（左右対称）', 1, 512, '2026-06-12', 'bracket', 'archive'],
  ['SMP-0655-02', 'ベースプレート', 0, 312, '2026-08-02', 'plate', 'archive'],
  ['SMP-0930-01', 'フランジ付パイプ', 2, 1180, '2026-05-19', 'flange', 'archive'],
  ['SMP-0788-04', '取付金具', 1, 894, '2026-04-27', 'angle', 'archive'],
  ['SMP-1155-00', 'ハウジング上蓋', 3, null, null, 'cover', 'upload'],
  ['SMP-0612-05', 'シャーシ側板', 2, 1460, '2026-02-10', 'plate', 'archive'],
  ['SMP-0933-02', 'フランジ（φ120）', 2, 760, '2025-12-08', 'flange', 'archive'],
  ['SMP-0704-01', 'L型ステー', 3, 228, '2026-01-22', 'angle', 'archive'],
  ['SMP-1201-00', 'ダクト継手', 3, null, null, 'flange', 'upload'],
];

const ITEMS = ROWS.map(([dn, product, c, price, date, shape, source], i) => ({
  drawing_number: dn,
  product_name: product,
  customer_name: CUSTOMERS[c],
  latest_customer: CUSTOMERS[c],
  latest_unit_price: price,
  latest_order_date: date,
  source,
  thumbnail_url: '/mock/thumb/' + shape + '-' + (i % 3) + '.svg',
}));

/* ---------------------------------------------------------- 架空の図面の絵 */

const INK = '#1c2530';

function dim(x1, y1, x2, y2, label) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const vertical = x1 === x2;
  return '<g stroke="' + INK + '" stroke-width=".5" fill="none">' +
    '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>' +
    (vertical
      ? '<path d="M' + (x1 - 2) + ' ' + (y1 + 5) + 'L' + x1 + ' ' + y1 + 'L' + (x1 + 2) + ' ' + (y1 + 5) + 'M' + (x2 - 2) + ' ' + (y2 - 5) + 'L' + x2 + ' ' + y2 + 'L' + (x2 + 2) + ' ' + (y2 - 5) + '"/>'
      : '<path d="M' + (x1 + 5) + ' ' + (y1 - 2) + 'L' + x1 + ' ' + y1 + 'L' + (x1 + 5) + ' ' + (y1 + 2) + 'M' + (x2 - 5) + ' ' + (y2 - 2) + 'L' + x2 + ' ' + y2 + 'L' + (x2 - 5) + ' ' + (y2 + 2) + '"/>') +
    '</g><text x="' + (vertical ? mx - 4 : mx) + '" y="' + (vertical ? my : my - 3) + '" font-size="7" font-family="Arial, sans-serif" fill="' + INK + '" text-anchor="middle"' +
    (vertical ? ' transform="rotate(-90 ' + (mx - 4) + ' ' + my + ')"' : '') + '>' + label + '</text>';
}

const SHAPES = {
  // 絞りカバー: 角丸の外形と、内側の絞り線、四隅の穴
  cover: (v) => '<rect x="62" y="48" width="' + (176 + v * 8) + '" height="104" rx="18" fill="none" stroke="' + INK + '" stroke-width="1.4"/>' +
    '<rect x="78" y="62" width="' + (144 + v * 8) + '" height="76" rx="10" fill="none" stroke="' + INK + '" stroke-width=".7"/>' +
    [[76, 60], [224 + v * 8, 60], [76, 140], [224 + v * 8, 140]].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="3.2" fill="none" stroke="' + INK + '" stroke-width=".8"/>').join('') +
    dim(62, 166, 238 + v * 8, 166, String(176 + v * 8)) + dim(48, 48, 48, 152, '104'),
  // ブラケット: 曲げ線のある板と長穴
  bracket: (v) => '<path d="M70 50h150v40h-60v62H70z" fill="none" stroke="' + INK + '" stroke-width="1.4"/>' +
    '<line x1="70" y1="90" x2="160" y2="90" stroke="' + INK + '" stroke-width=".6" stroke-dasharray="6 2 1 2"/>' +
    '<rect x="' + (84 + v * 6) + '" y="112" width="40" height="10" rx="5" fill="none" stroke="' + INK + '" stroke-width=".8"/>' +
    '<circle cx="196" cy="70" r="6" fill="none" stroke="' + INK + '" stroke-width=".8"/>' +
    dim(70, 166, 220, 166, '150') + dim(236, 50, 236, 90, '40'),
  // ベースプレート: 長方形に穴の格子
  plate: (v) => '<rect x="56" y="54" width="188" height="92" fill="none" stroke="' + INK + '" stroke-width="1.4"/>' +
    [0, 1, 2, 3].map((i) => [72, 128].map((y) => '<circle cx="' + (80 + i * 46) + '" cy="' + y + '" r="' + (4 + v) + '" fill="none" stroke="' + INK + '" stroke-width=".8"/>').join('')).join('') +
    '<line x1="56" y1="100" x2="244" y2="100" stroke="' + INK + '" stroke-width=".5" stroke-dasharray="8 2 1 2"/>' +
    dim(56, 162, 244, 162, '188') + dim(42, 54, 42, 146, '92'),
  // フランジ: 同心円とボルト穴、十字の中心線
  flange: (v) => '<circle cx="150" cy="100" r="54" fill="none" stroke="' + INK + '" stroke-width="1.4"/>' +
    '<circle cx="150" cy="100" r="' + (22 + v * 3) + '" fill="none" stroke="' + INK + '" stroke-width="1.1"/>' +
    '<circle cx="150" cy="100" r="40" fill="none" stroke="' + INK + '" stroke-width=".4" stroke-dasharray="6 2 1 2"/>' +
    [0, 1, 2, 3, 4, 5].map((i) => '<circle cx="' + (150 + 40 * Math.cos(i * Math.PI / 3)).toFixed(1) + '" cy="' + (100 + 40 * Math.sin(i * Math.PI / 3)).toFixed(1) + '" r="4" fill="none" stroke="' + INK + '" stroke-width=".8"/>').join('') +
    '<path d="M86 100h128M150 36v128" stroke="' + INK + '" stroke-width=".4" stroke-dasharray="8 2 1 2"/>' +
    dim(96, 172, 204, 172, 'φ108'),
  // L型金具: 側面視と正面視の2面図
  angle: (v) => '<path d="M60 56h14v76h70v14H60z" fill="none" stroke="' + INK + '" stroke-width="1.4"/>' +
    '<rect x="170" y="56" width="' + (64 + v * 6) + '" height="90" fill="none" stroke="' + INK + '" stroke-width="1.4"/>' +
    '<circle cx="' + (190 + v * 3) + '" cy="78" r="5" fill="none" stroke="' + INK + '" stroke-width=".8"/>' +
    '<circle cx="' + (214 + v * 3) + '" cy="78" r="5" fill="none" stroke="' + INK + '" stroke-width=".8"/>' +
    '<line x1="170" y1="132" x2="' + (234 + v * 6) + '" y2="132" stroke="' + INK + '" stroke-width=".6" stroke-dasharray="4 2"/>' +
    dim(60, 162, 144, 162, '84') + dim(46, 56, 46, 146, '90'),
};

function thumb(name) {
  const m = name.match(/^(\w+)-(\d)\.svg$/);
  if (!m || !SHAPES[m[1]]) return null;
  // 右下は表題欄、外周は図枠
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 225">' +
    '<rect width="300" height="225" fill="#fff"/>' +
    '<rect x="8" y="8" width="284" height="209" fill="none" stroke="' + INK + '" stroke-width=".8"/>' +
    SHAPES[m[1]](Number(m[2])) +
    '<g fill="none" stroke="' + INK + '" stroke-width=".6"><rect x="196" y="186" width="96" height="31"/><path d="M196 196h96M196 206h96M236 186v31"/></g>' +
    '</svg>';
}

/* ------------------------------------------------------------------ 設定 */

module.exports = {
  templatesDir: 'nagase_drawing_search/app/templates',
  pages: {
    '/': { template: 'search.html', replace: [[/\{\{\s*"\{:,\}"\.format\(total\)\s*\}\}/, '17,588']] },
  },
  statics: [['/static/', 'nagase_drawing_search/public']],
  api(req, url) {
    if (url.pathname.startsWith('/mock/thumb/')) {
      const svg = thumb(url.pathname.slice('/mock/thumb/'.length));
      return svg ? { type: 'image/svg+xml', body: svg } : { status: 404, type: 'text/plain', body: 'no thumb' };
    }
    if (url.pathname === '/api/drawings') {
      const has = (key, field) => {
        const v = (url.searchParams.get(key) || '').trim();
        return (item) => !v || String(item[field] || '').includes(v);
      };
      let items = ITEMS.filter(has('q', 'drawing_number')).filter(has('customer', 'latest_customer')).filter(has('product', 'product_name'));
      const sort = url.searchParams.get('sort');
      if (sort === 'price_desc') items = items.slice().sort((a, b) => (b.latest_unit_price || 0) - (a.latest_unit_price || 0));
      if (sort === 'price_asc') items = items.slice().sort((a, b) => (a.latest_unit_price || 0) - (b.latest_unit_price || 0));
      return { body: { total: items.length, items } };
    }
    if (url.pathname === '/api/annotations/batch') return { body: {} };
    if (/^\/api\/drawing\/.+\/annotations$/.test(url.pathname)) return { body: { pages: {} } };
    return null;
  },
};
