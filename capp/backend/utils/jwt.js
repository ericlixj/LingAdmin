// utils/jwt.js
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'your-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || '11520', 10); // 8 days default

/**
 * 创建访问令牌
 */
function createAccessToken(userId) {
  const expiresIn = ACCESS_TOKEN_EXPIRE_MINUTES * 60; // 转换为秒
  return jwt.sign(
    { sub: userId.toString(), type: 'access' },
    SECRET_KEY,
    { expiresIn }
  );
}

/**
 * 创建刷新令牌
 */
function createRefreshToken(userId) {
  return jwt.sign(
    { sub: userId.toString(), type: 'refresh' },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
}

/**
 * 创建邮件验证令牌（24小时有效）
 */
function createEmailVerificationToken(email) {
  return jwt.sign(
    { email, type: 'email_verification' },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
}

/**
 * 验证令牌
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}

/**
 * JWT 认证中间件
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      code: 1,
      message: '未授权：需要登录',
      data: null
    });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.type !== 'access') {
      return res.status(401).json({
        code: 1,
        message: '无效的令牌类型',
        data: null
      });
    }
    req.userId = parseInt(decoded.sub, 10);
    next();
  } catch (error) {
    return res.status(401).json({
      code: 1,
      message: error.message === 'Token expired' ? '令牌已过期' : '无效的令牌',
      data: null
    });
  }
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  createEmailVerificationToken,
  verifyToken,
  authenticateToken
};

