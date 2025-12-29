// routes/points.js
const express = require('express');
const { query } = require('../utils/db');
const { authenticateToken } = require('../utils/jwt');
const router = express.Router();

/**
 * 获取用户积分信息
 * GET /api/c/points
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // 获取或创建积分记录
    let pointsResult = await query(
      `SELECT * FROM user_points 
       WHERE user_id = $1 AND deleted = false`,
      [userId]
    );
    
    if (pointsResult.rows.length === 0) {
      // 创建新积分记录
      await query(
        `INSERT INTO user_points (user_id, balance, total_earned, total_spent, total_adjusted, deleted)
         VALUES ($1, 0, 0, 0, 0, false)`,
        [userId]
      );
      pointsResult = await query(
        `SELECT * FROM user_points 
         WHERE user_id = $1 AND deleted = false`,
        [userId]
      );
    }
    
    res.json({
      code: 0,
      message: 'ok',
      data: pointsResult.rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Get points error:', error);
    res.status(500).json({
      code: 1,
      message: '获取积分信息失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 获取用户积分交易记录
 * GET /api/c/points/transactions
 */
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, pageSize = 20, transactionType } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereClause = `WHERE pt.user_id = $1 AND pt.deleted = false`;
    const params = [userId];
    let paramIndex = 2;
    
    if (transactionType) {
      whereClause += ` AND pt.transaction_type = $${paramIndex}`;
      params.push(transactionType);
      paramIndex++;
    }
    
    const result = await query(
      `SELECT 
        pt.id,
        pt.transaction_type,
        pt.amount,
        pt.balance_before,
        pt.balance_after,
        pt.source_type,
        pt.description,
        pt.remark,
        pt.create_time
       FROM points_transaction pt
       ${whereClause}
       ORDER BY pt.create_time DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pageSize, offset]
    );
    
    const countResult = await query(
      `SELECT COUNT(*) as total FROM points_transaction pt ${whereClause}`,
      params
    );
    
    res.json({
      code: 0,
      message: 'ok',
      data: {
        transactions: result.rows,
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('[ERROR] Get transactions error:', error);
    res.status(500).json({
      code: 1,
      message: '获取交易记录失败: ' + error.message,
      data: null
    });
  }
});

module.exports = router;





