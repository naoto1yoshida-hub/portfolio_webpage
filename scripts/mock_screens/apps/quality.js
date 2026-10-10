/*
 * 品質管理サポートAIチャットボットの再現画面。
 * 実物のチャット画面（テンプレート・CSS・JS）に、架空の不適合記録を返す API をつなぐ。
 * 図番・客先・不具合の内容・対策・メモはすべて架空。
 */

const HITS = [
  {
    id: 1, rank: 1, tag: '[第59期 不具合対策書 2511-01]', match_type: '図番一致',
    drawing_no: 'SMP-0871-01', product_name: 'ブラケット', customer: '東和金属工業',
    notes: [{ body: '金型の交換周期を 30,000 ショットに見直し済み', author: '品質 六子' }], note_count: 1,
  },
  {
    id: 2, rank: 1, tag: '[第58期 工程不良報告書 2406-03]', match_type: '図番一致',
    drawing_no: 'SMP-0871-01', product_name: 'ブラケット', customer: '東和金属工業',
  },
  {
    id: 3, rank: 2, tag: '[第59期 顧客クレーム 2509-02]', match_type: '品名類似',
    drawing_no: 'SMP-0871-02', product_name: 'ブラケット（左右対称）', customer: '東和金属工業',
  },
];

const ANSWER =
  '図番 SMP-0871-01（ブラケット / 東和金属工業）では、過去に2件の不適合記録があります。\n\n' +
  '1. 曲げ角度の公差外れ（規格 90°±0.5 に対して +1.2°）。原因は曲げ金型の摩耗で、' +
  '金型の交換と、初品での角度測定の追加が対策として記録されています。' +
  '[第59期 不具合対策書 2511-01]\n\n' +
  '2. 長穴の位置ずれ（0.4mm）。位置決めピンの緩みが原因で、始業点検の項目に追加されています。' +
  '[第58期 工程不良報告書 2406-03]\n\n' +
  '参考: 図番は一致しませんが、同じ客先の類似品 SMP-0871-02 で、バリ残りの顧客クレームが1件あります。' +
  '[第59期 顧客クレーム 2509-02]\n' +
  'こちらは図番が異なるため、根拠ではなく参考として扱ってください。';

function sse() {
  const lines = ['event: meta', 'data: ' + JSON.stringify({ mode: 'search', hits: HITS }), ''];
  // 実物と同じく、回答は少しずつ届く
  for (let i = 0; i < ANSWER.length; i += 24) {
    lines.push('data: ' + JSON.stringify({ delta: ANSWER.slice(i, i + 24) }), '');
  }
  lines.push('event: done', 'data: {}', '');
  return lines.join('\n') + '\n';
}

module.exports = {
  // 撮影時に画面へ入力する質問
  question: '図番 SMP-0871-01 で過去に不具合はあった？',
  templatesDir: 'nagase_quality/app/templates',
  pages: {
    '/': {
      template: 'chat.html',
      replace: [
        [/\{\{\s*'active' if active == 'chat'\s*\}\}/g, 'active'],
        [/\{\{\s*'active' if active == '\w+'\s*\}\}/g, ''],
        // 入力例に含まれる実在の図番・客先名を架空のものへ
        [/図番 [\d-]+ で過去に不具合はあった？/g, '図番 SMP-0871-01 で過去に不具合はあった？'],
        [/data-q="[^"]*さんの案件で過去のクレームは？">[^<]*</g, 'data-q="東和金属工業さんの案件で過去のクレームは？">東和金属工業さんの案件で過去のクレームは？<'],
      ],
    },
  },
  statics: [['/static/', 'nagase_quality/public']],
  api(req, url) {
    if (url.pathname === '/api/chat') return { stream: sse() };
    return null;
  },
};
