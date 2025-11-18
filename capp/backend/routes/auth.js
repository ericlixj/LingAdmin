// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../utils/db');
const { createAccessToken, createRefreshToken, createEmailVerificationToken, verifyToken, authenticateToken } = require('../utils/jwt');
const { sendRegistrationEmail } = require('../utils/email');

const router = express.Router();

/**
 * 用户注册（发送验证邮件）
 * POST /api/c/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({
        code: 1,
        message: '邮箱和密码不能为空',
        data: null
      });
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        code: 1,
        message: '邮箱格式不正确',
        data: null
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await query(
      'SELECT id FROM "user" WHERE email = $1 AND deleted = false',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        code: 1,
        message: '该邮箱已被注册',
        data: null
      });
    }

    // 密码哈希
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户（未激活状态）
    const result = await query(
      `INSERT INTO "user" (email, hashed_password, full_name, is_active, is_superuser, must_change_password, dept_id, deleted, create_time, update_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, email, full_name, is_active`,
      [email.toLowerCase(), hashedPassword, full_name || null, false, false, true, null, false]
    );

    const user = result.rows[0];

    // 生成邮件验证令牌
    const verificationToken = createEmailVerificationToken(email);

    // 发送验证邮件
    try {
      await sendRegistrationEmail(email, verificationToken);
      console.log(`[INFO] Registration email sent to ${email}`);
    } catch (emailError) {
      // 如果邮件发送失败，删除刚创建的用户
      await query('DELETE FROM "user" WHERE id = $1', [user.id]);
      console.error(`[ERROR] Failed to send registration email:`, emailError);
      return res.status(500).json({
        code: 1,
        message: '邮件发送失败，请稍后重试',
        data: null
      });
    }

    res.json({
      code: 0,
      message: '注册成功！请检查您的邮箱并点击验证链接激活账户。',
      data: {
        user_id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('[ERROR] Registration error:', error);
    res.status(500).json({
      code: 1,
      message: '注册失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 验证邮箱（激活账户）
 * GET /api/c/auth/verify-email?token=xxx
 */
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        code: 1,
        message: '缺少验证令牌',
        data: null
      });
    }

    // 验证令牌
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      return res.status(400).json({
        code: 1,
        message: error.message === 'Token expired' ? '验证链接已过期，请重新注册' : '无效的验证链接',
        data: null
      });
    }

    if (decoded.type !== 'email_verification') {
      return res.status(400).json({
        code: 1,
        message: '无效的验证令牌类型',
        data: null
      });
    }

    const email = decoded.email;

    // 查找用户
    const userResult = await query(
      'SELECT id, email, is_active FROM "user" WHERE email = $1 AND deleted = false',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '用户不存在',
        data: null
      });
    }

    const user = userResult.rows[0];

    if (user.is_active) {
      return res.json({
        code: 0,
        message: '账户已验证',
        data: { email: user.email }
      });
    }

    // 激活用户
    await query(
      'UPDATE "user" SET is_active = true, update_time = NOW() WHERE id = $1',
      [user.id]
    );

    // 查找 customer:normal 角色
    const roleResult = await query(
      'SELECT id FROM role WHERE code = $1 AND deleted = false',
      ['customer:normal']
    );

    if (roleResult.rows.length > 0) {
      const roleId = roleResult.rows[0].id;
      // 分配角色（检查是否已存在）
      const existingRole = await query(
        'SELECT user_id FROM user_role_link WHERE user_id = $1 AND role_id = $2',
        [user.id, roleId]
      );

      if (existingRole.rows.length === 0) {
        await query(
          'INSERT INTO user_role_link (user_id, role_id) VALUES ($1, $2)',
          [user.id, roleId]
        );
        console.log(`[INFO] Assigned customer:normal role to user ${user.id}`);
      }
    } else {
      console.warn(`[WARN] Role customer:normal not found, user ${user.id} activated without role`);
    }

    console.log(`[INFO] User ${user.id} (${email}) verified and activated`);

    res.json({
      code: 0,
      message: '邮箱验证成功！账户已激活。',
      data: {
        user_id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('[ERROR] Email verification error:', error);
    res.status(500).json({
      code: 1,
      message: '验证失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 用户登录
 * POST /api/c/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        code: 1,
        message: '邮箱和密码不能为空',
        data: null
      });
    }

    // 查找用户
    const userResult = await query(
      `SELECT u.id, u.email, u.hashed_password, u.is_active, u.full_name
       FROM "user" u
       WHERE u.email = $1 AND u.deleted = false`,
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        code: 1,
        message: '邮箱或密码错误',
        data: null
      });
    }

    const user = userResult.rows[0];

    // 检查账户是否激活
    if (!user.is_active) {
      return res.status(403).json({
        code: 1,
        message: '账户未激活，请检查邮箱并点击验证链接',
        data: null
      });
    }

    // 验证密码
    const passwordMatch = await bcrypt.compare(password, user.hashed_password);
    if (!passwordMatch) {
      return res.status(401).json({
        code: 1,
        message: '邮箱或密码错误',
        data: null
      });
    }

    // 检查用户是否有 customer 角色（可选，根据需求决定是否强制）
    const roleResult = await query(
      `SELECT r.id, r.code
       FROM role r
       JOIN user_role_link url ON r.id = url.role_id
       WHERE url.user_id = $1 AND r.code LIKE 'customer:%' AND r.deleted = false`,
      [user.id]
    );

    // 如果没有 customer 角色，可以警告但不阻止登录（根据需求调整）
    if (roleResult.rows.length === 0) {
      console.warn(`[WARN] User ${user.id} has no customer role`);
    }

    // 生成令牌
    const accessToken = createAccessToken(user.id);
    const refreshToken = createRefreshToken(user.id);

    console.log(`[INFO] User ${user.id} (${user.email}) logged in`);

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name
        },
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'bearer'
      }
    });
  } catch (error) {
    console.error('[ERROR] Login error:', error);
    res.status(500).json({
      code: 1,
      message: '登录失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 获取当前用户信息
 * GET /api/c/auth/me
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const userResult = await query(
      `SELECT u.id, u.email, u.full_name, u.is_active, u.dept_id
       FROM "user" u
       WHERE u.id = $1 AND u.deleted = false`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '用户不存在',
        data: null
      });
    }

    const user = userResult.rows[0];

    // 获取用户角色
    const roleResult = await query(
      `SELECT r.id, r.code, r.name
       FROM role r
       JOIN user_role_link url ON r.id = url.role_id
       WHERE url.user_id = $1 AND r.deleted = false`,
      [userId]
    );

    const roles = roleResult.rows.map(row => ({
      id: row.id,
      code: row.code,
      name: row.name
    }));

    res.json({
      code: 0,
      message: 'ok',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          is_active: user.is_active
        },
        roles
      }
    });
  } catch (error) {
    console.error('[ERROR] Get me error:', error);
    res.status(500).json({
      code: 1,
      message: '获取用户信息失败: ' + error.message,
      data: null
    });
  }
});

module.exports = router;

