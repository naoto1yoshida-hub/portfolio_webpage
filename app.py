"""
生成AI伴走型エンジニアリング開発 - ポートフォリオサイト
Flask アプリケーション
"""
from flask import Flask, render_template, request, jsonify
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv
import os

# .env ファイルの読み込み
load_dotenv()

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Gmail SMTP 設定
GMAIL_ADDRESS = os.getenv('GMAIL_ADDRESS')
GMAIL_APP_PASSWORD = os.getenv('GMAIL_APP_PASSWORD')

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def send_email(name, email, inquiry_type, message):
    """
    お問い合わせ内容をGmailに送信する。
    - 自分宛に通知メール（お問い合わせ内容の全文）
    - 送信者宛に自動返信メール（受付確認）
    """
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # --- 1. 自分宛の通知メール ---
    notify_msg = MIMEMultipart('alternative')
    notify_msg['Subject'] = f'【TEGG Engineering】新規お問い合わせ: {name} 様'
    notify_msg['From'] = GMAIL_ADDRESS
    notify_msg['To'] = GMAIL_ADDRESS

    notify_body = f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TEGG Engineering - 新規お問い合わせ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

受信日時 : {now}
お名前   : {name}
メール   : {email}
お問い合わせ種別 : {inquiry_type or '未選択'}

━━━ お問い合わせ内容 ━━━

{message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
このメールはポートフォリオサイトの
お問い合わせフォームから自動送信されています。
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
    notify_msg.attach(MIMEText(notify_body, 'plain', 'utf-8'))

    # --- 2. 差出人への自動返信メール ---
    reply_msg = MIMEMultipart('alternative')
    reply_msg['Subject'] = '【自動返信】お問い合わせを受け付けました'
    reply_msg['From'] = GMAIL_ADDRESS
    reply_msg['To'] = email

    reply_body = f"""
{name} 様

この度はお問い合わせいただき、誠にありがとうございます。
以下の内容でお問い合わせを受け付けいたしました。

━━━ お問い合わせ内容 ━━━

お問い合わせ種別 : {inquiry_type or '未選択'}
内容 :
{message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

内容を確認のうえ、2営業日以内にご連絡いたします。
今しばらくお待ちくださいませ。

─────────────────────────
TEGG Engineering
Email: {GMAIL_ADDRESS}
─────────────────────────
"""
    reply_msg.attach(MIMEText(reply_body, 'plain', 'utf-8'))

    # --- SMTP送信 ---
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)

        # 自分宛通知
        server.sendmail(GMAIL_ADDRESS, GMAIL_ADDRESS, notify_msg.as_string())
        logger.info(f"通知メール送信完了 → {GMAIL_ADDRESS}")

        # 差出人への自動返信
        server.sendmail(GMAIL_ADDRESS, email, reply_msg.as_string())
        logger.info(f"自動返信メール送信完了 → {email}")


@app.route('/')
def index():
    """メインページ"""
    return render_template('index.html')


@app.route('/contact', methods=['POST'])
def contact():
    """
    お問い合わせフォーム送信処理
    Gmailへの通知 + 差出人への自動返信
    """
    try:
        data = request.get_json()

        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        inquiry_type = data.get('inquiry_type', '').strip()
        message = data.get('message', '').strip()

        # バリデーション
        if not name or not email or not message:
            return jsonify({
                'success': False,
                'message': '必須項目を入力してください。'
            }), 400

        # ログに記録
        logger.info(
            f"\n{'='*50}\n"
            f"【新しいお問い合わせ】\n"
            f"受信日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"お名前: {name}\n"
            f"メール: {email}\n"
            f"種別: {inquiry_type}\n"
            f"内容: {message}\n"
            f"{'='*50}"
        )

        # Gmail送信
        if GMAIL_ADDRESS and GMAIL_APP_PASSWORD:
            send_email(name, email, inquiry_type, message)
        else:
            logger.warning("Gmail設定が見つかりません。.envファイルを確認してください。")

        return jsonify({
            'success': True,
            'message': 'お問い合わせを受け付けました。確認メールをお送りしましたのでご確認ください。'
        })

    except smtplib.SMTPAuthenticationError:
        logger.error("Gmail認証エラー: アプリパスワードを確認してください。")
        return jsonify({
            'success': False,
            'message': 'メール送信に失敗しました。管理者にお問い合わせください。'
        }), 500

    except Exception as e:
        logger.error(f"お問い合わせ処理エラー: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'エラーが発生しました。時間をおいて再度お試しください。'
        }), 500


if __name__ == '__main__':
    app.run(debug=False, port=5001)
