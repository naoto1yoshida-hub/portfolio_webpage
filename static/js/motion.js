/* ==========================================================================
   TEGG Engineering — 動き

   script.js はナビ・FAQ・フォーム・.rise の表示を持つ。ここは動きだけを持つ。
   - 背景の線の輪（canvas）
   - 冒頭演出の進行（html[data-load] を 0 → 1 → 2 と進める。見た目は CSS が持つ）
   - ヒーローの名前の組み上げ（GSAP）
   - 見出しと宣言文のせり上げ（GSAP + ScrollTrigger）

   html.js-motion が無いとき（動きを減らす設定）は、輪を静止画で1回描くだけ。
   GSAP が読み込めなかったときは js-motion を外して、すべて静的に戻す。
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var motion = root.classList.contains('js-motion');

  /* ------------------------------------------------------- 背景の線の輪 */

  // 太い円が1本と、その一部だけがほどけて波打つ細い線の束
  (function ring() {
    var canvas = document.querySelector('.ring');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var size = 0;
    var STRANDS = 8;
    var STEPS = 220;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = canvas.clientWidth;
      canvas.width = canvas.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(t) {
      var c = size / 2;
      var r = size * 0.43;
      ctx.clearRect(0, 0, size, size);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
      ctx.lineWidth = Math.max(2, size * 0.008);
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.stroke();

      // ほどける範囲の中心は、ゆっくり円周を回る
      var center = Math.PI * 0.62 + t * 0.05;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      for (var s = 1; s <= STRANDS; s++) {
        ctx.beginPath();
        for (var i = 0; i <= STEPS; i++) {
          var a = (i / STEPS) * Math.PI * 2;
          var d = Math.atan2(Math.sin(a - center), Math.cos(a - center));
          var env = Math.abs(d) < 1.15 ? Math.pow(Math.cos((d / 1.15) * Math.PI / 2), 2) : 0;
          var wave = Math.sin(d * 5 + t * 0.6 + s * 0.35) * 0.6 + Math.sin(d * 11 - t * 0.4) * 0.4;
          var rr = r + env * (s / STRANDS) * size * 0.07 * (0.55 + wave * 0.45);
          var x = c + Math.cos(a) * rr;
          var y = c + Math.sin(a) * rr;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    }

    resize();
    draw(0);
    window.addEventListener('resize', function () { resize(); draw(0); });
    if (!motion) return;

    var last = 0;
    function loop(now) {
      requestAnimationFrame(loop);
      if (document.hidden || now - last < 33) return; // 30fps で足りる
      last = now;
      draw(now / 1000);
    }
    requestAnimationFrame(loop);
  })();

  if (!motion) return;

  var opening = document.querySelector('.opening');
  var title = document.querySelector('.title');

  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.remove('js-motion', 'js-opening');
    root.setAttribute('data-load', '2');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var EASE = 'expo.out';

  /* ------------------------------------------------- 名前の組み上げ */

  // 上段（極太）は1文字ずつ左右から飛び込み、明滅して、縦に落ちて並ぶ。
  // その間、中央で小さな写しが先に組まれ、細い線と帯が横切る。
  // 下段（明朝）は斜め45度の帯に切られ、帯ごとに滑り込んで1行になる。
  var SLICES = 14;
  var titleParts = null;

  function chars(el, cls) {
    var text = el.textContent.trim();
    el.textContent = '';
    return Array.from(text).map(function (c) {
      var span = document.createElement('span');
      span.className = cls;
      span.textContent = c;
      el.appendChild(span);
      return span;
    });
  }

  function fx(parent) {
    var el = document.createElement('i');
    el.className = 'title__fx';
    parent.appendChild(el);
    return el;
  }

  function buildTitle() {
    var zoom = title.querySelector('.title__zoom');
    var mark = title.querySelector('.title__mark');
    var name = title.querySelector('.title__name');
    var mini = title.querySelector('.title__mini');

    var nameText = name.textContent.trim();
    name.textContent = '';
    var base = document.createElement('span');
    base.className = 'base';
    base.textContent = nameText;
    name.appendChild(base);

    var slices = [];
    for (var i = 0; i < SLICES; i++) {
      var slice = document.createElement('span');
      slice.className = 'slice';
      slice.textContent = nameText;
      name.appendChild(slice);
      slices.push(slice);
    }
    name.classList.add('is-sliced');

    titleParts = {
      zoom: zoom,
      mark: mark,
      name: name,
      base: base,
      mini: mini,
      letters: chars(mark, 'ltr'),
      miniLetters: chars(mini, 'ltr'),
      slices: slices,
      lines: [fx(zoom), fx(zoom)],
      diagonals: [fx(zoom), fx(zoom)],
      bar: fx(zoom),
      roles: title.querySelector('.title__roles')
    };
  }

  // 2行の幅を組みの幅に合わせ、線・帯・斜めの切り口を置き直す
  function fitTitle() {
    var p = titleParts;
    if (!p) return;
    var width = title.clientWidth;

    title.style.setProperty('--mark-size', '100px');
    title.style.setProperty('--name-size', '100px');
    var first = p.letters[0];
    var lastLetter = p.letters[p.letters.length - 1];
    // 字間は各文字の後ろに付くので、最後の1文字ぶんを引く
    var tracking = parseFloat(getComputedStyle(p.mark).letterSpacing) || 0;
    var markWidth = lastLetter.offsetLeft + lastLetter.offsetWidth - first.offsetLeft - tracking;
    var nameWidth = p.base.offsetWidth;
    var markSize = 100 * width / markWidth;
    var nameSize = 100 * width / nameWidth;
    title.style.setProperty('--mark-size', markSize + 'px');
    title.style.setProperty('--name-size', nameSize + 'px');

    var h = p.name.offsetHeight;
    var band = (width + h) / SLICES;
    p.slices.forEach(function (slice, i) {
      var x = i * band;
      slice.style.clipPath = 'polygon(' +
        x + 'px 0,' + (x + band + 0.6) + 'px 0,' +
        (x + band - h + 0.6) + 'px ' + h + 'px,' + (x - h) + 'px ' + h + 'px)';
    });
    p.sliceTravel = h;

    var markMid = p.mark.offsetTop + p.mark.offsetHeight / 2;
    var thick = Math.max(4, markSize * 0.085);
    p.bar.style.cssText = 'left:27%;width:47%;height:' + thick + 'px;top:' + (markMid - thick / 2) + 'px';
    p.lines[0].style.cssText = 'left:-4%;width:62%;height:2px;top:' + (markMid + markSize * 0.16) + 'px';
    p.lines[1].style.cssText = 'left:38%;width:66%;height:2px;top:' + (markMid - markSize * 0.2) + 'px';
    p.diagonals[0].style.cssText = 'left:16%;width:26%;height:1px;top:' + markMid + 'px;rotate:-58deg';
    p.diagonals[1].style.cssText = 'left:62%;width:30%;height:1px;top:' + markMid + 'px;rotate:-58deg';
    p.width = width;
  }

  // 左から伸びて、右へ抜ける線
  function sweep(tl, el, at, grow, hold, shrink) {
    tl.set(el, { visibility: 'visible', scaleX: 0, transformOrigin: '0% 50%' }, at)
      .to(el, { scaleX: 1, duration: grow, ease: 'power2.out' }, at)
      .set(el, { transformOrigin: '100% 50%' }, at + grow + hold)
      .to(el, { scaleX: 0, duration: shrink, ease: 'power2.in' }, at + grow + hold)
      .set(el, { visibility: 'hidden' }, at + grow + hold + shrink);
  }

  // 1コマ（1/30秒）ずつ点いて消える
  function flicker(tl, el, at, pattern) {
    pattern.forEach(function (on, i) {
      tl.set(el, { autoAlpha: on }, at + i * 0.0334);
    });
  }

  function playTitle(delay) {
    var p = titleParts;
    var W = p.width;
    var n = p.letters.length;
    var step = Math.min(0.16, 0.62 / Math.max(1, n - 1));
    var tl = gsap.timeline({ delay: delay });

    gsap.set(p.zoom, { scale: 0.94 });
    gsap.set(p.letters, { autoAlpha: 0 });
    gsap.set(p.miniLetters, { autoAlpha: 0 });
    gsap.set(p.slices, { autoAlpha: 0 });
    title.classList.add('is-ready');

    // 4秒かけて、わずかに寄る
    tl.to(p.zoom, { scale: 1, duration: 4, ease: 'none' }, 0);

    // 最初の一瞬、斜めの線が走る（傾けてあるので、中心から伸び縮みさせる）
    [[p.diagonals[0], 0.1], [p.diagonals[1], 0.8]].forEach(function (d) {
      tl.set(d[0], { visibility: 'visible', scaleX: 0, transformOrigin: '50% 50%' }, d[1])
        .to(d[0], { scaleX: 1, duration: 0.12, ease: 'power2.out' }, d[1])
        .to(d[0], { scaleX: 0, duration: 0.14, ease: 'power2.in' }, d[1] + 0.2)
        .set(d[0], { visibility: 'hidden' }, d[1] + 0.34);
    });

    // 中央の小さな写し。先に組まれ、大きな字が揃ったあとで消える
    tl.set(p.mini, { visibility: 'visible' }, 0.4)
      .fromTo(p.mini, { scale: 0.92 }, { scale: 1, duration: 1.6, ease: 'none' }, 0.4);
    p.miniLetters.forEach(function (letter, i) {
      flicker(tl, letter, 0.4 + i * step * 0.8, [1, 0, 1, 0, 1]);
    });
    flicker(tl, p.mini, 2.0, [0, 1, 0, 1, 0]);

    // 大きな字。左右交互に遠くから入り、明滅し、縦に落ちて並ぶ
    p.letters.forEach(function (letter, i) {
      var at = 0.4 + i * step;
      var side = i % 2 ? 1 : -1;
      var row = (i % 2 ? -1 : 1) * W * 0.17;
      gsap.set(letter, { x: side * W * (0.5 + (i % 3) * 0.22), y: row });
      tl.set(letter, { autoAlpha: 1 }, at)
        .to(letter, { x: 0, duration: 0.17, ease: 'power3.out' }, at);
      flicker(tl, letter, at + 0.13, [1, 0, 1, 0, 1, 0, 1]);
      tl.to(letter, { y: row * 0.07, duration: 0.2, ease: 'power2.inOut' }, at + 0.34)
        .to(letter, { y: 0, duration: 2, ease: 'power2.out' }, at + 0.54);
    });

    // 横切る細い線と、字を貫く帯
    sweep(tl, p.lines[0], 0.27, 0.1, 0.03, 0.17);
    sweep(tl, p.lines[1], 0.73, 0.1, 0.03, 0.17);
    sweep(tl, p.bar, 1.0, 0.17, 0.83, 0.1);

    // 下段の名前。斜めの帯が、切り口に沿って互い違いに滑り込む
    p.slices.forEach(function (slice, i) {
      var travel = (i % 2 ? 1 : -1) * p.sliceTravel * (0.8 + ((i * 7) % 5) * 0.14);
      var at = 2.17 + i * 0.018;
      tl.fromTo(slice,
        { x: travel * 0.7071, y: -travel * 0.7071 },
        { x: 0, y: 0, duration: 0.5, ease: EASE }, at);
      flicker(tl, slice, at, [1, 0, 1]);
    });
    tl.call(function () {
      // 継ぎ目が出ないよう、揃ったら1枚の文字に戻す
      p.slices.forEach(function (slice) { slice.remove(); });
      p.slices = [];
      p.name.classList.remove('is-sliced');
    }, null, 3.0);

    // 肩書きは白い帯が拭って現れる
    tl.call(function () { p.roles.classList.add('is-play'); }, null, 1.5);
  }

  function startHero(delay) {
    var video = document.querySelector('.hero__bg video');
    if (video) {
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function () {});
    }
    if (!title) return;

    // 字幅の計算は書体が届いてから。届かなくても 1.2 秒で進める
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var limit = new Promise(function (resolve) { setTimeout(resolve, 1200); });
    Promise.race([fonts, limit]).then(function () {
      buildTitle();
      fitTitle();
      playTitle(delay);
      fonts.then(fitTitle);

      var timer = null;
      window.addEventListener('resize', function () {
        clearTimeout(timer);
        timer = setTimeout(fitTitle, 150);
      });
    });
  }

  /* --------------------------------------------------- 冒頭演出の進行 */

  if (opening && root.classList.contains('js-opening')) {
    setTimeout(function () {
      root.setAttribute('data-load', '1');
      setTimeout(function () {
        root.setAttribute('data-load', '2');
        startHero(0.5);
        // 幕が抜けきったら、要素ごと外す
        setTimeout(function () { opening.remove(); }, 6000);
      }, 3900);
    }, 1500);
  } else {
    startHero(0.15);
  }

  /* --------------------------------------------- 見出し・宣言文のせり上げ */

  // 見出しの欧文を1文字ずつ包む。<small>（和文の副題）は触らない
  Array.prototype.forEach.call(document.querySelectorAll('.head[data-split]'), function (head) {
    var node = head.firstChild;
    if (!node || node.nodeType !== 3) return;
    var text = node.textContent.trim();
    var frag = document.createDocumentFragment();
    var inners = [];
    var label = document.createElement('span');
    label.className = 'visually-hidden';
    label.textContent = text;
    frag.appendChild(label);
    Array.from(text).forEach(function (c) {
      if (c === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
      var outer = document.createElement('span');
      outer.className = 'ch';
      outer.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('span');
      inner.textContent = c;
      outer.appendChild(inner);
      frag.appendChild(outer);
      inners.push(inner);
    });
    head.replaceChild(frag, node);

    var small = head.querySelector('small');
    var tl = gsap.timeline({ scrollTrigger: { trigger: head, start: 'top 88%', once: true } });
    tl.from(inners, { yPercent: 110, duration: 1.3, ease: EASE, stagger: 0.05 });
    if (small) tl.from(small, { autoAlpha: 0, duration: 1.2, ease: 'power1.out' }, 0.5);
  });

  var statement = document.querySelector('.statement');
  if (statement) {
    var stl = gsap.timeline({ scrollTrigger: { trigger: statement, start: 'top 80%', once: true } });
    stl.from(statement.querySelectorAll('.statement__text'), { yPercent: 105, duration: 1.5, ease: EASE, stagger: 0.12 });
    var rule = statement.querySelector('.statement__rule');
    if (rule) stl.from(rule, { scaleX: 0, duration: 1.4, ease: 'expo.inOut' }, 0.4);
  }
})();
