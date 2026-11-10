/* ==========================================================================
   TEGG Engineering — ポートフォリオ

   担当: ナビの開閉 / スクロール表示 / 面の色の切り替え / 実績の号の開閉 / FAQ開閉 / 問い合わせ送信。
   動き（冒頭演出・名前の組み上げ・GSAP）は motion.js が持つ。
   ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- ナビ */

  // スマートフォンでは全画面の一覧として開く。ヘッダーの反転表示は開いている間だけ外す
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');
  var header = document.querySelector('.hdr');

  if (toggle && menu) {
    var setNav = function (open) {
      menu.classList.toggle('is-open', open);
      if (header) header.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    };

    toggle.addEventListener('click', function () {
      setNav(!menu.classList.contains('is-open'));
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setNav(false);
        toggle.focus();
      }
    });
  }

  /* ----------------------------------------------------- 面の色の切り替え */

  // data-zone="black" の区画が画面の中央に来ている間、面を黒へ移す
  var zones = document.querySelectorAll('[data-zone="black"]');
  if (zones.length && 'IntersectionObserver' in window) {
    var inZone = new Set();
    var zoneObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) inZone.add(entry.target);
        else inZone.delete(entry.target);
      });
      document.body.classList.toggle('is-black', inZone.size > 0);
    }, { rootMargin: '-50% 0px -50% 0px' });
    Array.prototype.forEach.call(zones, function (el) { zoneObserver.observe(el); });
  }

  /* ------------------------------------------------------- スクロール表示 */

  var risers = document.querySelectorAll('.rise');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(risers, function (el) { el.classList.add('is-in'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    Array.prototype.forEach.call(risers, function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------- 実績の号（表紙と見開き） */

  // 表紙か目次を押すと、その号が表紙の位置から手前へ寄り、見開きに開く。
  // 開いたまま前後の号へ送れる（ボタン・← →）。Esc・CLOSE・暗幕で閉じる。
  // リンク先は詳細ページなので、JS が無いときや新しいタブで開くときはそのまま詳細へ移る
  (function issues() {
    var row = document.querySelector('[data-issues]');
    var view = document.querySelector('[data-issue-view]');
    if (!row || !view) return;

    var covers = Array.prototype.slice.call(row.querySelectorAll('.cover'));
    var tpls = Array.prototype.slice.call(document.querySelectorAll('template[data-issue-tpl]'));
    var spread = view.querySelector('.spread');
    var leafL = spread.querySelector('.spread__leaf--l');
    var pageL = view.querySelector('[data-leaf="l"]');
    var pageR = view.querySelector('[data-leaf="r"]');
    var count = view.querySelector('[data-issue-count]');
    var prev = view.querySelector('[data-issue-step="-1"]');
    var next = view.querySelector('[data-issue-step="1"]');
    var closeBtn = view.querySelector('.issue-view__close');
    var n = covers.length;
    var cur = -1;
    var busy = false;
    var returnFocus = null;
    var pad = function (i) { return (i < 9 ? '0' : '') + (i + 1); };

    // main は独自の重なり順を持つので、見開きは body 直下へ移してヘッダーより手前に出す
    document.body.appendChild(view);
    row.classList.add('is-grab');

    function fill(i) {
      var parts = tpls[i].content;
      pageL.innerHTML = '';
      pageR.innerHTML = '';
      pageL.appendChild(parts.querySelector('[data-part="l"]').cloneNode(true));
      pageR.appendChild(parts.querySelector('[data-part="r"]').cloneNode(true));
      pageL.scrollTop = 0;
      pageR.scrollTop = 0;
      spread.scrollTop = 0;
      view.querySelector('[data-folio="l"]').textContent = 'p.' + (i * 2 + 2);
      view.querySelector('[data-folio="r"]').textContent = 'p.' + (i * 2 + 3);
      count.textContent = pad(i) + ' / ' + pad(n - 1);
      prev.disabled = i === 0;
      next.disabled = i === n - 1;
      spread.setAttribute('aria-label', 'No.' + pad(i) + ' ' + covers[i].getAttribute('aria-label'));
    }

    // 見開きを、左頁の左上を基点に表紙の矩形へ縮めて重ねる変形
    function fromCover(cover) {
      var c = cover.getBoundingClientRect();
      var l = leafL.getBoundingClientRect();
      if (!c.width || !l.width) return 'none';
      return 'translate(' + (c.left - l.left) + 'px,' + (c.top - l.top) + 'px) scale(' + (c.width / l.width) + ',' + (c.height / l.height) + ')';
    }

    function lock(on) {
      document.documentElement.style.overflow = on ? 'hidden' : '';
    }

    function open(i) {
      if (busy || cur !== -1) return;
      busy = true;
      cur = i;
      returnFocus = document.activeElement;
      var cover = covers[i];
      fill(i);
      view.hidden = false;
      lock(true);
      spread.classList.remove('is-open');
      spread.style.transition = 'none';
      // 表紙が画面外なら寄せる動きは付けずに開く
      var r = cover.getBoundingClientRect();
      var visible = r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight;
      spread.style.transform = reduce || !visible ? 'none' : fromCover(cover);
      cover.classList.add('is-lifted');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          spread.style.transition = reduce ? 'none' : 'transform 1s var(--ease-page)';
          spread.style.transform = 'none';
          view.classList.add('is-on');
          setTimeout(function () {
            spread.classList.add('is-open');
            view.classList.add('is-ready');
            busy = false;
            closeBtn.focus({ preventScroll: true });
          }, reduce ? 0 : 420);
        });
      });
    }

    function close() {
      if (busy || cur === -1) return;
      busy = true;
      var cover = covers[cur];
      spread.classList.remove('is-open');
      view.classList.remove('is-ready');
      function done() {
        view.hidden = true;
        view.classList.remove('is-on');
        cover.classList.remove('is-lifted');
        spread.style.transform = '';
        lock(false);
        cur = -1;
        busy = false;
        (returnFocus && document.contains(returnFocus) ? returnFocus : cover).focus({ preventScroll: true });
      }
      if (reduce) { done(); return; }
      setTimeout(function () {
        spread.style.transition = 'transform 0.9s var(--ease-page)';
        spread.style.transform = fromCover(cover);
        view.classList.remove('is-on');
        setTimeout(done, 900);
      }, 450);
    }

    // 開いたまま前後の号へ。頁を閉じて中身を差し替え、また開く
    function step(d) {
      var i = cur + d;
      if (busy || cur === -1 || i < 0 || i >= n) return;
      busy = true;
      spread.classList.remove('is-open');
      setTimeout(function () {
        covers[cur].classList.remove('is-lifted');
        cur = i;
        covers[i].classList.add('is-lifted');
        // 閉じたときに戻る先の表紙を、列の中で見える位置へ送っておく
        row.scrollTo({ left: covers[i].offsetLeft - row.offsetLeft - parseFloat(getComputedStyle(row).paddingLeft), behavior: 'auto' });
        fill(i);
        spread.classList.add('is-open');
        busy = false;
      }, reduce ? 0 : 500);
    }

    function onOpenClick(e) {
      // 新しいタブで開く操作は詳細ページへそのまま通す
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      if (row.dataset.moved === '1') { e.preventDefault(); return; }
      e.preventDefault();
      open(+this.dataset.issue);
    }
    covers.forEach(function (c) { c.addEventListener('click', onOpenClick); });
    Array.prototype.forEach.call(document.querySelectorAll('.contents a[data-issue]'), function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault();
        var i = +a.dataset.issue;
        row.scrollTo({ left: covers[i].offsetLeft - row.offsetLeft - parseFloat(getComputedStyle(row).paddingLeft), behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(function () { open(i); }, reduce ? 0 : 350);
      });
    });

    Array.prototype.forEach.call(view.querySelectorAll('[data-issue-close]'), function (el) { el.addEventListener('click', close); });
    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });

    document.addEventListener('keydown', function (e) {
      if (cur === -1) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
      else if (e.key === 'Tab') {
        // 見開きの中だけをフォーカスが回るようにする
        var f = Array.prototype.filter.call(view.querySelectorAll('a[href], button:not([disabled])'), function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // マウスでも表紙の列をつかんで横に送れるようにする（指はそのままスクロールする）
    var down = false, sx = 0, sl = 0;
    row.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; sx = e.clientX; sl = row.scrollLeft; row.dataset.moved = '0';
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var d = e.clientX - sx;
      if (Math.abs(d) > 5) { row.dataset.moved = '1'; row.classList.add('is-drag'); }
      if (row.dataset.moved === '1') row.scrollLeft = sl - d;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      row.classList.remove('is-drag');
      setTimeout(function () { row.dataset.moved = '0'; }, 0);
    });
    row.addEventListener('dragstart', function (e) { e.preventDefault(); });
  })();

  /* ---------------------------------------------------------------- FAQ */

  Array.prototype.forEach.call(document.querySelectorAll('.faq__q'), function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.style.maxHeight = open ? '' : panel.scrollHeight + 'px';
    });
  });

  /* --------------------------------------------------- お問い合わせフォーム */

  var form = document.getElementById('contactForm');
  if (!form) return;

  var submit = document.getElementById('contactSubmit');
  var submitLabel = submit.querySelector('[data-label]') || submit;
  var message = document.getElementById('formMessage');

  function show(text, ok) {
    message.textContent = text;
    message.className = 'form__msg ' + (ok ? 'is-ok' : 'is-err');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      inquiry_type: (form.querySelector('input[name="inquiry_type"]:checked') || {}).value || '',
      budget: form.budget ? form.budget.value : '',
      message: form.message.value.trim()
    };

    if (!data.name || !data.email || !data.message) {
      show('お名前・メールアドレス・ご相談内容は必須です。', false);
      return;
    }

    submit.disabled = true;
    submitLabel.textContent = '送信中';
    message.className = 'form__msg';

    fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
      .then(function (result) {
        if (result.ok && result.body.success) {
          show(result.body.message, true);
          form.reset();
        } else {
          show(result.body.message || '送信に失敗しました。時間をおいて再度お試しください。', false);
        }
      })
      .catch(function () {
        show('通信に失敗しました。ネットワークをご確認のうえ再度お試しください。', false);
      })
      .then(function () {
        submit.disabled = false;
        submitLabel.textContent = '送信する';
      });
  });
})();
