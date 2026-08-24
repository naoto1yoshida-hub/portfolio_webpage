/* ==========================================================================
   TEGG Engineering — ポートフォリオ

   担当は3つだけ。ナビの開閉 / スクロール表示 / FAQ開閉 / 問い合わせ送信。
   実績はサーバー側でページを持つため、モーダルは持たない。
   ========================================================================== */

(function () {
  'use strict';

  /* ---------------------------------------------------------------- ナビ */

  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('navMenu');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'メニューを開く');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
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
    submit.textContent = '送信中...';
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
        submit.textContent = '送信する';
      });
  });
})();
