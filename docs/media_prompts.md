# 画像・動画の生成プロンプト

トップページで使う素材の生成指示と、置き場所・仕様をまとめる。
ファイルを所定の場所に置けば、テンプレートが自動で拾う（コードの変更は不要）。

| 素材 | 必須か | 置き場所 | 無いとき |
|---|---|---|---|
| ヒーロー動画 | 必須 | `static/video/`（使う1本を `data/profile.py` の `HERO["video"]` で指定） | 青緑の仮背景（線と面の構造体）が出る |
| ヒーロー静止画 | 任意 | `static/images/hero-poster.jpg` | 動画の読み込み中は青緑の単色が出る |
| 写真の帯 | 任意 | `static/images/gallery/01.jpg` 〜 | 帯ごと出ない |

色調の基準は参照サイト（shinyaokano.jp）のヒーロー動画。実測では **青緑の単色調（#1b4a50 〜 #2a6a70 付近）、
彩度は低め、白飛びなし**。上に白い文字を載せるので、画面中央に明るい被写体や細かい模様を置かない。

---

## 現在入っている動画（2026-10-10）

| ファイル | 中身 | 元の素材からの加工 |
|---|---|---|
| `static/video/hero-roof.mp4`（使用中） | 第1案。工場の屋根の鉄骨 | 音声を除去 / 最初の1秒と最後の1秒を重ねて継ぎ目を消す（10秒 → 9秒）/ 天窓の白飛びを抑える |
| `static/video/hero-cnc.mp4`（予備） | 第2案。切削の接写 | 音声を除去 / 継ぎ目を消す（10秒 → 9秒）。色は元のまま |

継ぎ目を消す加工は次のとおり（入力が10秒のとき）。屋根の方はこの前に `curves=all='0/0 0.55/0.46 1/0.74',` を足している。

```
ffmpeg -i input.mp4 -filter_complex "[0:v]split[a][b];[a]trim=0:1,setpts=PTS-STARTPTS[head];[b]trim=1:10,setpts=PTS-STARTPTS[body];[body][head]xfade=transition=fade:duration=1:offset=8,format=yuv420p[v]" ^
  -map "[v]" -an -c:v libx264 -profile:v main -crf 22 -preset slow -movflags +faststart output.mp4
```

---

## 1. ヒーロー動画（必須）

### 仕様

- 横 16:9、1280×720 以上（配置時に 1280×720 へ変換する）
- 長さ 8〜20 秒。**継ぎ目なくループできること**（最初と最後のコマがつながる）
- 音声なし
- カメラはごくゆっくり動く（ドリー移動 または 固定+わずかな寄り）。早い動き・カット割り・人物の顔は不可
- ファイルは **3MB 以下** を目安に圧縮する（Vercel の関数経由で配信するため上限 4.5MB。参照サイトの実物は 2.98MB）

### プロンプト（第1案・推奨: 工場の鉄骨）

```
Slow cinematic dolly shot looking up at the steel roof structure of a metalworking factory.
Massive diagonal I-beams and trusses cross the frame from lower left to upper right,
repeating into the distance with strong perspective. Rows of industrial skylights and
long fluorescent fixtures glow softly. No people, no text, no logos.
Monochrome teal color grade: deep teal shadows (#1b4a50), muted teal midtones (#2a6a70),
low saturation, soft contrast, no pure white highlights. Slight film grain, shallow haze in the air.
Camera moves forward very slowly and steadily, 24fps, smooth seamless loop,
architectural photography style, brutalist mood, wide angle lens, 16:9.
```

ねらい: 参照の「打ち放しコンクリートの梁が斜めに走る建築」を、製造業の文脈（工場の鉄骨）に置き換える。
斜めの梁が画面を横切る構図は、名前の演出（斜めの帯・斜めの線）と向きが揃う。

### プロンプト（第2案: 金属加工の機械）

```
Extreme slow-motion macro shot of a CNC milling machine cutting a block of aluminum.
The spindle and tool are slightly out of focus in the upper third; fine metal chips drift
slowly through the frame. Dark background, single soft key light from the side.
No people, no text, no logos. Monochrome teal color grade: deep teal shadows (#1b4a50),
muted teal midtones (#2a6a70), low saturation, soft contrast, no pure white highlights.
Slight film grain. Locked-off camera with an almost imperceptible push-in, 24fps,
smooth seamless loop, 16:9.
```

ねらい: 「現場」をより直接に見せる。動きが細かくなるので、文字の可読性は第1案より落ちる。

### 使わない指定（ネガティブ）

```
people, faces, hands, text, captions, watermark, logo, fast motion, camera shake,
cuts, lens flare, warm colors, orange, red, saturated colors, blown highlights, cartoon, 3D render look
```

### 配置のしかた

生成した動画を `static/video/hero.mp4` に置く。大きさ・容量が合わないときは次で変換する。

```
ffmpeg -i input.mp4 -an -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24" ^
  -c:v libx264 -profile:v main -pix_fmt yuv420p -crf 30 -preset slow -movflags +faststart static/video/hero.mp4
```

容量が 3MB を超えたら `-crf` を 32 → 34 と上げる。色が青緑に寄りきっていないときは、
`-vf` の末尾に `,hue=s=0,colorbalance=rs=-0.25:gs=0.02:bs=0.08:rm=-0.2:gm=0.03:bm=0.06` を足して単色調に寄せる
（値は目で見て調整する）。

---

## 2. ヒーロー静止画（任意）

動画の1コマ目を書き出せば足りるので、別に生成する必要はない。

```
ffmpeg -i static/video/hero.mp4 -frames:v 1 -q:v 4 static/images/hero-poster.jpg
```

---

## 3. 写真の帯（任意・3〜4枚）

「選ばれる理由」と「プロフィール」の間に、横並びの写真の帯として出る。CSS 側で白黒に変換するので、
生成時の色は問わない。**縦長（3:4）** で、主役を中央に置く。

実在の現場写真ではなく生成画像なので、実績や導入先の証拠として読める絵（社名・製品・人物の顔・実在の図面）は入れない。

```
1) Close-up of a steel workbench in a small metalworking shop: a vernier caliper, a machined
   aluminum part and a folded paper drawing with dimension lines (illegible), soft window light
   from the left, shallow depth of field, documentary photography, 3:4 vertical.

2) A laptop on a workshop desk showing an abstract dark interface with thin lines (no readable text),
   blurred milling machines in the background, quiet overcast light, documentary photography, 3:4 vertical.

3) Stacked sheets of cut steel with clean laser-cut edges, strong repeating horizontal lines,
   raking side light, high detail, architectural still life, 3:4 vertical.

4) Looking down a narrow factory aisle between shelving racks of labeled bins (labels illegible),
   one-point perspective, soft even light, no people, documentary photography, 3:4 vertical.
```

共通のネガティブ: `people, faces, readable text, brand names, logos, watermark, illustration, 3D render look`

置き場所は `static/images/gallery/`。ファイル名の順（`01.jpg`, `02.jpg` …）に左から並ぶ。

---

## 4. サービスのカード写真（3枚）

SERVICES のカード左側に、右辺を斜めに切った形で出る。置くまでのあいだはティールの斜線と番号の仮の図柄が出る。

### 仕様

- **正方形 1:1（1600×1600 推奨）**。同じ1枚を、PC では縦長（約1:2）、スマホでは横長（約16:9）に切り抜いて使う。
  どちらでも残るのは **画像の中央** だけなので、主役は中央の 50% 四方に収める
- PC では右辺が斜めに切れるので、右下は欠けても困らない構図にする
- 方向性は「IT感」（2026-11-04 オーナー指定）。暗い室内で、画面から発光する線・ノード・データの流れが浮き上がる絵にする
- 3枚の色調をそろえる。背景は暗いチャコール〜深いティール（#23595f 付近）、発光は **ティール〜シアン 1系統だけ**
  （青・紫・ピンクを混ぜない）、ハイライトはわずかに生成りのクリーム（#edeae0 付近）。
  サイトの暗い背景（#313131）とカードの台紙（クリーム）の両方になじませるため
- 画面・書類の文字は読めないこと。数字入りのグラフや「◯%削減」のような絵は入れない（架空の数値を載せない規律。`scripts/preflight.py` 参照）
- 人物の顔・社名・ロゴ・実在の図面は入れない（実績の証拠として読めてしまうため）

### プロンプト

```
1) 業務自動化・ツール開発 → static/images/services/automation.jpg
A laptop on a dark desk in a dim room. From its screen, rows of spreadsheet-like cells lift off
as small glowing translucent tiles and travel along thin luminous lines into a looping pipeline,
passing through simple node points, like an automated workflow running by itself.
Glowing teal-cyan light trails, tiny particles, faint holographic grid lines in the air.
No readable text or numbers. Subject centered, square composition, shallow depth of field,
cinematic low-key lighting. Color palette: charcoal and deep teal background, teal-cyan glow,
subtle warm off-white highlights. High-end technology photography, 1:1.

2) AIチャットボット・社内検索 → static/images/services/ai.jpg
（2026-11-10 改: 抽象的な球体をやめ、スマホでチャットしている場面にした）
Close-up of a hand holding a smartphone over a dark office desk, seen from slightly above
over the shoulder (no face visible). The phone screen clearly shows a messaging-style chat app:
a short question bubble on the right, and a longer answer bubble on the left with a small
attached document card under it, like an AI assistant answering with a cited source.
All text is rendered as soft blurred lines, not readable. In the blurred background, a laptop
on the desk shows the same chat interface. A few faint teal-cyan light lines rise from the phone
screen toward small translucent document icons floating just above it.
The phone is the clear main subject in the center. Square composition, 50mm lens,
shallow depth of field, cinematic low-key lighting with the screen as the main light source.
Color palette: charcoal and deep teal background, teal-cyan screen glow,
subtle warm off-white highlights. High-end technology photography, 1:1.

3) 業務システム開発 → static/images/services/system.jpg
（2026-11-10 改: 紙が溶けるホログラムをやめ、ノートPCの画面に業務ツールが映っている場面にした）
A modern laptop on a dark desk, seen from a three-quarter front angle, the screen filling
the center of the frame. The screen clearly shows a business web application: a slim dark
left sidebar with menu items, a top bar, and a main area with a data table of several rows,
each row ending in a small colored status pill (teal, amber, grey), and one highlighted teal
primary button in the upper right. A side panel on the right shows a simple three-step
progress tracker: three circles joined by a line, the first two filled teal, the last one empty.
All text is rendered as soft blurred lines, not readable. A printed paper form lies beside
the laptop, slightly out of focus, hinting that paper work moved into the system.
Soft teal-cyan glow from the screen reflects on the desk.
Square composition, 35mm lens, shallow depth of field, cinematic low-key lighting.
Color palette: charcoal and deep teal background, teal-cyan screen glow,
subtle warm off-white highlights. High-end technology photography, 1:1.
```

共通のネガティブ: `faces, robot, humanoid, readable text, letters, numbers, percentages, charts with values, brand names, logos, watermark, cartoon, flat illustration, blue and purple neon, pink, rainbow colors, cluttered sci-fi, oversaturated colors`
1) と 3) は人を入れないので、ネガティブに `people, hands` を足す。2) は手だけ写す（顔は入れない）。

生成ツールごとの補足:
- Midjourney は末尾に `--ar 1:1 --style raw` を付け、ネガティブは `--no` に並べる
- 文字が混ざりやすいツールでは、画面の部分を「blank glowing bars」に寄せて再生成するのが早い

2026-11-10 に採用した画像: `system.jpg` と `ai.jpg` は上のプロンプトどおり。`automation.jpg` は 11-04 版の
AIチャットボット用プロンプト（資料をつなぐ光の網目の球）で生成したものを、資料がつながる絵として自動化に転用した。
画像を差し替えたら `data/services.py` の `image_alt` も絵の中身に合わせて直す。

置き場所は `static/images/services/`、ファイル名は上の3つ（`data/services.py` の `image` と一致させる）。
jpg で 1600px 四方・400KB 前後まで圧縮してから置く。置けば自動で仮の図柄と入れ替わる。

---

## 文言を変えるとき

冒頭の一文・名前の2行・肩書き・宣言文は `data/profile.py` の `HERO` にある。
名前の演出は文字数に合わせて自動で組み直すので、ここを書き換えるだけでよい。
