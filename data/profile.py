"""
プロフィール・サイト全体のメタ情報の正本。

事実の出典: shared_knowledge/owner_profile.md（オーナープロフィール正本）。
本ファイルにない経歴・数字を創作しないこと。
"""

SITE = {
    "name": "TEGG Engineering",
    "owner": "吉田 尚人",
    "role": "生成AI伴走型エンジニア",
    "tagline": "製造業の現場に、AIを実装してきました。",
    "description": (
        "TEGG Engineering — 生成AI × 製造業。中小企業の業務改善を、"
        "図面検索・見積・品質管理などの実装実績をもとに支援します。"
        "RAGチャットボット、社内検索、業務システム開発、業務自動化。"
    ),
    "url": "https://portfolio-webpage-zz11.vercel.app",
}

# ヒーローに出すハイライト（すべて一次資料で裏付けのある事実）
HIGHLIGHTS = [
    {
        "value": "5",
        "unit": "システム",
        "label": "同一クライアントへの継続導入",
        "note": "うち3件が本番稼働中",
    },
    {
        "value": "17,588",
        "unit": "件",
        "label": "図面検索システムの取込実績",
        "note": "29,506ページ / 2026-07 時点",
    },
    {
        "value": "認定",
        "unit": "",
        "label": "プロクラウドワーカー",
        "note": "クラウドワークス 2026年7月審査",
    },
]

PROFILE = {
    "name": "吉田 尚人",
    "name_en": "Naoto Yoshida",
    "role": "生成AI伴走型エンジニア / TEGG Engineering",
    "badges": ["製造業の現職", "プロクラウドワーカー認定", "フルリモート対応"],
    "headline": "営業12年。現場の困りごとを、自分で実装する側に回りました。",
    "story": [
        "中古車販売の営業を約5年、そのあと製造業の営業へ移りました。"
        "お客様の課題を聞く仕事を長く続けるうちに、社内にも「もっと効率化できるのに」という場面が"
        "いくつも積み上がっていることに気づきました。",
        "2025年9月から3ヶ月かけて生成AIエンジニアの講座を修了し、"
        "そこからは自分の勤務先を最初の現場にして、図面検索・見積・タスク管理・規程検索・品質管理と、"
        "業務システムを1つずつ作ってきました。要件を聞くところから運用の面倒を見るところまで、"
        "全部ひとりでやっています。",
        "技術がわかる人だけで作ると、現場が使わないものができます。"
        "営業として現場の話を聞いてきた時間が、いまは要件定義の精度になっていると思っています。",
    ],
    "details": [
        {"label": "稼働時間", "value": "週20〜30時間（柔軟に対応可能）"},
        {"label": "対応形式", "value": "フルリモート（オンライン打ち合わせ可）"},
        {"label": "得意領域", "value": "RAG構築 / 社内ナレッジ検索 / 業務システム開発 / 業務自動化"},
        {"label": "主な対象", "value": "従業員100名未満の中小企業"},
    ],
    "career": [
        {"period": "約5年", "title": "中古車販売・買取の営業", "note": "個人のお客様への提案営業"},
        {"period": "現職", "title": "製造業の営業", "note": "現場の業務フローを内側から把握"},
        {"period": "2025年9月〜12月", "title": "生成AIエンジニア講座を修了", "note": "約3ヶ月"},
        {"period": "2026年〜", "title": "TEGG Engineering として開発を開始", "note": "受託と自社内製を並行"},
    ],
    "links": [
        {
            "label": "クラウドワークス",
            "url": "https://crowdworks.jp/public/employees/6719291",
            "note": "プロクラウドワーカー認定",
        },
        {"label": "X", "url": "https://x.com/061426", "note": "日々の開発記録"},
        {"label": "note", "url": "https://note.com/nysyyysyhy", "note": "AI活用の記事"},
    ],
    "photo": "images/profile.jpg",
    "photo_alt": "吉田尚人のプロフィール写真",
}

# 実際に案件で使っている技術のみを載せる
TECH_STACK = [
    {
        "group": "言語・フレームワーク",
        "items": ["Python", "FastAPI", "Flask", "TypeScript", "Next.js", "Rust / Tauri", "Google Apps Script"],
    },
    {
        "group": "AI・検索",
        "items": ["Claude API", "OpenAI API", "Gemini API", "LangChain", "pgvector", "FAISS", "DINOv2", "ローカルASR"],
    },
    {
        "group": "データ・基盤",
        "items": ["PostgreSQL", "SQLite", "Google Sheets API", "Vercel", "GitHub Actions", "openpyxl"],
    },
]

# 匿名クライアントへの継続導入をまとめて見せるブロック
CONTINUOUS = {
    "heading": "1社に5システム。3件が本番で動いています",
    "body": "同じ金属加工メーカーに対して、図面検索から始まり、見積・タスク管理・規程検索・品質管理と"
            "段階的にシステムを入れてきました。1つ作って終わりではなく、"
            "現場で使われた結果を見て次を決める進め方をしています。",
    "systems": [
        {"name": "図面検索システム", "status": "本番稼働中", "slug": "drawing-search"},
        {"name": "見積もり作成ツール", "status": "本番稼働中", "slug": "estimate"},
        {"name": "社内タスク管理", "status": "本番稼働中", "slug": None},
        {"name": "社内規程チャットボット", "status": "完成・運用中", "slug": None},
        {"name": "品質管理チャットボット", "status": "開発中", "slug": "quality-bot"},
    ],
}
