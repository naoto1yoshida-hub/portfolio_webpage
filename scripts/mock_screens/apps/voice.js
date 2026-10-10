/*
 * ローカル完結の音声入力アプリの再現画面。
 * 実物はデスクトップアプリ（Tauri）。画面部分（React）は実物の開発サーバーからそのまま読み込み、
 * 裏側への問い合わせだけを apps/voice_ipc.js の架空データで返す。
 *
 * 先に実物の画面の開発サーバーを立てておく（実物のフォルダで `npx vite`。ポート 1420）。
 * 設定の初期値は実機の設定ファイルを撮影時に読む（辞書と APIキー類はここで捨てる）。
 */
const fs = require('fs');
const path = require('path');

const VITE = process.env.MOCK_VOICE_VITE || 'http://localhost:1420';
const SETTINGS = process.env.MOCK_VOICE_SETTINGS ||
  path.join(process.env.APPDATA || '', 'com.pais.handy', 'settings_store.json');

function loadSettings() {
  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS, 'utf8').replace(/^﻿/, '')).settings || {};
  } catch (e) {
    console.warn('[warn] 設定ファイルを読めませんでした: ' + e.message);
  }
  // 実機の辞書と、鍵・秘密の類はページへ渡さない
  for (const key of Object.keys(settings)) {
    if (/key|secret|token|password/i.test(key)) delete settings[key];
  }
  settings.jp_dictionary = [];
  settings.custom_words = [];
  return settings;
}

module.exports = {
  pages: {
    '/': {
      render() {
        return '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><title>N-Voice</title>' +
          '<script>window.__MOCK__ = { settings: ' + JSON.stringify(loadSettings()).replace(/</g, '\\u003c') + ' };</script>' +
          '<script src="/mock/voice_ipc.js"></script>' +
          // React の開発用の前置き（実物の index.html が自動で入れているものと同じ役目）
          '<script type="module">import RefreshRuntime from "' + VITE + '/@react-refresh";' +
          'RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$ = () => {};' +
          'window.$RefreshSig$ = () => (type) => type;window.__vite_plugin_react_preamble_installed__ = true;</script>' +
          '<script type="module" src="' + VITE + '/@vite/client"></script>' +
          '<script type="module" src="' + VITE + '/src/main.tsx"></script>' +
          '</head><body><div id="root"></div></body></html>';
      },
    },
    // 撮影用。同じ画面を3つ並べ、それぞれ別のタブ（設定・履歴・辞書）を開く。
    // 実物のウィンドウは幅 420px と細く、1枚では横長の枠に収まらないため
    '/wall': {
      render() {
        const frame = (tab) => '<iframe src="/" data-tab="' + tab + '" title="' + tab + '"></iframe>';
        return '<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><title>N-Voice</title><style>' +
          'html,body{margin:0;height:100%;background:#e7e7e2}' +
          'body{display:flex;justify-content:center;align-items:center;gap:36px}' +
          'iframe{width:420px;height:760px;border:1px solid #cfcfc8;border-radius:10px;background:#fafaf7;box-shadow:0 12px 40px rgba(0,0,0,.14)}' +
          '</style></head><body>' + frame('設定') + frame('履歴') + frame('辞書') +
          '<script>document.querySelectorAll("iframe").forEach(function(f){var t=setInterval(function(){' +
          'var b=[].slice.call(f.contentDocument.querySelectorAll(".vs-tab")).filter(function(x){return x.textContent.indexOf(f.dataset.tab)===0})[0];' +
          'if(b){b.click();clearInterval(t);f.dataset.ready="1"}},200)})</script></body></html>';
      },
    },
  },
  statics: [['/mock/', '.', true]],
};
