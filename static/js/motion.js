/* ==========================================================================
   TEGG Engineering — 動き（GSAP + ScrollTrigger）

   script.js はナビ・FAQ・フォーム・.rise の表示を持つ。ここは動きだけを持つ。
   - 初回演出（トップページで1セッションに1回）
   - 見出しの1文字ずつのせり上げ / ヒーローの下線と数値のカウントアップ
   - スクロールに連動する動き（ヒーローが沈む / 読了バー / 進め方の横移動）

   html.js-motion が無いとき（動きを減らす設定）は何もしない。
   GSAP が読み込めなかったときは js-motion を外して、すべて静的に戻す。
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('js-motion')) return;

  var intro = document.querySelector('.intro');

  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('js-motion', 'js-intro');
    if (intro) intro.remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('gsap-ready');

  var EASE = 'expo.out';

  /* ------------------------------------------------------- 文字の分割 */

  // 見出しの中の文字を1文字ずつ包む。<br> と <em> はそのまま残す
  function splitChars(el) {
    var chars = [];
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());

    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(child.textContent).forEach(function (c) {
            if (/\s/.test(c)) {
              frag.appendChild(document.createTextNode(c));
              return;
            }
            var outer = document.createElement('span');
            outer.className = 'mch';
            outer.setAttribute('aria-hidden', 'true');
            var inner = document.createElement('span');
            inner.className = 'mci';
            inner.textContent = c;
            outer.appendChild(inner);
            frag.appendChild(outer);
            chars.push(inner);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    }

    walk(el);
    el.classList.add('is-split');
    return chars;
  }

  /* ------------------------------------------------- 数値のカウントアップ */

  // 「5」「17,588」のような数字だけの値を 0 から数え上げる。「認定」などは触らない
  function prepareCount(el) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return null;
    var raw = node.textContent.trim();
    if (!/^[\d,]+$/.test(raw)) return null;
    var to = parseInt(raw.replace(/,/g, ''), 10);
    var comma = raw.indexOf(',') !== -1;
    var state = { v: 0 };
    node.textContent = '0';
    return function () {
      gsap.to(state, {
        v: to,
        duration: 1.6,
        ease: 'power3.out',
        onUpdate: function () {
          var n = Math.round(state.v);
          node.textContent = comma ? n.toLocaleString('en-US') : String(n);
        }
      });
    };
  }

  /* ---------------------------------------------------------- 読了バー */

  var header = document.querySelector('.hdr');
  if (header) {
    var bar = document.createElement('span');
    bar.className = 'progress-bar';
    header.appendChild(bar);
    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
    });
  }

  /* ------------------------------------------------------------ ヒーロー */

  var hero = document.querySelector('.hero');
  var heroTl = null;

  if (hero) {
    var title = hero.querySelector('.hero__title');
    var em = title ? title.querySelector('em') : null;
    var heroChars = title ? splitChars(title) : [];
    var others = hero.querySelectorAll('.eyebrow, .hero__lead, .hero__figures, .hero__actions, .hero__meta');
    var heroCounts = Array.prototype.map.call(hero.querySelectorAll('.figure__num'), prepareCount)
      .filter(Boolean);

    gsap.set(heroChars, { yPercent: 110 });
    gsap.set(others, { opacity: 0, y: 24 });

    heroTl = gsap.timeline({ paused: true })
      .to(heroChars, { yPercent: 0, duration: 1, ease: EASE, stagger: 0.028 })
      .to(others, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.08 }, '-=0.7')
      .add(function () { heroCounts.forEach(function (run) { run(); }); }, '-=0.6');
    if (em) heroTl.to(em, { '--line': 1, duration: 0.8, ease: EASE }, '-=1.1');

    // スクロールに合わせてヒーローが奥へ沈む
    gsap.to(hero.querySelector('.hero__inner'), {
      yPercent: 14,
      opacity: 0.35,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ------------------------------------------------------ セクション見出し */

  document.querySelectorAll('.sec-head__title, .page-head__title, .case__title').forEach(function (el) {
    var chars = splitChars(el);
    gsap.set(chars, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: function () {
        gsap.to(chars, { yPercent: 0, duration: 0.95, ease: EASE, stagger: 0.024 });
      }
    });
  });

  // 下層ページの数値（事例ページの stats）
  document.querySelectorAll('.page-head .figure__num').forEach(function (el) {
    var run = prepareCount(el);
    if (!run) return;
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: run });
  });

  /* ------------------------------------------------------------ 実績カード */

  var cards = document.querySelectorAll('.cards > *');
  if (cards.length) {
    gsap.set(cards, { opacity: 0, y: 48 });
    ScrollTrigger.batch(cards, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: 0.1 });
      }
    });
  }

  /* ------------------------------------------ 太陽型の実績図（ポワポワ動く） */

  var orbit = document.querySelector('.orbit');
  if (orbit) {
    var sun = orbit.querySelector('.orbit__sun');
    var planets = orbit.querySelectorAll('.planet');
    var floats = [];

    gsap.set(sun, { scale: 0.6, opacity: 0 });
    gsap.set(planets, { scale: 0, opacity: 0 });

    // 画面に入ったら、中央の Works → 周りの丸の順に弾んで出る
    ScrollTrigger.create({
      trigger: orbit,
      start: 'top 75%',
      once: true,
      onEnter: function () {
        gsap.to(sun, { scale: 1, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.6)' });
        gsap.to(planets, {
          scale: 1, opacity: 1, duration: 1.1, ease: 'elastic.out(1, 0.55)', stagger: 0.09, delay: 0.25,
          onComplete: startFloat
        });
      }
    });

    // 丸ごとに違うリズムでゆっくり漂う
    function startFloat() {
      Array.prototype.forEach.call(planets, function (p) {
        floats.push(p._float = gsap.to(p, {
          x: 'random(-7, 7)',
          y: 'random(-11, 11)',
          duration: 'random(2.2, 3.4)',
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          repeatRefresh: true
        }));
      });
    }

    // 画面の外では漂いを止める
    ScrollTrigger.create({
      trigger: orbit,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: function (st) {
        floats.forEach(function (t) { st.isActive ? t.resume() : t.pause(); });
      }
    });

    // 触ると弾む
    Array.prototype.forEach.call(planets, function (p) {
      var disc = p.querySelector('.planet__disc');
      var icon = p.querySelector('.app-icon');
      // 触っている間はその丸の漂いを止める（押す直前に的が逃げないように）
      var enter = function () {
        if (p._float) p._float.pause();
        gsap.to(disc, { scale: 1.14, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
        gsap.fromTo(icon, { rotation: 0 }, {
          keyframes: [{ rotation: -12 }, { rotation: 9 }, { rotation: -4 }, { rotation: 0 }],
          duration: 0.6, ease: 'sine.inOut', overwrite: 'auto'
        });
      };
      var leave = function () {
        if (p._float) p._float.resume();
        gsap.to(disc, { scale: 1, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      };
      p.addEventListener('mouseenter', enter);
      p.addEventListener('focus', enter);
      p.addEventListener('mouseleave', leave);
      p.addEventListener('blur', leave);
    });
  }

  /* ---------------------------------------- 進め方：縦スクロールで横に流れる */

  var process = document.getElementById('process');
  if (process) {
    var steps = process.querySelector('.steps');
    var rail = document.createElement('div');
    rail.className = 'steps-rail';
    rail.setAttribute('aria-hidden', 'true');
    rail.appendChild(document.createElement('span'));
    steps.parentNode.insertBefore(rail, steps.nextSibling);

    gsap.matchMedia().add('(min-width: 1001px)', function () {
      var wrap = steps.parentNode;
      var distance = function () { return Math.max(0, steps.scrollWidth - wrap.clientWidth); };

      gsap.to(steps, {
        x: function () { return -distance(); },
        ease: 'none',
        scrollTrigger: {
          trigger: process,
          pin: true,
          start: 'top top',
          end: function () { return '+=' + distance(); },
          scrub: 1,
          invalidateOnRefresh: true,
          // 横に流れる間は .rise の表示判定（画面内に入ったか）が当てにならない。
          // 速くスクロールすると最後のステップが一度も画面に入らず隠れたまま残るため、区間に入った時点で全部出す
          onToggle: function () {
            Array.prototype.forEach.call(steps.children, function (el) { el.classList.add('is-in'); });
          },
          onUpdate: function (st) { gsap.set(rail.firstChild, { scaleX: st.progress }); }
        }
      });
    });
  }

  /* ---------------------------------------------------------- 開始の合図 */

  function playHero() {
    if (heroTl) heroTl.play();
  }

  if (intro && root.classList.contains('js-intro')) {
    var count = intro.querySelector('.intro__count');
    var tick = { v: 0 };
    gsap.to(tick, {
      v: 100,
      duration: 1.3,
      ease: 'power2.out',
      onUpdate: function () { count.textContent = Math.round(tick.v); },
      onComplete: function () {
        intro.classList.add('is-done');
        gsap.delayedCall(0.35, playHero);
        gsap.delayedCall(1, function () { intro.remove(); root.classList.remove('js-intro'); });
      }
    });
  } else {
    if (intro) intro.remove();
    playHero();
  }

  // 固定表示（pin）の開始位置は作成時のページの高さで決まる。
  // 後から画像（遅延読み込み含む）やWebフォントが届いてページが伸びると開始位置がずれ、
  // 固定された「進め方」の裏を上の節の文字が流れて重なる。高さが変わるたびに計算し直す
  var refreshTimer = null;
  function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function () { ScrollTrigger.refresh(); }, 120);
  }
  if ('ResizeObserver' in window) {
    var lastHeight = 0;
    new ResizeObserver(function () {
      var h = document.body.scrollHeight;
      if (Math.abs(h - lastHeight) > 1) { lastHeight = h; scheduleRefresh(); }
    }).observe(document.body);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleRefresh);
  window.addEventListener('load', scheduleRefresh);
})();
