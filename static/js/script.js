/* ==========================================================================
   TEGG Engineering — ポートフォリオ

   担当: ナビの開閉 / スクロール表示 / 面の色の切り替え / FAQ開閉 / 問い合わせ送信。
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
