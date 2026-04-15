/**
 * TEGG Engineering - ポートフォリオサイト
 * メインスクリプト
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initNavbar();
  initMobileMenu();
  initModal();
  initContactForm();
  initSmoothScroll();
  initTechMarquee();
});

/* ========================================
   Tech Stack 無限スクロール
   ======================================== */
function initTechMarquee() {
  const track = document.getElementById('techMarqueeTrack');
  if (!track) return;

  // アイテムを複製してシームレスなループを作る
  const items = track.innerHTML;
  track.innerHTML = items + items;
}

/* ========================================
   スクロールアニメーション
   ======================================== */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.fade-in').forEach((el) => {
    observer.observe(el);
  });
}

/* ========================================
   ナビバー
   ======================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/* ========================================
   モバイルメニュー
   ======================================== */
function initMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('active');
    toggle.classList.toggle('active');

    // ハンバーガーアニメーション
    const spans = toggle.querySelectorAll('span');
    if (toggle.classList.contains('active')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  // リンククリックで閉じる
  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('active');
      toggle.classList.remove('active');
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });
}

/* ========================================
   スムーススクロール
   ======================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ========================================
   Works モーダル
   ======================================== */
function initModal() {
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  // Works データ
  const worksData = {
    'rag-chatbot': {
      title: '社内文書Q&A チャットボット',
      image: '/static/images/works/rag_chatbot.png',
      overview:
        '製造業のお客様向けに、社内マニュアル・技術資料・過去の品質報告書を対象としたRAGベースのQ&Aチャットボットを開発しました。自然言語で質問するだけで、関連文書から回答を生成します。',
      beforeAfter:
        '【Before】マニュアルや報告書の検索に1件あたり平均15分を要していた。担当者不在時には回答が翌日以降に。\n\n【After】AIが即座に関連文書を特定し回答を生成。問い合わせ対応時間を60%削減。新人教育にも活用。',
      tech: ['Python', 'OpenAI API', 'LangChain', 'ChromaDB', 'Flask', 'PDF Parser'],
    },
    'automation': {
      title: '業務自動化ダッシュボード',
      image: '/static/images/works/automation_dashboard.png',
      overview:
        '日次・週次で発生する定型業務（データ集計、レポート作成、メール送信等）をPythonで自動化し、その進捗・実績をリアルタイムで可視化するダッシュボードを構築しました。',
      beforeAfter:
        '【Before】手作業でのデータ集計に毎日2時間、レポート作成に1時間。人的ミスも発生。\n\n【After】自動化率87%を達成。処理時間を65%短縮し、人的ミスをゼロに。浮いた時間を企画業務に充当。',
      tech: ['Python', 'Flask', 'Pandas', 'Schedule', 'Chart.js', 'SQLite'],
    },
    'doc-search': {
      title: '技術図面検索ツール',
      image: '/static/images/works/document_search.png',
      overview:
        '過去に作成された技術図面を、材質・板厚・サイズなどの条件で類似検索できるWebアプリケーションを開発しました。OCRで図面情報を自動抽出し、高速な検索を実現します。',
      beforeAfter:
        '【Before】過去図面の検索はファイルサーバーを手動で探索。1件の検索に30分以上かかることも。\n\n【After】キーワード入力で即座に類似図面を表示。検索時間を95%以上短縮。設計の流用率も向上。',
      tech: ['Python', 'Tesseract OCR', 'FAISS', 'Flask', 'SQLite', 'OpenCV'],
    },
    'meeting-minutes': {
      title: '議事録自動生成ツール',
      image: '',
      overview:
        '会議の音声データからテキストを抽出し、生成AIを使って要約・構造化された議事録を自動生成するツールです。',
      beforeAfter:
        '【Before】会議後の議事録作成に30分〜1時間。記録漏れや認識齟齬が発生。\n\n【After】音声アップロードから数分で議事録が完成。議論のポイントと決定事項を自動抽出。',
      tech: ['Python', 'Google AI Studio', 'Gemini API', 'Whisper'],
    },
    'data-extraction': {
      title: 'データ抽出・整形ツール',
      image: '',
      overview:
        'PDFや画像形式の帳票から、必要なデータを自動抽出し、Excel/CSVなどの構造化データに変換するツールです。',
      beforeAfter:
        '【Before】紙の帳票や PDF から手でデータを転記。1日あたり200件以上のデータ入力作業。\n\n【After】自動抽出により作業時間を80%削減。入力ミスもほぼゼロに。',
      tech: ['Python', 'OpenAI API', 'PyMuPDF', 'Pandas', 'openpyxl'],
    },
    'price-research': {
      title: '市場価格リサーチツール',
      image: '',
      overview:
        'Web上の複数サイトから特定商品の価格情報を自動収集し、相場比較・トレンド分析を行うツールです。',
      beforeAfter:
        '【Before】手動で複数サイトを巡回し価格を記録。1商品あたり20分の調査工数。\n\n【After】自動収集により調査時間を90%短縮。一覧比較で適正価格の判断が即座に可能に。',
      tech: ['Python', 'Selenium', 'BeautifulSoup', 'Pandas', 'Matplotlib'],
    },
    'email-assistant': {
      title: 'メール文面生成アシスタント',
      image: '',
      overview:
        'ビジネスメールのテンプレートと文脈情報を元に、AIが適切な文面を自動生成するアシスタントツールです。',
      beforeAfter:
        '【Before】メール作成に1通あたり10〜15分。敬語や表現に悩む時間が多い。\n\n【After】AIが下書きを生成し、必要な修正のみで送信可能に。作成時間を70%短縮。',
      tech: ['Python', 'OpenAI API', 'Flask', 'Jinja2'],
    },
    'sales-list': {
      title: '営業リスト自動作成ツール',
      image: '',
      overview:
        'Google スプレッドシート上でGASを活用し、業種ジャンルを指定してボタンを押すだけで、企業名・URL等の営業先リストを10件ずつ自動取得するツールです。',
      beforeAfter:
        '【Before】営業先のリストアップに手作業でWeb検索→コピペを繰り返し。1リスト作成に数時間。\n\n【After】ジャンル指定→ボタン1クリックで10件ずつ自動取得。重複排除も自動化され、リスト作成時間を95%短縮。',
      tech: ['Google Apps Script', 'Google Sheets', 'Web Scraping', 'SpreadsheetApp API'],
    },
    'seo-article': {
      title: 'SEO対策記事生成ツール',
      image: '',
      overview:
        '対策したいキーワードを入力するだけで、SEOに最適化された構成・見出し・本文を含む記事を自動生成するツールです。',
      beforeAfter:
        '【Before】1記事の執筆に3〜5時間。キーワード調査・構成設計・ライティングをすべて手動。\n\n【After】キーワード入力から数分で記事の初稿が完成。SEO構造化も自動対応し、ライティング工数を80%削減。',
      tech: ['Python', 'OpenAI API', 'Gemini API', 'SEO分析', 'Markdown'],
    },
  };

  // カードクリックイベント
  document.querySelectorAll('[data-work]').forEach((card) => {
    card.addEventListener('click', () => {
      const workId = card.dataset.work;
      const data = worksData[workId];
      if (!data) return;

      document.getElementById('modalTitle').textContent = data.title;
      document.getElementById('modalOverview').textContent = data.overview;

      // Before/After の改行を処理
      const baText = data.beforeAfter.replace(/\n/g, '<br>');
      document.getElementById('modalBeforeAfter').innerHTML = baText;

      // 画像
      const modalImage = document.getElementById('modalImage');
      if (data.image) {
        modalImage.src = data.image;
        modalImage.style.display = 'block';
      } else {
        modalImage.style.display = 'none';
      }

      // 技術リスト
      const techList = document.getElementById('modalTechList');
      techList.innerHTML = data.tech.map((t) => `<li>${t}</li>`).join('');

      // モーダルを開く
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // 閉じるボタン
  closeBtn.addEventListener('click', closeModal);

  // オーバーレイクリックで閉じる
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  // Escキーで閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/* ========================================
   お問い合わせフォーム
   ======================================== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('contactSubmit');
  const messageEl = document.getElementById('formMessage');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const inquiryType =
      document.querySelector('input[name="inquiry_type"]:checked')?.value || '';
    const message = document.getElementById('contactMessage').value.trim();

    // バリデーション
    if (!name || !email || !message) {
      showMessage('必須項目をすべて入力してください。', 'error');
      return;
    }

    // メールバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('有効なメールアドレスを入力してください。', 'error');
      return;
    }

    // 送信中の状態
    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';
    messageEl.className = 'form-message';
    messageEl.style.display = 'none';

    try {
      const response = await fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, inquiry_type: inquiryType, message }),
      });

      const data = await response.json();

      if (data.success) {
        showMessage(data.message, 'success');
        form.reset();
      } else {
        showMessage(data.message || 'エラーが発生しました。', 'error');
      }
    } catch (err) {
      showMessage('通信エラーが発生しました。時間をおいて再度お試しください。', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '送信する';
    }
  });

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `form-message ${type}`;
    messageEl.style.display = 'block';

    // 成功メッセージは5秒後に非表示
    if (type === 'success') {
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    }
  }
}
