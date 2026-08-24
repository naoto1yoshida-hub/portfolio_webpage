"""撮影したUI画面をWeb掲載用に整える（余白トリミング + 縮小 + 最適化）。

    python scripts/demo_seeds/prep_screens.py <撮影した画像のディレクトリ>

元の 2880x1800 のままだと1枚300KB超になるため、掲載前に必ず通すこと。
手順の全体は docs/screenshots.md を参照。
"""
import pathlib
import sys

from PIL import Image

if len(sys.argv) < 2:
    sys.exit(f"使い方: python {sys.argv[0]} <撮影した画像のディレクトリ>")

SRC = pathlib.Path(sys.argv[1])
DST = pathlib.Path(__file__).resolve().parents[2] / "static" / "images" / "screens"
DST.mkdir(parents=True, exist_ok=True)

# (元ファイル, 出力名, 下端の切り取り位置。None は全体)
# 画面下部の空白が長い場合だけ切る。切りすぎるとサイドバーが欠ける
JOBS = [
    ("est-list.png", "estimate-list.png", 1150),
    ("est-detail.png", "estimate-detail.png", None),
    ("tasks-timeline.png", "tasks-timeline.png", 1250),
    ("tasks-thread.png", "tasks-thread.png", None),
]

TARGET_W = 1600

for src_name, out_name, crop_h in JOBS:
    src = SRC / src_name
    if not src.exists():
        print(f"skip: {src_name}（見つかりません）")
        continue
    im = Image.open(src).convert("RGB")
    if crop_h:
        im = im.crop((0, 0, im.width, min(crop_h, im.height)))
    ratio = TARGET_W / im.width
    im = im.resize((TARGET_W, round(im.height * ratio)), Image.LANCZOS)
    out = DST / out_name
    im.save(out, "PNG", optimize=True)
    print(f"{out_name}: {im.width}x{im.height}  {out.stat().st_size // 1024}KB")
