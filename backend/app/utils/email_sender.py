import logging
from typing import List, Optional
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import aiosmtplib
from app.core.config import settings
from app.core.logger import init_logger
from email.header import Header
from email.utils import formataddr

init_logger()
logger = logging.getLogger(__name__)

class AsyncEmailSender:
    def __init__(self, sender_name: str = "系统通知"):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.sender_email = settings.EMAILS_FROM_EMAIL
        self.sender_name = sender_name  # 新增发件人名称
        self.use_tls = settings.SMTP_TLS
        self.use_ssl = settings.SMTP_SSL

    async def send_email(
        self,
        recipients: List[str],
        subject: str,
        body: str,
        body_html: Optional[str] = None,
    ):
        #check if email settings are configured
        if not self.smtp_host or not self.sender_email:
            logger.error("Email settings are not properly configured.")
            return
        if not recipients:
            logger.error("No recipients provided for email.")
            return
        
          
        # 构建多格式邮件
        msg = MIMEMultipart("alternative")
        msg["From"] = formataddr((str(Header(self.sender_name, "utf-8")), self.sender_email))
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject

        # 文本版本
        part1 = MIMEText(body, "plain", "utf-8")
        msg.attach(part1)

        # HTML版本
        if body_html:
            part2 = MIMEText(body_html, "html", "utf-8")
            msg.attach(part2)

        # 连接 SMTP
        if self.use_ssl:
            smtp_client = aiosmtplib.SMTP(
                hostname=self.smtp_host, port=self.smtp_port, use_tls=True
            )
        else:
            smtp_client = aiosmtplib.SMTP(
                hostname=self.smtp_host, port=self.smtp_port, start_tls=self.use_tls
            )

        await smtp_client.connect()

        # 登录
        if self.smtp_user and self.smtp_password:
            await smtp_client.login(self.smtp_user, self.smtp_password)

        # 发送邮件
        await smtp_client.send_message(msg)
        await smtp_client.quit()


# 在模块末尾直接实例化一个全局对象，方便导入使用
email_sender = AsyncEmailSender(sender_name="系统通知")
