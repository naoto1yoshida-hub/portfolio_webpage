# 画像・動画の生成プロンプト

トップページで使う素材の生成指示と、置き場所・仕様をまとめる。
ファイルを所定の場所に置けば、テンプレートが自動で拾う（コードの変更は不要）。

| 素材 | 必須か | 置き場所 | 無いとき |
|---|---|---|---|
| ヒーロー動画 | 必須 | `static/video/hero.mp4` | 青緑の仮背景（線と面の構造体）が出る |
| ヒーロー静止画 | 任意 | `static/images/hero-poster.jpg` | 動画の読み込み中は青緑の単色が出る |
| 写真の帯 | 任意 | `static/images/gallery/01.jpg` 〜 | 帯ごと出ない |

色調の基準は参照サイト（shinyaokano.jp）のヒーロー動画。実測では **青緑の単色調（#1b4a50 〜 #2a6a70 付近）、
彩度は低め、白飛びなし**。上に白い文字を載せるので、画面中央に明るい被写体や細かい模様を置かない。

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

## 文言を変えるとき

冒頭の一文・名前の2行・肩書き・宣言文は `data/profile.py` の `HERO` にある。
名前の演出は文字数に合わせて自動で組み直すので、ここを書き換えるだけでよい。
