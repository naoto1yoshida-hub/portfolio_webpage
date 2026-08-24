"""
ポートフォリオ掲載用スクリーンショットのためのダミーデータ投入。

実データは一切使わない。社員は同梱の SAMPLE_EMPLOYEES（架空名）、
案件・図番・本文はすべてこのファイルで作った架空のもの。
"""
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, init_db
from app.models import Assignment, Employee, Message, Notification, Task

SAMPLE_EMPLOYEES = [
    ("絞り 一郎", "絞り"),
    ("旋盤 二郎", "旋盤"),
    ("ブランク 三郎", "ブランク"),
    ("レーザー 四郎", "3Dレーザー"),
    ("バフ 五郎", "バフ"),
    ("品質 六子", "品質管理"),
    ("ティグ 七郎", "TIG"),
    ("ヤグ 八郎", "YAG"),
    ("業務 九実", "業務"),
    ("営業 十郎", "営業"),
    ("社長 一夫", "経営陣"),
]

# (件名, カテゴリ, ステータス, 起票者, 現担当, 経過日数, 現担当になってからの日数, [(発言者, 本文), ...])
DEMO_TASKS = [
    (
        "SMP-1042-03 の絞り加工、既存金型を流用できるか確認したい",
        "見積", "in_progress", "営業 十郎", "絞り 一郎", 9, 2,
        [
            ("営業 十郎", "お客様から SMP-1042-03 の引き合いがあります。形状が SMP-1038 に近いので、金型を流用できれば金型費を落とせないでしょうか。図面を添付しています。"),
            ("絞り 一郎", "確認しました。フランジ径は同じですが、絞り深さが 4mm 深いので同じ金型では抜けません。ただしパンチだけ作り替えれば台座は流用できます。"),
            ("営業 十郎", "パンチのみの作り替えだと、金型費はどのくらい下がりますか。"),
            ("絞り 一郎", "概算で 6 割ほどに収まる見込みです。正確な数字は業務に工数を出してもらってから回答します。"),
        ],
    ),
    (
        "SMP-0871 の納期を1週間前倒しできますか",
        "納期", "open", "営業 十郎", "業務 九実", 4, 4,
        [
            ("営業 十郎", "先方の組立日程が前倒しになったとのことで、納期を 1 週間早められないか打診がありました。可否だけでも早めに回答したいです。"),
            ("業務 九実", "ブランクの空き状況を確認します。材料の入荷が来週頭なので、そこから逆算して折り返します。"),
        ],
    ),
    (
        "バフ研摩 #400 指定品の外観基準をそろえたい",
        "品質", "in_progress", "品質 六子", "バフ 五郎", 16, 6,
        [
            ("品質 六子", "同じ #400 指定でも、担当者によって仕上がりのばらつきが出ています。限度見本を作って基準を固定したいです。"),
            ("バフ 五郎", "賛成です。良品・限度・不良の 3 枚を用意します。ヘラ目の方向も基準に入れたほうがよいでしょうか。"),
            ("品質 六子", "入れてください。客先からの指摘はヘラ目の向きが多いです。"),
        ],
    ),
    (
        "3Dレーザー切断品の端面バリ、取り扱い基準の確認",
        "品質", "done", "レーザー 四郎", "品質 六子", 24, 11,
        [
            ("レーザー 四郎", "板厚 3.0 以上でドロスが残ることがあります。バリ取り工程に回すかどうかの基準はありますか。"),
            ("品質 六子", "図面に「バリなきこと」の指示がある場合のみ回してください。指示がなければレーザー側の目視で落とす運用です。"),
            ("レーザー 四郎", "承知しました。作業手順書に追記します。"),
        ],
    ),
    (
        "新規受注品の工程割付を相談させてください",
        "受注", "in_progress", "業務 九実", "旋盤 二郎", 6, 3,
        [
            ("業務 九実", "新規で入ってきた部品の工程割付を相談させてください。旋盤とブランクのどちらを先にするかで段取りが変わります。"),
            ("旋盤 二郎", "外径を先に仕上げると掴み代がなくなるので、ブランク先行のほうが安定します。"),
        ],
    ),
    (
        "TIG溶接の位置決め治具、追加製作の可否",
        "その他", "open", "ティグ 七郎", "社長 一夫", 2, 2,
        [
            ("ティグ 七郎", "同じ形状のリピートが増えてきたので、位置決め治具をもう 1 セット作りたいです。段取り時間が短縮できます。"),
        ],
    ),
    (
        "YAG溶接の溶接条件、材質違いの記録を残したい",
        "その他", "open", "ヤグ 八郎", "品質 六子", 12, 12,
        [
            ("ヤグ 八郎", "材質ごとに条件を出し直しているので、うまくいった条件を残していきたいです。どこに記録するのがよいですか。"),
        ],
    ),
    (
        "SMP-0655 リピート分の見積、前回単価を教えてください",
        "見積", "done", "営業 十郎", "業務 九実", 30, 19,
        [
            ("営業 十郎", "SMP-0655 のリピートです。前回の単価を確認したいです。"),
            ("業務 九実", "前回は 3 年前で、材料費が上がっているのでそのままは使えません。工程は同じなのでレートだけ引き直します。"),
            ("業務 九実", "引き直した単価を見積ツールに入れました。確認をお願いします。"),
            ("営業 十郎", "確認しました。この内容で提出します。"),
        ],
    ),
]


def main():
    init_db()
    db = SessionLocal()
    try:
        if db.query(Task).count() > 0:
            print("既にデータがあります。中止しました。")
            return

        by_name = {}
        for name, dept in SAMPLE_EMPLOYEES:
            emp = db.query(Employee).filter(Employee.name == name).first()
            if emp is None:
                emp = Employee(name=name, department=dept, is_active=True)
                db.add(emp)
                db.flush()
            by_name[name] = emp

        now = datetime.utcnow()

        for title, category, status, creator, assignee, age_days, held_days, msgs in DEMO_TASKS:
            created = now - timedelta(days=age_days, hours=3)
            assigned = now - timedelta(days=held_days, hours=1)

            task = Task(
                title=title,
                category=category,
                status=status,
                created_by=by_name[creator].id,
                assignee_id=by_name[assignee].id,
                assigned_at=assigned,
                created_at=created,
                completed_at=(now - timedelta(days=max(held_days - 1, 0))) if status == "done" else None,
                last_activity_at=created,
            )
            db.add(task)
            db.flush()

            db.add(Assignment(
                task_id=task.id,
                assignee_id=by_name[assignee].id,
                assigned_by=by_name[creator].id,
                note=None,
                created_at=assigned,
            ))

            step = max(age_days / max(len(msgs), 1), 0.4)
            last = created
            for i, (author, body) in enumerate(msgs):
                last = created + timedelta(days=step * i, hours=2)
                db.add(Message(
                    task_id=task.id,
                    author_id=by_name[author].id,
                    body=body,
                    kind="comment",
                    created_at=last,
                ))
            task.last_activity_at = last

        db.commit()
        print(f"投入完了: 社員 {len(SAMPLE_EMPLOYEES)}名 / タスク {len(DEMO_TASKS)}件")
    finally:
        db.close()


if __name__ == "__main__":
    main()
