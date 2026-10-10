/*
 * 音声入力アプリ（デスクトップアプリ）の画面を、ブラウザで動かすための差し替え。
 * 実物の画面は裏側（Rust）へ問い合わせて描く。その問い合わせに、ここで架空のデータを返す。
 * 辞書の語・履歴の発話・候補はすべて架空。マイクも文字起こしも動かない。
 */
(function () {
  'use strict';

  var now = Math.floor(Date.now() / 1000);

  // 履歴1件。before は「辞書をかけた後・フィラーを落とす前」の文で、fillers はそこから落とす語
  function entry(id, minutesAgo, before, fillers, hits, finalText) {
    var removed = fillers.map(function (text) {
      return { text: text, at: Array.from(before.slice(0, before.indexOf(text))).length };
    });
    return {
      id: id,
      file_name: 'mock-' + id + '.wav',
      timestamp: now - minutesAgo * 60,
      saved: false,
      title: '',
      transcription_text: finalText,
      post_processed_text: null,
      post_process_prompt: null,
      post_process_requested: false,
      refine_trace: { raw: before, before_fillers: before, removed: removed, dict_hits: hits },
    };
  }

  var HISTORY = [
    entry(4, 3, 'えーと、東和金属工業さんのブラケットの件ですが、あのー、納期を一週間前倒しできますか',
      ['えーと、', 'あのー、'], ['東和金属工業'], '東和金属工業さんのブラケットの件ですが、納期を1週間前倒しできますか。'),
    entry(3, 18, '大成精機さんから、えー、フランジの見積依頼が来ています',
      ['えー、'], ['大成精機'], '大成精機さんから、フランジの見積依頼が来ています。'),
    entry(2, 41, '曲げ角度は、まあ、初品で測定してから流してください',
      ['まあ、'], [], '曲げ角度は、初品で測定してから流してください。'),
    entry(1, 95, '北陸テクノさんのハウジング上蓋は来週の月曜に出荷します',
      [], ['北陸テクノ'], '北陸テクノさんのハウジング上蓋は来週の月曜に出荷します。'),
  ];

  var DICTIONARY = [
    { surface: '東和金属工業', variants: ['東和金属興業', '藤和金属工業'], context: [], note: '', risk: 'safe', usage_count: 12 },
    { surface: '大成精機', variants: ['大勢精機', '大成製機'], context: [], note: '', risk: 'safe', usage_count: 7 },
    { surface: '北陸テクノ', variants: ['北陸テクノー'], context: [], note: '', risk: 'safe', usage_count: 5 },
    { surface: '三洋製作所', variants: ['山陽製作所'], context: [], note: '', risk: 'safe', usage_count: 4 },
    { surface: 'ブラケット', variants: ['ブラケト'], context: [], note: '', risk: 'safe', usage_count: 9 },
  ];

  var CANDIDATES = [
    { surface: 'ハウジング', kind: 'katakana', hint: null, count: 5 },
    { surface: '桐和', kind: 'honorific', hint: 'さん', count: 3 },
    { surface: 'フランジ', kind: 'katakana', hint: null, count: 3 },
    { surface: '三陽', kind: 'honorific', hint: '製作所', count: 2 },
  ];

  var settings = (window.__MOCK__ && window.__MOCK__.settings) || {};
  settings.jp_dictionary = DICTIONARY;
  settings.custom_words = [];
  settings.onboarding_completed = true;

  var MODEL = {
    id: settings.selected_model || 'qwen3-asr', name: 'Qwen3-ASR', description: '', filename: '',
    source: 'local', size_mb: 0, is_downloaded: true, is_downloading: false, partial_size: 0,
    is_directory: true, engine_type: 'qwen', accuracy_score: 0, speed_score: 0,
    supports_translation: false, is_recommended: true, supported_languages: ['ja'],
    supports_language_selection: false, is_custom: true, supports_streaming: false,
    supports_language_detection: false,
  };
  var MIC = { index: '0', name: 'マイク (USB Audio Device)', is_default: true };

  var HANDLERS = {
    get_app_settings: function () { return settings; },
    get_default_settings: function () { return settings; },
    get_dictionary_candidates: function () { return CANDIDATES; },
    get_dismissed_candidates: function () { return []; },
    get_history_entries: function () { return { entries: HISTORY, has_more: false }; },
    get_available_models: function () { return [MODEL]; },
    get_current_model: function () { return MODEL.id; },
    get_available_microphones: function () { return [MIC]; },
    get_selected_microphone: function () { return MIC.name; },
    get_available_output_devices: function () { return []; },
    get_windows_microphone_permission_status: function () {
      return { supported: true, overall_access: 'allowed', device_access: 'allowed', app_access: 'allowed', desktop_app_access: 'allowed' };
    },
    check_custom_sounds: function () { return { start: false, stop: false }; },
  };

  var callbackId = 0;
  window.__MOCK_CALLS__ = [];

  window.__TAURI_INTERNALS__ = {
    metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main', windowLabel: 'main' } },
    plugins: {},
    transformCallback: function () { callbackId += 1; return callbackId; },
    unregisterCallback: function () {},
    convertFileSrc: function (path) { return path; },
    invoke: function (cmd) {
      window.__MOCK_CALLS__.push(cmd);
      if (cmd.indexOf('plugin:event|listen') === 0) { callbackId += 1; return Promise.resolve(callbackId); }
      if (cmd.indexOf('plugin:') === 0) return Promise.resolve(null);
      return Promise.resolve(HANDLERS[cmd] ? HANDLERS[cmd]() : null);
    },
  };
  window.__TAURI_EVENT_PLUGIN_INTERNALS__ = { unregisterListener: function () {} };
  window.__TAURI_OS_PLUGIN_INTERNALS__ = {
    platform: 'windows', os_type: 'windows', family: 'windows', version: '10.0.26200',
    arch: 'x86_64', eol: '\r\n', exe_extension: 'exe',
  };
})();
