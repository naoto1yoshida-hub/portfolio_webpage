"""
ポートフォリオ掲載用スクリーンショットのためのダミー見積データ。

実データは一切使わない。客先名・図番・品名・金額はすべてこのファイルで作った架空のもの。
"""
import os
import sys
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, init_db
from app.models import (
    EstimateMaterial,
    EstimateMold,
    EstimateProcess,
    EstimateRequest,
    MaterialMaster,
    ProcessMaster,
)

# 材料マスター（架空の単価）
MATERIALS = [
    ("SUS304 2B", "1.0", "メーター板", 12800.0),
    ("SUS304 2B", "1.5", "メーター板", 18600.0),
    ("SUS304 2B", "2.0", "メーター板", 24200.0),
    ("SUS304 2B", "1.5", "四八材", 9800.0),
    ("SUS430 2B", "1.0", "メーター板", 8400.0),
    ("SUS430 2B", "1.5", "メーター板", 11900.0),
    ("SPCC", "1.6", "メーター板", 5200.0),
    ("SPCC", "2.3", "メーター板", 7100.0),
    ("SPCC", "3.2", "5×10材", 13400.0),
    ("AL5052", "1.5", "メーター板", 14600.0),
    ("AL5052", "2.0", "四八材", 11200.0),
    ("SUS316L", "1.5", "メーター板", 31800.0),
]

# (客先, 図番, 品名, 数量, 状態, 経過日数, 担当)
ESTIMATES = [
    ("三洋製作所", "SMP-1042-03", "カバー（絞り）", 200, "confirmed", 2, "見積担当"),
    ("東和金属工業", "SMP-0871-01", "ブラケット", 500, "estimating", 4, "見積担当"),
    ("北陸テクノ", "SMP-1155-00", "ハウジング上蓋", 50, "requested", 1, "営業"),
    ("三洋製作所", "SMP-0655-02", "ベースプレート", 1000, "answered", 11, "見積担当"),
    ("大成精機", "SMP-0930-01", "フランジ付パイプ", 120, "waiting_outsource", 6, "見積担当"),
    ("東和金属工業", "SMP-0788-04", "取付金具", 300, "lost", 22, "営業"),
]

# 主役1件（SMP-1042-03）の工程明細: (工程名, 加工内容, 段取り分, 加工分)
PROCESSES = [
    ("ブランク", "外形抜き", 30, 0.6),
    ("絞り", "1工程目 深さ12", 90, 1.8),
    ("絞り", "2工程目 深さ22", 60, 1.5),
    ("穴明", "φ6 × 4カ所", 25, 0.4),
    ("バリ取り", "全周", 10, 0.8),
    ("バフ", "#400 片面", 20, 2.4),
    ("検査", "全数外観・寸法抜取", 15, 0.5),
    ("梱包", "20個/箱", 10, 0.2),
]


def main():
    init_db()
    db = SessionLocal()
    try:
        if db.query(MaterialMaster).count() == 0:
            for name, thick, size, price in MATERIALS:
                db.add(MaterialMaster(
                    material_name=name, thickness=thick, standard_size=size,
                    base_price=price,
                    vinyl_single_price=round(price * 0.06),
                    vinyl_double_price=round(price * 0.10),
                    polish_single_price=1000.0, polish_double_price=2000.0,
                ))
            db.flush()

        if db.query(EstimateRequest).count() > 0:
            print("既に見積データがあります。中止しました。")
            return

        proc_by_name = {p.process_name: p for p in db.query(ProcessMaster).all()}
        sus15 = db.query(MaterialMaster).filter(
            MaterialMaster.material_name == "SUS304 2B",
            MaterialMaster.thickness == "1.5",
            MaterialMaster.standard_size == "メーター板",
        ).first()

        now = datetime.utcnow()
        first_id = None

        for customer, drawing, product, qty, status, age, staff in ESTIMATES:
            created = now - timedelta(days=age, hours=5)
            e = EstimateRequest(
                customer_name=customer,
                drawing_number=drawing,
                drawing_number_norm=drawing.replace("-", "").upper(),
                product_name=product,
                quantity=qty,
                deadline=(date.today() + timedelta(days=14 + age)),
                staff=staff,
                sales_comment="リピート品。前回と同一仕様で見積をお願いします。" if "0655" in drawing else "初回引き合い。数量変動の可能性あり。",
                factory_comment="材料価格の変動により、有効期限は発行日より30日とさせていただきます。",
                packaging_cost=40.0,
                management_rate=0.07,
                profit_rate=0.3,
                shipping_cost=60.0,
                material_id=sus15.id if sus15 else None,
                blank_width=186.0,
                blank_length=186.0,
                surface_treatment="バフ研摩 #400（片面）",
                status=status,
                created_by=staff,
                created_at=created,
                updated_at=created + timedelta(hours=6),
            )
            db.add(e)
            db.flush()
            if first_id is None:
                first_id = e.id

            # 主役1件だけ明細まで作り込む
            if drawing != "SMP-1042-03":
                continue

            for i, (pname, memo, setup, ptime) in enumerate(PROCESSES, start=1):
                master = proc_by_name.get(pname)
                db.add(EstimateProcess(
                    estimate_id=e.id,
                    step_order=i,
                    row_kind="process",
                    process_id=master.id if master else None,
                    process_name=pname,
                    process_memo=memo,
                    setup_time=float(setup),
                    process_time=float(ptime),
                    rate_snapshot=master.rate if master else 114,
                ))

            db.add(EstimateMold(
                estimate_id=e.id, row_no=2, steel_material="SKD11",
                steel_cost=68000.0, processing_cost=142000.0,
                heat_treatment_cost=24000.0, sales_price=280000.0,
            ))
            db.add(EstimateMold(
                estimate_id=e.id, row_no=6, steel_material="S50C",
                steel_cost=12000.0, processing_cost=38000.0,
                heat_treatment_cost=0.0, sales_price=62000.0,
            ))

            db.add(EstimateMaterial(
                estimate_id=e.id, row_order=1,
                material_name="SUS304 2B t1.5",
                detail="メーター板 1000×2000 より 40個取り",
                dimension="186×186 / 40個取り", quantity=1.0,
                unit_price=465.0, amount=465.0,
            ))

        db.commit()
        print(f"投入完了: 材料 {db.query(MaterialMaster).count()}件 / 見積 {db.query(EstimateRequest).count()}件 / 主役ID={first_id}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
