// utils/email.js
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_TLS = process.env.SMTP_TLS !== 'false';
const SMTP_SSL = process.env.SMTP_SSL === 'true';
const EMAILS_FROM_EMAIL = process.env.EMAILS_FROM_EMAIL;
const FRONTEND_HOST = process.env.CAPP_FRONTEND_HOST || process.env.FRONTEND_HOST || 'http://localhost:5174';
const BACKEND_HOST = process.env.CAPP_BACKEND_HOST || process.env.BACKEND_HOST || `http://localhost:${process.env.PORT || 4000}`;

let transporter = null;

/**
 * 获取邮件传输器（单例）
 */
function getTransporter() {
  if (!transporter) {
    if (!SMTP_HOST || !EMAILS_FROM_EMAIL) {
      console.error('[ERROR] SMTP settings are not configured');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SSL, // true for 465, false for other ports
      auth: SMTP_USER && SMTP_PASSWORD ? {
        user: SMTP_USER,
        pass: SMTP_PASSWORD
      } : undefined,
      tls: SMTP_TLS ? {
        rejectUnauthorized: false
      } : undefined
    });
  }
  return transporter;
}

/**
 * 发送邮件
 */
async function sendEmail(to, subject, text, html) {
  const transport = getTransporter();
  if (!transport) {
    throw new Error('SMTP not configured');
  }

  try {
    const info = await transport.sendMail({
      from: `"LingAdmin系统通知" <${EMAILS_FROM_EMAIL}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`[INFO] Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[ERROR] Failed to send email to ${to}:`, error);
    throw error;
  }
}

/**
 * 发送注册验证邮件
 */
async function sendRegistrationEmail(email, verificationToken) {
  const verificationUrl = `${BACKEND_HOST}/api/c/auth/verify-email?token=${verificationToken}`;
  
  const subject = 'LingAdmin系统通知 - 请验证您的邮箱地址';
  const text = `请点击以下链接验证您的邮箱：${verificationUrl}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>欢迎注册LingAdmin！</h2>
      <p>感谢您的注册。请点击以下链接验证您的邮箱地址：</p>
      <p style="margin: 20px 0;">
        <a href="${verificationUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
          验证邮箱
        </a>
      </p>
      <p>或者复制以下链接到浏览器：</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        此链接24小时内有效。如果您没有注册此账户，请忽略此邮件。
      </p>
    </div>
  `;

  return sendEmail(email, subject, text, html);
}

module.exports = {
  sendEmail,
  sendRegistrationEmail
};

