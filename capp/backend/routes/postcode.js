// routes/postcode.js
const express = require('express');
const { query } = require('../utils/db');
const { authenticateToken } = require('../utils/jwt');

const router = express.Router();

/**
 * 获取当前用户的所有 postcode
 * GET /api/c/postcode
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await query(
      `SELECT id, user_id, postcode, label, create_time, update_time
       FROM user_postcode
       WHERE user_id = $1 AND deleted = false
       ORDER BY create_time DESC`,
      [userId]
    );

    res.json({
      code: 0,
      message: 'ok',
      data: result.rows
    });
  } catch (error) {
    console.error('[ERROR] Get postcodes error:', error);
    res.status(500).json({
      code: 1,
      message: '获取 postcode 列表失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 创建 postcode
 * POST /api/c/postcode
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { postcode, label } = req.body;

    if (!postcode) {
      return res.status(400).json({
        code: 1,
        message: 'postcode 不能为空',
        data: null
      });
    }

    // 格式化 postcode（去掉空格，转大写）
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    
    // 验证加拿大邮编格式
    const postalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
    if (cleanPostcode.length !== 6 || !postalCodeRegex.test(cleanPostcode)) {
      return res.status(400).json({
        code: 1,
        message: 'postcode 格式不正确，应为 A1A 1A1 格式',
        data: null
      });
    }

    // 检查是否已存在相同的 postcode
    const existing = await query(
      `SELECT id FROM user_postcode 
       WHERE user_id = $1 AND postcode = $2 AND deleted = false`,
      [userId, cleanPostcode]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        code: 1,
        message: '该 postcode 已存在',
        data: null
      });
    }

    // 创建 postcode
    const result = await query(
      `INSERT INTO user_postcode (user_id, postcode, label, creator, dept_id, deleted, create_time, update_time)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, user_id, postcode, label, create_time, update_time`,
      [userId, cleanPostcode, label || '', userId.toString(), null, false]
    );

    res.json({
      code: 0,
      message: '创建成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Create postcode error:', error);
    res.status(500).json({
      code: 1,
      message: '创建 postcode 失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 更新 postcode
 * PATCH /api/c/postcode/:id
 */
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { postcode, label } = req.body;

    // 检查记录是否存在且属于当前用户
    const existing = await query(
      `SELECT id FROM user_postcode 
       WHERE id = $1 AND user_id = $2 AND deleted = false`,
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: 'postcode 不存在',
        data: null
      });
    }

    // 构建更新语句
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (postcode !== undefined) {
      const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
      const postalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
      if (cleanPostcode.length !== 6 || !postalCodeRegex.test(cleanPostcode)) {
        return res.status(400).json({
          code: 1,
          message: 'postcode 格式不正确，应为 A1A 1A1 格式',
          data: null
        });
      }

      // 检查新 postcode 是否与其他记录冲突
      const conflict = await query(
        `SELECT id FROM user_postcode 
         WHERE user_id = $1 AND postcode = $2 AND id != $3 AND deleted = false`,
        [userId, cleanPostcode, id]
      );

      if (conflict.rows.length > 0) {
        return res.status(400).json({
          code: 1,
          message: '该 postcode 已被其他记录使用',
          data: null
        });
      }

      updates.push(`postcode = $${paramIndex++}`);
      values.push(cleanPostcode);
    }

    if (label !== undefined) {
      updates.push(`label = $${paramIndex++}`);
      values.push(label || '');
    }

    if (updates.length === 0) {
      return res.status(400).json({
        code: 1,
        message: '没有要更新的字段',
        data: null
      });
    }

    updates.push(`updater = $${paramIndex++}`);
    values.push(userId.toString());
    updates.push(`update_time = NOW()`);
    
    // 添加 WHERE 条件的参数
    values.push(id, userId);

    const result = await query(
      `UPDATE user_postcode 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} AND deleted = false
       RETURNING id, user_id, postcode, label, create_time, update_time`,
      values
    );

    res.json({
      code: 0,
      message: '更新成功',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Update postcode error:', error);
    res.status(500).json({
      code: 1,
      message: '更新 postcode 失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 删除 postcode（软删除）
 * DELETE /api/c/postcode/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // 检查记录是否存在且属于当前用户
    const existing = await query(
      `SELECT id FROM user_postcode 
       WHERE id = $1 AND user_id = $2 AND deleted = false`,
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: 'postcode 不存在',
        data: null
      });
    }

    // 软删除
    await query(
      `UPDATE user_postcode 
       SET deleted = true, update_time = NOW()
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({
      code: 0,
      message: '删除成功',
      data: null
    });
  } catch (error) {
    console.error('[ERROR] Delete postcode error:', error);
    res.status(500).json({
      code: 1,
      message: '删除 postcode 失败: ' + error.message,
      data: null
    });
  }
});

module.exports = router;

