# 実UI画面スクリーンショットの作り方

`static/images/screens/` に置いている画面は、**ローカルにダミーデータを投入して撮影したもの**です。
クライアントの実データは一切含みません。更新するときは以下の手順を繰り返します。

## 原則（守らないと公開できない）

1. **実データに触れない。** 対象プロジェクトを一時ディレクトリへ複製し、`.env` を削除してから起動する。
   `.env` を残すと `DATABASE_URL` 経由で本番の Neon Postgres につながる。**複製直後に必ず消すこと。**
2. **クライアント名を伏せる。** アプリ名（`Nagase Tasks` / `Nagase Estimate`）はサイドバーとフッターに出る。
   テンプレートを一括置換してから撮る。
3. **実在の社員名を伏せる。** 見積ツールの操作者プルダウンには実名が入っている。置換する。
4. **数字のスケールを確かめる。** 見積ツールの材料費・梱包材費・送料は「1個あたり」で単価計算に入る。
   総額を入れると単価が桁違いになる。撮る前に金額サマリーが現実的な水準か目視する。
5. 撮影後、**公開する画像を1枚ずつ開いて**、クライアント名・実名・実データが残っていないか確認する。

## 手順

### 1. 複製して .env を消す

```powershell
$src = "C:\Users\naoto\ai_company\projects\nagase_tasks"
$dst = "<一時ディレクトリ>\shot_tasks"
Get-ChildItem $src -Exclude @('.git','.venv','*.db','.vercel','__pycache__') |
  Copy-Item -Destination $dst -Recurse -Force
Get-ChildItem $dst -Force -Filter ".env*" |
  Where-Object { $_.Name -ne '.env.example' } | Remove-Item -Force
```

### 2. クライアント名・実名を伏せる

```powershell
Get-ChildItem "$dst\app\templates" -Filter *.html | ForEach-Object {
  $c = Get-Content $_.FullName -Raw -Encoding UTF8
  $c = $c -replace 'Nagase Tasks','社内タスク管理'          # 見積ツールは 'Nagase Estimate' → '見積もり作成ツール'
  $c = $c -replace '<option>松本</option>','<option>見積担当</option>'  # 見積ツールのみ
  Set-Content $_.FullName -Value $c -NoNewline -Encoding UTF8
}
```

### 3. ダミーデータを投入して起動

`scripts/demo_seeds/` に投入スクリプトを置いてあります。対象プロジェクトの `scripts/` へコピーして実行します。

```powershell
$env:APP_USERNAME='demo'; $env:APP_PASSWORD='demo'
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue   # 念のため

# 見積ツールはマスター投入が先
python scripts/seed_masters.py
python scripts/seed_demo.py

python -m uvicorn app.main:app --port 8021
```

### 4. 撮影

Playwright で `http_credentials={"username":"demo","password":"demo"}`、
`viewport 1440x900`、`device_scale_factor=2` で撮ります。

### 5. Web用に整える

```
python <一時ディレクトリ>/prep_screens.py
```

余白を切り、幅1600pxへ縮小して `static/images/screens/` に保存します。
元の 2880x1800 のままだと1枚300KB超になるため必ず通します。

### 6. サイトに登録する

- ケース詳細に出す場合: `data/works.py` の該当ケースに `screens` と `screens_note` を足す
- トップの継続導入ブロックに出す場合: `data/profile.py` の `CONTINUOUS["screen"]`

`alt` は「何が写っているか」を具体的に書きます（preflight が空 alt を落とします）。

### 7. 検査

```
python scripts/preflight.py
```

## 撮らないもの（オーナー確定 2026-08-22）

- **図面検索システム — 実画面は撮らない。構成図のみで掲載する。**
  画面に受注単価と実図番がそのまま出るため、ダミー化しきれるまでの手間とリスクが見合わない。
  技術的にも PostgreSQL + pgvector と Vercel Blob が要りローカルでは起動できない。
  **この判断は確定済みです。再挑戦しないでください。**

## まだ撮っていないもの

- **品質管理チャットボット** — Excel取込済みのDBが要る。撮るなら架空の不適合記録を作るところから
- **音声入力アプリ** — Windows デスクトップアプリなので、本手順（Webアプリ前提）とは別の撮り方になる

## 使わなかった素材

`tasks-thread.png`（スレッド詳細。会話・ステータス変更・担当変更が写っている）は撮影済みですが、
社内タスク管理はケース詳細ページを持たないため未掲載です。
7本目のケースページを作る場合はそのまま使えます。
