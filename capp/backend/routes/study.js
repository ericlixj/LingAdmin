// routes/study.js
const express = require('express');
const { query } = require('../utils/db');
const { authenticateToken } = require('../utils/jwt');
const { parseAnswer, normalizeUserAnswer, compareAnswers } = require('../utils/answerValidator');

const router = express.Router();

// 内存存储：练习会话状态
// 格式: { userId_sessionId: { questionIds: [...], currentIndex: 0 } }
const practiceSessions = new Map();

// 工具函数：打乱数组
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 清理过期的练习会话（可选：定期清理）
setInterval(() => {
  // 可以添加清理逻辑，比如清理超过1小时未使用的会话
  // 目前先不实现，保持简单
}, 60 * 60 * 1000); // 每小时检查一次

/**
 * 奖励考试积分
 * 每次完成考试都奖励积分，根据分数给予不同积分：
 * - 基础积分：每次完成考试2积分
 * - 额外积分：根据分数给予
 *   - 60分以下：0额外积分
 *   - 60-79分：+3积分
 *   - 80-89分：+5积分
 *   - 90-99分：+10积分
 *   - 100分：+20积分
 */
/**
 * 检查并奖励连续三次满分
 * 逻辑：同一个用户，对同一个考试（exam），连续3次都得了100分
 * 注意：这里检查的是同一个exam_id的最近三次考试session，不是同一个session（一个session只有一次成绩）
 * 
 * @param {number} userId - 用户ID
 * @param {number} sessionId - 当前考试session ID
 * @param {string} examName - 考试名称
 * @returns {Promise<number>} - 返回奖励的积分数量（0表示未奖励）
 */
async function checkAndAwardConsecutivePerfectScore(userId, sessionId, examName) {
  try {
    console.log(`[DEBUG] ========== 开始检查连续三次满分奖励 ==========`);
    console.log(`[DEBUG] userId: ${userId}, sessionId: ${sessionId}, examName: ${examName}`);
    
    // 首先获取当前考试的 exam_id
    const currentSessionResult = await query(
      `SELECT exam_id FROM study_session WHERE id = $1 AND deleted = false`,
      [sessionId]
    );
    
    if (currentSessionResult.rows.length === 0) {
      console.log(`[DEBUG] 无法找到当前考试session，跳过连续三次满分检查`);
      return 0;
    }
    
    const examId = currentSessionResult.rows[0].exam_id;
    console.log(`[DEBUG] 当前考试的 exam_id: ${examId}`);
    console.log(`[DEBUG] 检查逻辑：同一个用户（userId=${userId}），同一个考试（exam_id=${examId}），连续3次100分`);
    console.log(`[DEBUG] 注意：由于同一个exam只有一个session，需要通过points_transaction表查询历史记录`);
    
    // 由于同一个用户、同一个exam只有一个session，每次考试都会更新同一个session的score
    // 所以我们需要通过points_transaction表来查询历史记录
    // 查询同一个session（同一个exam）的最近三次积分交易记录（按时间倒序，包括当前这次）
    const recentTransactionsResult = await query(
      `SELECT pt.id, pt.source_id, pt.description, pt.create_time, pt.remark
       FROM points_transaction pt
       JOIN study_session ss ON pt.source_id = ss.id
       WHERE pt.user_id = $1
         AND pt.source_type = 'exam'
         AND pt.source_id = $2
         AND pt.description LIKE '%考试完成%'
         AND pt.deleted = false
         AND ss.exam_id = $3
         AND ss.deleted = false
       ORDER BY pt.create_time DESC
       LIMIT 3`,
      [userId, sessionId, examId]
    );
    
    const recentTransactions = recentTransactionsResult.rows;
    console.log(`[DEBUG] 同一个考试（exam_id: ${examId}）的最近三次考试记录: ${recentTransactions.length} 条记录`);
    console.log(`[DEBUG] 最近三次考试详情:`, recentTransactions.map(tx => ({
      id: tx.id,
      source_id: tx.source_id,
      description: tx.description,
      create_time: tx.create_time
    })));
    
    // 检查是否有三次考试
    if (recentTransactions.length < 3) {
      console.log(`[DEBUG] 考试次数不足3次，不满足连续三次满分条件`);
      return 0;
    }
    
    // 从description中提取分数，格式： "考试完成 (得分: X)"
    const extractScore = (description) => {
      const match = description.match(/得分:\s*(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
      return null;
    };
    
    // 检查最近三次是否都是100分
    const allPerfect = recentTransactions.every(tx => {
      const score = extractScore(tx.description);
      const isPerfect = score !== null && score === 100;
      console.log(`[DEBUG] 考试记录 ${tx.id}: description="${tx.description}", extracted_score=${score}, isPerfect=${isPerfect}`);
      return isPerfect;
    });
    
    if (!allPerfect) {
      console.log(`[DEBUG] 最近三次考试不全是满分，不满足连续三次满分条件`);
      return 0;
    }
    
    console.log(`[DEBUG] ✅ 检测到连续三次满分！`);
    
    // 检查最近三次考试中是否已经有连续三次满分的奖励记录
    // 获取最近三次考试的 transaction id 列表
    const recentTransactionIds = recentTransactions.map(tx => tx.id);
    console.log(`[DEBUG] 最近三次考试的 transaction id: ${recentTransactionIds.join(', ')}`);
    
    // 检查这三次考试中是否有任何一次已经因为连续三次满分而获得奖励
    // 如果已经奖励过，说明这三次中的某一次已经触发过奖励，不应该重复奖励
    console.log(`[DEBUG] 检查最近三次考试中是否有奖励记录，transactionIds: ${recentTransactionIds.join(', ')}`);
    
    // 由于同一个exam只有一个session，所以source_id都是相同的
    // 我们需要检查是否有连续三次满分奖励记录，并且检查是否与当前这三次有重叠
    const checkResult = await query(
      `SELECT id, source_id, description, create_time FROM points_transaction
       WHERE user_id = $1
         AND source_type = 'exam'
         AND source_id = $2
         AND description LIKE '%连续三次满分%'
         AND deleted = false
       ORDER BY create_time DESC
       LIMIT 1`,
      [userId, sessionId]
    );
    
    console.log(`[DEBUG] 检查结果: ${checkResult.rows.length} 条记录`, checkResult.rows.length > 0 ? {
      id: checkResult.rows[0].id,
      source_id: checkResult.rows[0].source_id,
      description: checkResult.rows[0].description,
      create_time: checkResult.rows[0].create_time
    } : '无记录');
    
    if (checkResult.rows.length > 0) {
      // 检查之前的奖励是否与当前这三次考试有重叠
      // 查询之前奖励时对应的最近三次考试记录
      const lastRewardedTime = checkResult.rows[0].create_time;
      const lastRewardedGroupResult = await query(
        `SELECT pt.id, pt.create_time, pt.description
         FROM points_transaction pt
         JOIN study_session ss ON pt.source_id = ss.id
         WHERE pt.user_id = $1
           AND pt.source_type = 'exam'
           AND pt.source_id = $2
           AND pt.description LIKE '%考试完成%'
           AND pt.deleted = false
           AND ss.exam_id = $3
           AND ss.deleted = false
           AND pt.create_time <= $4
         ORDER BY pt.create_time DESC
         LIMIT 3`,
        [userId, sessionId, examId, lastRewardedTime]
      );
      
      const lastRewardedGroupIds = lastRewardedGroupResult.rows.map(row => row.id);
      console.log(`[DEBUG] 之前奖励时对应的三次考试 transaction id: ${lastRewardedGroupIds.join(', ')}`);
      
      // 检查是否有重叠（如果最近三次中有任何一次在之前奖励的那三次中，说明有重叠）
      const hasOverlap = recentTransactionIds.some(id => lastRewardedGroupIds.includes(id));
      if (hasOverlap) {
        console.log(`[DEBUG] 最近三次考试与之前奖励的连续三次满分有重叠，不再重复奖励`);
        return 0;
      }
    }
    
    // 奖励100积分
    const bonusAmount = 100;
    
    // 获取当前积分余额（需要重新查询，因为可能刚刚更新过）
    const pointsResult = await query(
      `SELECT balance FROM user_points 
       WHERE user_id = $1 AND deleted = false`,
      [userId]
    );
    
    if (pointsResult.rows.length === 0) {
      console.error(`[ERROR] 用户积分记录不存在`);
      return 0;
    }
    
    const balanceBefore = parseFloat(pointsResult.rows[0].balance || 0);
    const balanceAfter = balanceBefore + bonusAmount;
    
    // 更新积分总值
    await query(
      `UPDATE user_points 
       SET balance = $1, 
           total_earned = total_earned + $2,
           update_time = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
      [balanceAfter, bonusAmount, userId]
    );
    
    // 创建积分明细记录
    const description = `连续三次满分奖励`;
    const remark = examName ? `连续三次满分: ${examName}` : `连续三次满分`;
    
    await query(
      `INSERT INTO points_transaction 
       (user_id, transaction_type, amount, balance_before, balance_after, 
        source_type, source_id, source_table, description, remark, deleted, create_time)
       VALUES ($1, 'earn', $2, $3, $4, 'exam', $5, 'study_session', $6, $7, false, CURRENT_TIMESTAMP)
       RETURNING id`,
      [userId, bonusAmount, balanceBefore, balanceAfter, sessionId, description, remark]
    );
    
    console.log(`[INFO] ✅ 连续三次满分奖励成功 - 奖励 ${bonusAmount} 积分`);
    return bonusAmount;
    
  } catch (error) {
    console.error(`[ERROR] 检查连续三次满分奖励失败:`, error);
    throw error;
  }
}

async function awardExamPoints(userId, score, sessionId) {
  try {
    console.log(`[DEBUG] ========== awardExamPoints 开始 ==========`);
    console.log(`[DEBUG] 参数 - userId: ${userId} (${typeof userId}), score: ${score} (${typeof score}), sessionId: ${sessionId} (${typeof sessionId})`);
    
    // 确保score是数字类型
    let numericScore = typeof score === 'number' ? score : parseFloat(score);
    
    // 如果转换失败，尝试从字符串转换
    if (isNaN(numericScore)) {
      numericScore = parseInt(score) || 0;
    }
    
    // 确保是有效数字
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
      console.error(`[ERROR] Invalid score: ${score} (type: ${typeof score}), numericScore: ${numericScore}`);
      numericScore = 0;
    }
    
    // 添加调试日志
    console.log(`[DEBUG] awardExamPoints - userId: ${userId}, score: ${score} (type: ${typeof score}), numericScore: ${numericScore}`);
    
    // 基础积分：每次完成考试都奖励
    let basePoints = 2;
    let bonusPoints = 0;
    
    // 根据分数给予额外积分
    if (numericScore >= 100) {
      bonusPoints = 20;
    } else if (numericScore >= 90) {
      bonusPoints = 10;
    } else if (numericScore >= 80) {
      bonusPoints = 5;
    } else if (numericScore >= 60) {
      bonusPoints = 3;
    }
    // 60分以下只有基础积分，无额外积分
    
    const pointsAmount = basePoints + bonusPoints;
    
    console.log(`[DEBUG] awardExamPoints - basePoints: ${basePoints}, bonusPoints: ${bonusPoints}, pointsAmount: ${pointsAmount}, score: ${numericScore}`);
    
    // 确保sessionId是整数类型
    const sessionIdInt = parseInt(sessionId) || sessionId;
    console.log(`[DEBUG] 准备奖励积分 - userId: ${userId}, sessionId: ${sessionId} (type: ${typeof sessionId}), sessionIdInt: ${sessionIdInt}`);
    
    // 注意：每次考试完成都奖励积分，不检查是否已奖励过
    // 这样可以确保每次提交考试都能获得积分
    
    // 获取或创建用户积分记录
    console.log(`[DEBUG] 获取或创建用户积分记录 - userId: ${userId}`);
    let pointsResult;
    try {
      pointsResult = await query(
        `SELECT * FROM user_points 
         WHERE user_id = $1 AND deleted = false`,
        [userId]
      );
      console.log(`[DEBUG] 查询用户积分记录结果: ${pointsResult.rows.length} 条`);
    } catch (queryError) {
      console.error(`[ERROR] 查询用户积分记录失败:`, queryError);
      console.error(`[ERROR] 错误信息:`, queryError.message);
      console.error(`[ERROR] 错误堆栈:`, queryError.stack);
      throw new Error(`查询用户积分记录失败: ${queryError.message}`);
    }
    
    if (pointsResult.rows.length === 0) {
      // 创建新积分记录
      console.log(`[DEBUG] 用户积分记录不存在，创建新记录`);
      try {
        await query(
          `INSERT INTO user_points (user_id, balance, total_earned, total_spent, total_adjusted, deleted)
           VALUES ($1, 0, 0, 0, 0, false)`,
          [userId]
        );
        console.log(`[DEBUG] 用户积分记录创建成功`);
        
        pointsResult = await query(
          `SELECT * FROM user_points 
           WHERE user_id = $1 AND deleted = false`,
          [userId]
        );
        console.log(`[DEBUG] 重新查询用户积分记录: ${pointsResult.rows.length} 条`);
      } catch (insertError) {
        console.error(`[ERROR] 创建用户积分记录失败:`, insertError);
        console.error(`[ERROR] 错误信息:`, insertError.message);
        console.error(`[ERROR] 错误堆栈:`, insertError.stack);
        throw new Error(`创建用户积分记录失败: ${insertError.message}`);
      }
    }
    
    const points = pointsResult.rows[0];
    const balanceBefore = parseFloat(points.balance || 0);
    const balanceAfter = balanceBefore + pointsAmount;
    
    console.log(`[DEBUG] 积分更新前 - balanceBefore: ${balanceBefore}, pointsAmount: ${pointsAmount}, balanceAfter: ${balanceAfter}`);
    
    // 更新积分总值（确保有记录）
    let updateResult;
    try {
      updateResult = await query(
        `UPDATE user_points 
         SET balance = $1, 
             total_earned = total_earned + $2,
             update_time = CURRENT_TIMESTAMP
         WHERE user_id = $3
         RETURNING balance, total_earned`,
        [balanceAfter, pointsAmount, userId]
      );
      console.log(`[DEBUG] 积分更新查询结果: ${updateResult.rows.length} 条`);
    } catch (updateError) {
      console.error(`[ERROR] 更新用户积分失败:`, updateError);
      console.error(`[ERROR] 错误信息:`, updateError.message);
      throw new Error(`更新用户积分失败: ${updateError.message}`);
    }
    
    if (updateResult.rows.length === 0) {
      throw new Error(`更新用户积分失败: userId=${userId}, 没有返回结果`);
    }
    
    console.log(`[DEBUG] 积分更新后 - balance: ${updateResult.rows[0].balance}, total_earned: ${updateResult.rows[0].total_earned}`);
    
    // 查询考试名称
    let examName = null;
    try {
      const examResult = await query(
        `SELECT se.name as exam_name
         FROM study_session ss
         JOIN study_exam se ON ss.exam_id = se.id
         WHERE ss.id = $1 AND ss.deleted = false`,
        [sessionIdInt]
      );
      if (examResult.rows.length > 0 && examResult.rows[0].exam_name) {
        examName = examResult.rows[0].exam_name;
        console.log(`[DEBUG] 查询到考试名称: ${examName}`);
      }
    } catch (examQueryError) {
      console.warn(`[WARN] 查询考试名称失败: ${examQueryError.message}，继续执行`);
    }
    
    // 创建积分明细记录（确保有记录）
    let description = `考试完成 (得分: ${numericScore})`;
    if (bonusPoints > 0) {
      description += `，获得基础积分${basePoints}分，额外奖励${bonusPoints}分`;
    } else {
      description += `，获得基础积分${basePoints}分`;
    }
    
    // 将考试名称添加到备注字段
    let remark = examName ? `考试: ${examName}` : null;
    
    let transactionResult;
    try {
      transactionResult = await query(
        `INSERT INTO points_transaction 
         (user_id, transaction_type, amount, balance_before, balance_after, 
          source_type, source_id, source_table, description, remark, deleted, create_time)
         VALUES ($1, 'earn', $2, $3, $4, 'exam', $5, 'study_session', $6, $7, false, CURRENT_TIMESTAMP)
         RETURNING id`,
        [userId, pointsAmount, balanceBefore, balanceAfter, sessionIdInt, description, remark]
      );
      console.log(`[DEBUG] 积分交易记录插入结果: ${transactionResult.rows.length} 条`);
    } catch (insertError) {
      console.error(`[ERROR] 创建积分交易记录失败:`, insertError);
      console.error(`[ERROR] 错误信息:`, insertError.message);
      console.error(`[ERROR] SQL参数: userId=${userId}, pointsAmount=${pointsAmount}, sessionIdInt=${sessionIdInt}`);
      throw new Error(`创建积分交易记录失败: ${insertError.message}`);
    }
    
    if (transactionResult.rows.length === 0) {
      throw new Error(`创建积分交易记录失败: userId=${userId}, sessionId=${sessionIdInt}, 没有返回结果`);
    }
    
    console.log(`[INFO] ✅ 用户 ${userId} 考试 ${sessionIdInt} 获得 ${pointsAmount} 积分 (基础: ${basePoints}, 额外: ${bonusPoints}, 得分: ${numericScore})`);
    console.log(`[INFO] ✅ 积分明细记录已创建 - transaction_id: ${transactionResult.rows[0].id}`);
    console.log(`[INFO] ✅ 积分总值已更新 - balance: ${updateResult.rows[0].balance}, total_earned: ${updateResult.rows[0].total_earned}`);
    
    // 检查连续三次满分奖励
    let consecutiveBonus = 0;
    if (numericScore === 100) {
      console.log(`[DEBUG] ========== 开始检查连续三次满分奖励 ==========`);
      console.log(`[DEBUG] numericScore: ${numericScore}, userId: ${userId}, sessionIdInt: ${sessionIdInt}, examName: ${examName}`);
      try {
        consecutiveBonus = await checkAndAwardConsecutivePerfectScore(userId, sessionIdInt, examName);
        console.log(`[DEBUG] 连续三次满分奖励检查完成，返回积分: ${consecutiveBonus}`);
        if (consecutiveBonus > 0) {
          console.log(`[INFO] ✅ 连续三次满分奖励 - 额外奖励 ${consecutiveBonus} 积分`);
        } else {
          console.log(`[DEBUG] 连续三次满分奖励检查完成，但未满足奖励条件（返回0）`);
        }
      } catch (consecutiveError) {
        console.error(`[ERROR] 检查连续满分奖励失败: ${consecutiveError.message}`);
        console.error(`[ERROR] 错误堆栈:`, consecutiveError.stack);
        // 不影响主流程，继续执行
      }
      console.log(`[DEBUG] ========== 连续三次满分奖励检查结束 ==========`);
    } else {
      console.log(`[DEBUG] 当前考试得分不是100分（${numericScore}），跳过连续三次满分奖励检查`);
    }
    
    console.log(`[DEBUG] ========== awardExamPoints 成功完成 ==========`);
    
    return pointsAmount + consecutiveBonus; // 返回奖励的积分数量（包括连续满分奖励）
  } catch (error) {
    console.error('[ERROR] ❌ Award exam points error:', error);
    console.error('[ERROR] ❌ Error message:', error.message);
    console.error('[ERROR] ❌ Error stack:', error.stack);
    console.error(`[DEBUG] ========== awardExamPoints 失败 ==========`);
    throw error;
  }
}

/**
 * 获取用户的学习记录列表
 * GET /api/c/study/sessions
 */
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId; // 从JWT中获取用户ID
    const { test_date } = req.query; // 添加 test_date 参数用于测试
    
    const result = await query(
      `SELECT 
        ss.id,
        ss.user_id,
        ss.exam_id,
        ss.mode,
        ss.exam_duration,
        ss.question_count,
        ss.score,
        ss.create_time,
        se.name as exam_name,
        COALESCE(ss.exam_duration, 60) as exam_duration_minutes
      FROM study_session ss
      LEFT JOIN study_exam se ON ss.exam_id = se.id
      WHERE ss.user_id = $1 AND ss.deleted = false
      ORDER BY ss.create_time DESC`,
      [userId]
    );
    
    // 为每个session获取题目统计信息
    const sessionsWithStats = await Promise.all(
      result.rows.map(async (session) => {
        // 获取题目总数
        let totalQuery;
        if (session.mode && session.mode.toLowerCase() === 'flashcard') {
          // Flashcard 类型：基于 next_review_date 计算题目数量
          // 只统计 next_review_date <= today 的记录数量（今天需要学习的内容）
          // 用于测试时可以传入 test_date，否则使用系统当前日期
          let today;
          if (test_date) {
            today = new Date(test_date);
            if (isNaN(today.getTime())) {
              today = new Date(); // 如果 test_date 格式无效，使用系统日期
            }
          } else {
            today = new Date();
          }
          today.setHours(0, 0, 0, 0);
          const todayStr = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
          
          totalQuery = `
            SELECT COUNT(*) as total_count
            FROM study_flashcard_progress sfp
            WHERE sfp.user_id = $1
              AND sfp.exam_id = $2
              AND sfp.deleted = false
              AND sfp.next_review_date <= $3::date
          `;
        } else {
          // 其他类型：只统计 question 类型
          totalQuery = `
            SELECT COUNT(*) as total_count
            FROM study_session_item ssi
            INNER JOIN study_learning_item sli ON ssi.learning_item_id = sli.id
            LEFT JOIN study_question sq ON sli.type = 'question' AND sli.ref_id = sq.id
            WHERE ssi.session_id = $1 
              AND ssi.deleted = false 
              AND sli.deleted = false
              AND sli.type = 'question'
              AND sq.id IS NOT NULL
              AND sq.status = 1
          `;
        }
        
        // 对于 Flashcard 类型，需要传入 user_id、exam_id 和 today；对于其他类型，传入 session_id
        let totalParams;
        if (session.mode && session.mode.toLowerCase() === 'flashcard') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayStr = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
          totalParams = [userId, session.exam_id, todayStr];
        } else {
          totalParams = [session.id];
        }
        
        const totalResult = await query(totalQuery, totalParams);
        
        // 获取错题数量（只统计已提交且答错的题目，is_correct = 0）
        // 注意：未答题目（is_correct IS NULL）不算错题，重新答对的题目（is_correct = 1）也不算错题
        const wrongResult = await query(
          `SELECT COUNT(*) as wrong_count
           FROM study_session_item ssi
           INNER JOIN study_learning_item sli ON ssi.learning_item_id = sli.id
           LEFT JOIN study_question sq ON sli.type = 'question' AND sli.ref_id = sq.id
           WHERE ssi.session_id = $1 
             AND ssi.deleted = false 
             AND sli.deleted = false
             AND sli.type = 'question'
             AND sq.id IS NOT NULL
             AND sq.status = 1
             AND ssi.is_correct = 0
             AND ssi.response IS NOT NULL`,
          [session.id]
        );
        
        // 获取收藏题目数量
        const favoriteResult = await query(
          `SELECT COUNT(*) as favorite_count
           FROM study_session_item ssi
           INNER JOIN study_learning_item sli ON ssi.learning_item_id = sli.id
           LEFT JOIN study_question sq ON sli.type = 'question' AND sli.ref_id = sq.id
           WHERE ssi.session_id = $1 
             AND ssi.deleted = false 
             AND sli.deleted = false
             AND sli.type = 'question'
             AND sq.id IS NOT NULL
             AND sq.status = 1
             AND sli.is_favorited = true`,
          [session.id]
        );
        
        // 获取已完成题目数量（通过 progress_question_id 计算，适用于所有模式）
        let completed_count = 0; // 默认为 0（还没开始）
        
        // 获取当前进度（所有模式都支持进度）
        const progressResult = await query(
          'SELECT progress_question_id FROM study_session WHERE id = $1 AND user_id = $2',
          [session.id, userId]
        );
        
        const progressQuestionId = progressResult.rows[0]?.progress_question_id;
        if (progressQuestionId) {
          // 获取所有题目的ID列表（按ID排序），找到 progress_question_id 的位置
          const allQuestionsResult = await query(
            `SELECT sq.id
             FROM study_session_item ssi
             INNER JOIN study_learning_item sli ON ssi.learning_item_id = sli.id
             LEFT JOIN study_question sq ON sli.type = 'question' AND sli.ref_id = sq.id
             WHERE ssi.session_id = $1 
               AND ssi.deleted = false 
               AND sli.deleted = false
               AND sli.type = 'question'
               AND sq.id IS NOT NULL
               AND sq.status = 1
             ORDER BY sq.id`,
            [session.id]
          );
          
          // 找到 progress_question_id 在列表中的位置
          const questionIds = allQuestionsResult.rows.map(row => row.id);
          const progressIndex = questionIds.findIndex(id => id === progressQuestionId);
          if (progressIndex >= 0) {
            // progress_question_id 表示已完成到这一题，所以已完成数量 = 索引 + 1
            // 例如：如果 progress_question_id 是第3题（索引2），已完成数量是 3
            completed_count = progressIndex + 1;
            console.log(`[GET /sessions] 找到进度: progress_question_id=${progressQuestionId}, 索引=${progressIndex}, completed_count=${completed_count}`);
          } else {
            console.warn(`[GET /sessions] 进度题目不在列表中: progress_question_id=${progressQuestionId}`);
          }
          // 如果找不到，completed_count 保持为 0
        }
        // 如果没有 progress_question_id，completed_count 保持为 0（还没开始）
        
        console.log(`[GET /sessions] Session ${session.id} (mode: ${session.mode}): completed_count=${completed_count}, total_count=${parseInt(totalResult.rows[0]?.total_count || 0)}`);
        
        // 如果是考试模式，生成格式化的名称：exam_name[yyyyMMdd HH:mm:ss]
        let displayName = session.exam_name || `Exam #${session.exam_id}`;
        if (session.mode === 'exam' && session.create_time) {
          const createTime = new Date(session.create_time);
          const year = createTime.getFullYear();
          const month = String(createTime.getMonth() + 1).padStart(2, '0');
          const day = String(createTime.getDate()).padStart(2, '0');
          const hours = String(createTime.getHours()).padStart(2, '0');
          const minutes = String(createTime.getMinutes()).padStart(2, '0');
          const seconds = String(createTime.getSeconds()).padStart(2, '0');
          const timestamp = `${year}${month}${day} ${hours}:${minutes}:${seconds}`;
          displayName = `${session.exam_name || '考试'}[${timestamp}]`;
        }
        
        return {
          ...session,
          exam_name: displayName, // 使用格式化后的名称
          total_count: parseInt(totalResult.rows[0]?.total_count || 0),
          wrong_count: parseInt(wrongResult.rows[0]?.wrong_count || 0),
          favorite_count: parseInt(favoriteResult.rows[0]?.favorite_count || 0),
          completed_count: completed_count // 已完成题目数量（仅对"全部"模式有效，null 表示不适用，0 表示已完成0题）
        };
      })
    );
    
    res.json({
      code: 0,
      message: 'ok',
      data: sessionsWithStats
    });
  } catch (error) {
    console.error('[ERROR] Get study sessions failed:', error);
    res.status(500).json({
      code: 1,
      message: '获取学习记录失败: ' + error.message,
      data: []
    });
  }
});

/**
 * 开始练习：初始化练习会话，将所有题目加载到内存
 * POST /api/c/study/sessions/:id/start
 * body: { mode: "all" | "wrong" | "favorite" | "exam" } - 练习模式：全部题目、仅错题、仅收藏或考试模式
 * 注意：错题模式按顺序显示，每次进入从第一题开始；收藏模式会打乱顺序；考试模式会打乱顺序
 */
router.post('/sessions/:id/start', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.userId;
    const { mode = "all" } = req.body; // 默认为"all"，可选"wrong"、"favorite"、"exam"
    
    // 验证session是否属于当前用户
    const sessionCheck = await query(
      'SELECT id, mode FROM study_session WHERE id = $1 AND user_id = $2 AND deleted = false',
      [sessionId, userId]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '学习记录不存在',
        data: null
      });
    }
    
    // 如果请求的是考试模式，验证session的mode字段必须是"exam"
    if (mode === "exam") {
      const sessionMode = sessionCheck.rows[0].mode;
      if (sessionMode !== "exam") {
        return res.status(400).json({
          code: 1,
          message: '该学习记录不是考试模式，不能使用考试模式',
          data: null
        });
      }
    }
    // 练习模式（"all"、"wrong"、"favorite"）不需要验证session的mode字段，保持与github版本一致
    
    // 构建查询条件：根据模式过滤题目
    let whereCondition = `ssi.session_id = $1 
      AND ssi.deleted = false 
      AND sli.deleted = false
      AND sli.type = 'question'
      AND sq.id IS NOT NULL
      AND sq.status = 1`;
    
    const queryParams = [sessionId];
    
    // 根据模式过滤题目
    if (mode === "wrong") {
      // 错题模式：只获取 is_correct = 0 的题目
      whereCondition += ` AND ssi.is_correct = 0`;
    } else if (mode === "favorite") {
      // 收藏模式：只获取 is_favorited = true 的题目
      whereCondition += ` AND sli.is_favorited = true`;
    }
    
    // 获取学习记录明细中的题目ID列表（包含 learning_item_id）
    // 对于"全部题库"模式，按question ID排序；对于"错题"模式，按ssi.id排序（保持顺序，不打乱）；对于"收藏"模式，按ssi.id排序（后续会打乱）
    const orderBy = mode === "all" ? "sq.id" : "ssi.id";
    const result = await query(
      `SELECT 
        ssi.id as item_id,
        ssi.learning_item_id,
        sli.is_favorited,
        sq.id as question_id
      FROM study_session_item ssi
      INNER JOIN study_learning_item sli ON ssi.learning_item_id = sli.id
      LEFT JOIN study_question sq ON sli.type = 'question' AND sli.ref_id = sq.id
      WHERE ${whereCondition}
      ORDER BY ${orderBy}`,
      queryParams
    );
    
    if (result.rows.length === 0) {
      let message = '该学习记录中没有题目';
      if (mode === "wrong") {
        message = '该学习记录中没有错题';
      } else if (mode === "favorite") {
        message = '该学习记录中没有收藏题目';
      }
      return res.json({
        code: 1,
        message: message,
        data: null
      });
    }
    
    // 提取题目ID和item_id的映射（包含 learning_item_id 和收藏状态）
    const questionData = result.rows.map(row => ({
      itemId: row.item_id,
      questionId: row.question_id,
      learningItemId: row.learning_item_id,
      isFavorited: row.is_favorited || false
    }));
    
    let finalQuestionData = questionData;
    let currentIndex = 0;
    let hasProgress = false;
    
    // 对于"全部题库"模式，按ID排序
    // 读取之前的进度，从上次完成的位置继续
    if (mode === "all") {
      // 读取进度，从上次完成的位置继续
      const progressResult = await query(
        'SELECT progress_question_id FROM study_session WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
      );
      
      const progressQuestionId = progressResult.rows[0]?.progress_question_id;
      if (progressQuestionId) {
        // 找到该题目在题目列表中的索引
        const progressIndex = questionData.findIndex(q => q.questionId === progressQuestionId);
        if (progressIndex >= 0) {
          // 找到了，从该位置继续（currentIndex 是已完成题目的索引）
          currentIndex = progressIndex;
          console.log(`[POST /start] 全部模式：读取进度，已完成到索引 ${currentIndex}，题目ID=${progressQuestionId}`);
        } else {
          // 没找到（可能题目被删除或修改），从头开始
          currentIndex = -1;
          console.log(`[POST /start] 全部模式：进度题目不存在，从头开始`);
        }
      } else {
        // 没有进度，从头开始
        currentIndex = -1;
        console.log(`[POST /start] 全部模式：没有进度，从头开始`);
      }
    } else if (mode === "wrong") {
      // 错题模式：按顺序显示，每次进入都从第一题开始
      // 不打乱题目顺序，保持原始顺序
      // 初始化为 -1，第一次 GET /next 时推进到 0，返回第一题
      currentIndex = -1;
    } else if (mode === "favorite") {
      // 收藏模式：打乱题目顺序
      finalQuestionData = shuffleArray(questionData);
      // 初始化为 -1，第一次 GET /next 时推进到 0，返回第一题
      currentIndex = -1;
    } else if (mode === "exam") {
      // 考试模式：打乱题目顺序，从第一题开始
      finalQuestionData = shuffleArray(questionData);
      // 初始化为 -1，第一次 GET /next 时推进到 0，返回第一题
      currentIndex = -1;
    }
    
    // 存储到内存中
    // 注意：currentIndex 表示已完成题目的索引（已完成到第几题）
    // 对于错题和收藏模式，初始化为 -1，第一次 GET /next 时返回索引 0 的题目（第一题），不推进索引
    // 对于全部模式，如果从进度恢复，currentIndex 是已完成题目的索引，第一次 GET /next 时返回下一题（currentIndex + 1），不推进索引
    // 如果全部模式从头开始，currentIndex 是 -1，第一次 GET /next 时返回索引 0 的题目（第一题），不推进索引
    const sessionKey = `${userId}_${sessionId}_${mode}`;
    
    // 每次 start 接口被调用时，都重新初始化会话（清除旧会话）
    // 对于错题和收藏模式，确保每次进入都从第一题开始
    // 对于全部模式，读取进度，从上次完成的位置继续
    practiceSessions.set(sessionKey, {
      questionData: finalQuestionData,
      currentIndex: currentIndex,
      totalCount: finalQuestionData.length,
      mode: mode,
      isFirstCall: true // 标记是否是第一次调用 GET /next
    });
    
    console.log(`[POST /start] 会话已初始化: ${sessionKey}, mode: ${mode}, currentIndex: ${currentIndex}, totalCount: ${finalQuestionData.length}, isFirstCall: true, questionData.length: ${finalQuestionData.length}`);
    
    console.log(`[INFO] Practice session started: ${sessionKey}, mode: ${mode}, total questions: ${finalQuestionData.length}, currentIndex: ${currentIndex}`);
    
    res.json({
      code: 0,
      message: 'ok',
      data: {
        totalCount: finalQuestionData.length,
        currentIndex: currentIndex,
        mode: mode
      }
    });
  } catch (error) {
    console.error('[ERROR] Start practice session failed:', error);
    res.status(500).json({
      code: 1,
      message: '开始练习失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 获取下一题：返回当前题目的详细信息
 * GET /api/c/study/sessions/:id/next
 */
router.get('/sessions/:id/next', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.userId;
    const mode = req.query.mode || "all"; // 从查询参数获取模式
    const requestedIndex = req.query.index ? parseInt(req.query.index) : null; // 考试模式可以通过 index 参数获取指定索引的题目
    const sessionKey = `${userId}_${sessionId}_${mode}`;
    
    console.log(`[GET /next] 请求参数:`, {
      sessionId,
      userId,
      mode,
      sessionKey,
      requestedIndex,
    });
    
    // 从内存中获取练习会话
    let practiceSession = practiceSessions.get(sessionKey);
    if (!practiceSession) {
      console.warn(`[GET /next] 练习会话未找到，尝试自动恢复: ${sessionKey}`);
      
      // 自动恢复会话：重新初始化
      try {
        // 验证session是否属于当前用户
        const sessionCheck = await query(
          'SELECT id FROM study_session WHERE id = $1 AND user_id = $2 AND deleted = false',
          [sessionId, userId]
        );
        
        if (sessionCheck.rows.length === 0) {
          return res.status(404).json({
            code: 1,
            message: '学习记录不存在',
            data: null
          });
        }
        
        // 构建查询条件：根据模式过滤题目
        let whereCondition = `ssi.session_id = $1 
          AND ssi.deleted = false 
          AND sli.deleted = false
          AND sli.type = 'question'
          AND sq.id IS NOT NULL
          AND sq.status = 1`;
        
        const queryParams = [sessionId];
        
        // 根据模式过滤题目
        if (mode === "wrong") {
          whereCondition += ` AND ssi.is_correct = 0`;
        } else if (mode === "favorite") {
          whereCondition += ` AND sli.is_favorited = true`;
        }
        
        // 获取学习记录明细中的题目ID列表
        const orderBy = mode === "all" ? "sq.id" : "ssi.id";
        const result = await query(
          `SELECT 
            ssi.id as item_id,
            ssi.learning_item_id,
            sli.is_favorited,
            sq.id as question_id
          FROM study_session_item ssi
          INNER JOIN study_learning_item sli ON ssi.learning_item_id = sli.id
          LEFT JOIN study_question sq ON sli.type = 'question' AND sli.ref_id = sq.id
          WHERE ${whereCondition}
          ORDER BY ${orderBy}`,
          queryParams
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({
            code: 1,
            message: mode === "wrong" ? '该学习记录中没有错题' : mode === "favorite" ? '该学习记录中没有收藏题目' : '该学习记录中没有题目',
            data: null
          });
        }
        
        // 提取题目数据
        const questionData = result.rows.map(row => ({
          itemId: row.item_id,
          questionId: row.question_id,
          learningItemId: row.learning_item_id,
          isFavorited: row.is_favorited || false
        }));
        
        let finalQuestionData = questionData;
        let currentIndex = 0;
        
        // 对于"全部题库"模式，读取进度
        if (mode === "all") {
          const progressResult = await query(
            'SELECT progress_question_id FROM study_session WHERE id = $1 AND user_id = $2',
            [sessionId, userId]
          );
          
          const progressQuestionId = progressResult.rows[0]?.progress_question_id;
          if (progressQuestionId) {
            const progressIndex = questionData.findIndex(q => q.questionId === progressQuestionId);
            if (progressIndex >= 0) {
              // 找到了，从该位置继续（currentIndex 是已完成题目的索引）
              currentIndex = progressIndex;
              console.log(`[GET /next] 自动恢复：全部模式，已完成到索引 ${currentIndex}，题目ID=${progressQuestionId}`);
            } else {
              // 没找到（可能题目被删除或修改），从头开始
              currentIndex = -1;
              console.log(`[GET /next] 自动恢复：全部模式，进度题目不存在，从头开始`);
            }
          } else {
            // 没有进度，从头开始
            currentIndex = -1;
            console.log(`[GET /next] 自动恢复：全部模式，没有进度，从头开始`);
          }
        } else if (mode === "wrong") {
          // 错题模式：按顺序显示，每次进入都从第一题开始
          // 不打乱题目顺序，保持原始顺序
          currentIndex = -1; // 初始化为 -1，第一次 GET /next 时推进到 0
        } else if (mode === "favorite") {
          // 收藏模式：打乱题目顺序
          finalQuestionData = shuffleArray(questionData);
          currentIndex = -1; // 初始化为 -1，第一次 GET /next 时推进到 0
        } else if (mode === "exam") {
          // 考试模式：打乱题目顺序
          finalQuestionData = shuffleArray(questionData);
          currentIndex = -1; // 初始化为 -1，第一次 GET /next 时推进到 0
        }
        
        // 重新存储到内存中
        practiceSession = {
          questionData: finalQuestionData,
          currentIndex: currentIndex,
          totalCount: finalQuestionData.length,
          mode: mode,
          isFirstCall: true // 标记是否是第一次调用 GET /next
        };
        practiceSessions.set(sessionKey, practiceSession);
        
        console.log(`[INFO] Practice session auto-recovered: ${sessionKey}, mode: ${mode}, total questions: ${finalQuestionData.length}, currentIndex: ${currentIndex}`);
      } catch (recoverError) {
        console.error(`[ERROR] Failed to auto-recover session: ${sessionKey}`, recoverError);
        return res.status(500).json({
          code: 1,
          message: '自动恢复练习会话失败: ' + recoverError.message,
          data: null
        });
      }
    }
    
    const { questionData, currentIndex, totalCount } = practiceSession;
    const isFirstCall = practiceSession.isFirstCall || false;
    
    console.log(`[GET /next] 当前索引: ${currentIndex} (内部索引，从0开始), 总题目数: ${totalCount}, 题目数据长度: ${questionData.length}, 是否首次调用: ${isFirstCall}, 请求索引: ${requestedIndex}`);
    
    // 考试模式：可以通过 index 参数获取指定索引的题目
    if (mode === "exam") {
      let targetIndex;
      
      if (requestedIndex !== null && requestedIndex !== undefined) {
        // 如果提供了 index 参数，使用该索引
        targetIndex = requestedIndex;
      } else if (isFirstCall) {
        // 第一次调用，返回第一题（索引0）
        targetIndex = 0;
        practiceSession.isFirstCall = false;
      } else {
        // 没有提供 index，使用当前索引
        targetIndex = currentIndex >= 0 ? currentIndex : 0;
      }
      
      // 验证索引范围
      if (targetIndex < 0 || targetIndex >= questionData.length) {
        return res.status(404).json({
          code: 1,
          message: `题目索引无效: ${targetIndex}, 总题目数: ${totalCount}`,
          data: null
        });
      }
      
      // 更新当前索引（但不保存进度，考试模式不保存进度）
      practiceSession.currentIndex = targetIndex;
      
      const currentQuestion = questionData[targetIndex];
      const questionId = currentQuestion.questionId;
      const itemId = currentQuestion.itemId;
      const learningItemId = currentQuestion.learningItemId;
      
      // 获取题目详细信息
      const questionResult = await query(
        `SELECT 
          sq.id,
          sq.exam_id,
          sq.stem,
          sq.options,
          sq.answer,
          sq.type,
          sq.explanation_raw,
          sq.explanation_human,
          sq.image_url,
          sq.status
        FROM study_question sq
        WHERE sq.id = $1 AND sq.status = 1`,
        [questionId]
      );
      
      if (questionResult.rows.length === 0) {
        return res.status(404).json({
          code: 1,
          message: '题目不存在',
          data: null
        });
      }
      
      const question = questionResult.rows[0];
      
      res.json({
        code: 0,
        message: 'ok',
        data: {
          itemId: itemId,
          learningItemId: learningItemId,
          question: question,
          currentIndex: targetIndex + 1, // 从1开始显示
          totalCount,
          finished: false
        }
      });
      return; // 提前返回
    }
    
    // 全部题库模式的逻辑：
    // currentIndex 表示已完成题目的索引（已完成到第几题）
    // 第一次 GET /next：返回 currentIndex + 1 的题目（下一题），不推进索引
    // 点击下一题：保存当前题目进度，currentIndex + 1，返回 currentIndex + 1 的题目
    
    if (mode === "all") {
      let targetIndex; // 要返回的题目索引
      
      if (isFirstCall) {
        // 第一次调用：返回题目，不推进索引
        // currentIndex 是已完成题目的索引（已完成到第几题）
        if (currentIndex < 0) {
          // 没有进度，从头开始，返回第一题（索引0），但不推进索引
          targetIndex = 0;
        } else {
          // 有进度，返回下一题（currentIndex + 1），但不推进索引
          // currentIndex 是已完成题目的索引，所以下一题是 currentIndex + 1
          targetIndex = currentIndex + 1;
          // 检查是否已完成所有题目
          if (targetIndex >= questionData.length) {
            // 已完成所有题目，返回完成状态
            practiceSession.isFirstCall = false;
            console.log(`[GET /next] 全部模式首次调用，已完成所有题目（索引 ${currentIndex}）`);
            return res.json({
              code: 0,
              message: 'ok',
              data: {
                finished: true,
                totalCount,
                currentIndex: targetIndex // 从1开始显示
              }
            });
          }
        }
        // 第一次调用时，更新 currentIndex 为 targetIndex，这样下次调用时能正确推进
        // 但这是"显示"的题目索引，不是"已完成"的索引
        // 对于全部模式，currentIndex 表示已完成题目的索引，所以这里应该设置为 targetIndex - 1
        // 但如果 targetIndex = 0，则 currentIndex 应该保持为 -1（表示还没完成任何题目）
        if (targetIndex > 0) {
          practiceSession.currentIndex = targetIndex - 1; // 已完成到 targetIndex - 1
        } else {
          practiceSession.currentIndex = -1; // 还没完成任何题目
        }
        practiceSession.isFirstCall = false;
        console.log(`[GET /next] 全部模式首次调用，返回索引 ${targetIndex} 的题目（currentIndex 更新为 ${practiceSession.currentIndex}）`);
      } else {
        // 点击下一题：保存当前题目进度，然后推进索引
        // 当前显示的题目索引需要根据 currentIndex 计算
        // 如果 currentIndex < 0，说明当前显示的是第一题（索引0），需要保存第一题的进度
        // 如果 currentIndex >= 0，说明当前显示的是 currentIndex + 1 的题目，需要保存这一题的进度
        
        let currentDisplayIndex; // 当前显示的题目索引
        if (currentIndex < 0) {
          // currentIndex = -1 表示还没完成任何题目，当前显示的是第一题（索引0）
          currentDisplayIndex = 0;
        } else {
          // currentIndex 是已完成题目的索引，当前显示的是 currentIndex + 1
          currentDisplayIndex = currentIndex + 1;
        }
        
        // 保存当前显示题目的进度
        if (currentDisplayIndex >= 0 && currentDisplayIndex < questionData.length) {
          const currentQuestion = questionData[currentDisplayIndex];
          if (currentQuestion && currentQuestion.questionId) {
            // 保存当前题目的ID作为进度（表示已完成到这一题）
            query(
              'UPDATE study_session SET progress_question_id = $1 WHERE id = $2 AND user_id = $3',
              [currentQuestion.questionId, sessionId, userId]
            ).catch(err => {
              console.error(`[GET /next] 保存进度失败:`, err);
            });
            console.log(`[GET /next] 保存进度: 已完成到索引 ${currentDisplayIndex}，题目ID=${currentQuestion.questionId}`);
          }
        }
        
        // 推进索引，返回下一题
        // 将 currentIndex 更新为 currentDisplayIndex（表示已完成到这一题）
        practiceSession.currentIndex = currentDisplayIndex;
        // 下一题是 currentDisplayIndex + 1
        targetIndex = currentDisplayIndex + 1;
        console.log(`[GET /next] 全部模式点击下一题，索引从 ${currentIndex} 推进到 ${targetIndex}（已完成到 ${currentDisplayIndex}）`);
      }
      
      // 检查是否还有题目
      if (targetIndex >= questionData.length || targetIndex >= totalCount) {
        console.log(`[GET /next] 全部模式已到达最后一题，返回 finished=true: targetIndex=${targetIndex}, questionData.length=${questionData.length}, totalCount=${totalCount}`);
        return res.json({
          code: 0,
          message: 'ok',
          data: {
            finished: true,
            totalCount,
            currentIndex: targetIndex + 1 // 从1开始显示
          }
        });
      }
      
      // 使用 targetIndex 获取题目，而不是 practiceSession.currentIndex
      // 这样首次调用时不会改变 currentIndex
      const currentQuestion = questionData[targetIndex];
      if (!currentQuestion) {
        console.error(`[GET /next] 题目不存在: targetIndex=${targetIndex}, questionData.length=${questionData.length}, totalCount=${totalCount}`);
        return res.status(404).json({
          code: 1,
          message: `题目不存在: targetIndex=${targetIndex}, 总题目数=${totalCount}`,
          data: null
        });
      }
      
      const questionId = currentQuestion.questionId;
      const itemId = currentQuestion.itemId;
      const learningItemId = currentQuestion.learningItemId;
      const isFavorited = currentQuestion.isFavorited || false;
      
      console.log(`[GET /next] 获取题目: questionId=${questionId}, itemId=${itemId}, learningItemId=${learningItemId}, 显示索引=${targetIndex + 1}, currentIndex=${practiceSession.currentIndex}`);
      
      // 获取题目详细信息，同时获取收藏状态和笔记
      const questionResult = await query(
        `SELECT 
          sq.*,
          ssi.note
        FROM study_question sq
        LEFT JOIN study_session_item ssi ON ssi.learning_item_id = $1 AND ssi.session_id = $2 AND ssi.deleted = false
        WHERE sq.id = $3 AND sq.status = 1
        LIMIT 1`,
        [learningItemId, sessionId, questionId]
      );
      
      if (questionResult.rows.length === 0) {
        console.error(`[GET /next] 题目不存在: questionId=${questionId}`);
        return res.status(404).json({
          code: 1,
          message: `题目不存在: questionId=${questionId}`,
          data: null
        });
      }
      
      const question = questionResult.rows[0];
      
      // 获取知识点
      const knowledgeNodesResult = await query(
        `SELECT kn.* FROM study_question_knowledge sqkn
         INNER JOIN study_knowledge_node kn ON sqkn.knowledge_node_id = kn.id
         WHERE sqkn.question_id = $1 AND sqkn.deleted = false AND kn.deleted = false
         ORDER BY kn.id ASC`,
        [questionId]
      );
      const knowledgeNodes = knowledgeNodesResult.rows;
      
      res.json({
        code: 0,
        message: 'ok',
        data: {
          itemId: itemId,
          learningItemId: learningItemId,
          question: {
            ...question,
            is_favorited: isFavorited,
            note: question.note || '',
            knowledge_nodes: knowledgeNodes
          },
          currentIndex: targetIndex + 1, // 从1开始显示
          totalCount,
          finished: false
        }
      });
      return; // 提前返回，避免执行后面的代码
    } else {
      // 错题和收藏模式的逻辑
      // currentIndex 初始化为 -1，表示还没开始
      // 第一次 GET /next：返回索引 0 的题目（第一题），不推进索引（currentIndex 保持为 -1）
      // 点击下一题：推进索引，返回下一题
      let targetIndex; // 要返回的题目索引
      
      if (isFirstCall) {
        // 第一次调用：返回第一题（索引0）
        targetIndex = 0;
        // 第一次调用时，更新 currentIndex 为 0（表示当前显示的是第一题）
        // 这样下次调用时能正确推进到第二题
        practiceSession.currentIndex = 0;
        practiceSession.isFirstCall = false;
        console.log(`[GET /next] ${mode}模式首次调用，返回索引 0 的题目（第一题），currentIndex 更新为 0, totalCount=${totalCount}, questionData.length=${questionData.length}`);
        
        // 检查是否还有题目（在首次调用时也要检查）
        // 如果只有1题，targetIndex = 0，应该返回第一题，不应该返回 finished
        if (targetIndex >= questionData.length || targetIndex >= totalCount) {
          console.log(`[GET /next] ${mode}模式首次调用，但已到达最后一题，返回 finished=true: targetIndex=${targetIndex}, questionData.length=${questionData.length}, totalCount=${totalCount}`);
          return res.json({
            code: 0,
            message: 'ok',
            data: {
              finished: true,
              totalCount,
              currentIndex: targetIndex + 1 // 从1开始显示
            }
          });
        }
      } else {
        // 点击下一题：推进索引
        // currentIndex 表示当前显示的题目索引，推进到下一题
        practiceSession.currentIndex += 1;
        targetIndex = practiceSession.currentIndex;
        console.log(`[GET /next] ${mode}模式点击下一题，索引推进到 ${practiceSession.currentIndex}, totalCount=${totalCount}, questionData.length=${questionData.length}`);
        
        // 检查是否还有题目（在推进索引后检查）
        if (targetIndex >= questionData.length || targetIndex >= totalCount) {
          console.log(`[GET /next] ${mode}模式点击下一题，已到达最后一题，返回 finished=true: targetIndex=${targetIndex}, questionData.length=${questionData.length}, totalCount=${totalCount}`);
          return res.json({
            code: 0,
            message: 'ok',
            data: {
              finished: true,
              totalCount,
              currentIndex: targetIndex + 1 // 从1开始显示
            }
          });
        }
      }
      
      // 使用 targetIndex 获取题目，而不是 practiceSession.currentIndex
      // 这样首次调用时不会改变 currentIndex
      const currentQuestion = questionData[targetIndex];
      if (!currentQuestion) {
        console.error(`[GET /next] 题目不存在: targetIndex=${targetIndex}, questionData.length=${questionData.length}, totalCount=${totalCount}`);
        return res.status(404).json({
          code: 1,
          message: `题目不存在: targetIndex=${targetIndex}, 总题目数=${totalCount}`,
          data: null
        });
      }
      
      const questionId = currentQuestion.questionId;
      const itemId = currentQuestion.itemId;
      const learningItemId = currentQuestion.learningItemId;
      const isFavorited = currentQuestion.isFavorited || false;
      
      console.log(`[GET /next] 获取题目: questionId=${questionId}, itemId=${itemId}, learningItemId=${learningItemId}, 显示索引=${targetIndex + 1}, currentIndex=${practiceSession.currentIndex}`);
      
      // 获取题目详细信息，同时获取收藏状态和笔记
      const questionResult = await query(
        `SELECT 
          sq.*,
          ssi.note
        FROM study_question sq
        LEFT JOIN study_session_item ssi ON ssi.learning_item_id = $1 AND ssi.session_id = $2 AND ssi.deleted = false
        WHERE sq.id = $3 AND sq.status = 1
        LIMIT 1`,
        [learningItemId, sessionId, questionId]
      );
      
      if (questionResult.rows.length === 0) {
        console.error(`[GET /next] 题目不存在: questionId=${questionId}`);
        return res.status(404).json({
          code: 1,
          message: `题目不存在: questionId=${questionId}`,
          data: null
        });
      }
      
      const question = questionResult.rows[0];
      
      // 获取知识点
      const knowledgeNodesResult = await query(
        `SELECT kn.* FROM study_question_knowledge sqkn
         INNER JOIN study_knowledge_node kn ON sqkn.knowledge_node_id = kn.id
         WHERE sqkn.question_id = $1 AND sqkn.deleted = false AND kn.deleted = false
         ORDER BY kn.id ASC`,
        [questionId]
      );
      const knowledgeNodes = knowledgeNodesResult.rows;
      
      res.json({
        code: 0,
        message: 'ok',
        data: {
          itemId: itemId,
          learningItemId: learningItemId,
          question: {
            ...question,
            is_favorited: isFavorited,
            note: question.note || '',
            knowledge_nodes: knowledgeNodes
          },
          currentIndex: targetIndex + 1, // 从1开始显示
          totalCount,
          finished: false
        }
      });
      return; // 提前返回，避免执行后面的代码
    }
    
    // 如果全部完成，重置进度（异步）
    if (mode === "all" && practiceSession.currentIndex >= practiceSession.totalCount) {
      query(
        'UPDATE study_session SET progress_question_id = NULL WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
      ).catch(err => {
        console.error(`[GET /next] 重置进度失败:`, err);
      });
    }
    
    // 额外检查：如果索引无效，返回错误
    if (practiceSession.currentIndex < 0) {
      console.error(`[GET /next] 索引无效: currentIndex=${practiceSession.currentIndex}`);
      return res.status(500).json({
        code: 1,
        message: `索引无效: currentIndex=${practiceSession.currentIndex}`,
        data: null
      });
    }
    
    // 获取当前题目（索引已推进）
    const currentQuestion = questionData[practiceSession.currentIndex];
    if (!currentQuestion) {
      console.error(`[GET /next] 题目不存在: index=${practiceSession.currentIndex}, questionData.length=${questionData.length}, totalCount=${totalCount}`);
      return res.status(404).json({
        code: 1,
        message: `题目不存在: index=${practiceSession.currentIndex}, 总题目数=${totalCount}`,
        data: null
      });
    }
    
    const questionId = currentQuestion.questionId;
    const itemId = currentQuestion.itemId;
    const learningItemId = currentQuestion.learningItemId;
    const isFavorited = currentQuestion.isFavorited || false;
    
    console.log(`[GET /next] 获取题目: questionId=${questionId}, itemId=${itemId}, learningItemId=${learningItemId}, 显示索引=${practiceSession.currentIndex + 1}`);
    
    // 获取题目详细信息，同时获取收藏状态和笔记
    const questionResult = await query(
      `SELECT 
        sq.id,
        sq.exam_id,
        sq.stem,
        sq.options,
        sq.answer,
        sq.type,
        sq.explanation_raw,
        sq.explanation_human,
        sq.image_url,
        sq.status,
        COALESCE(sli.is_favorited, false) as is_favorited,
        COALESCE(ssi.note, '') as note
      FROM study_question sq
      LEFT JOIN study_learning_item sli ON sli.type = 'question' AND sli.ref_id = sq.id AND sli.deleted = false
      LEFT JOIN study_session_item ssi ON ssi.id = $2 AND ssi.session_id = $3 AND ssi.deleted = false
      WHERE sq.id = $1 AND sq.status = 1`,
      [questionId, itemId, sessionId]
    );
    
    if (questionResult.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '题目不存在',
        data: null
      });
    }
    
    const question = questionResult.rows[0];
    
    // 获取关联的知识点
    const knowledgeResult = await query(
      `SELECT 
        kn.id,
        kn.code,
        kn.title,
        kn.description,
        kn.importance,
        sqk.weight
      FROM study_question_knowledge sqk
      INNER JOIN study_knowledge_node kn ON sqk.knowledge_node_id = kn.id
      WHERE sqk.question_id = $1 AND sqk.deleted = false AND kn.deleted = false`,
      [questionId]
    );
    
    // 获取知识点的来源章节
    const knowledgeIds = knowledgeResult.rows.map(k => k.id);
    let sourcesMap = {};
    
    if (knowledgeIds.length > 0) {
      const sourcesResult = await query(
        `SELECT 
          kss.knowledge_node_id,
          ss.id as section_id,
          ss.chapter,
          ss.section,
          ss.page_start,
          ss.page_end,
          ss.anchor_text,
          s.id as source_id,
          s.type as source_type,
          s.title as source_title,
          s.version as source_version
        FROM study_knowledge_source_section kss
        INNER JOIN study_source_section ss ON kss.source_section_id = ss.id
        LEFT JOIN study_source s ON ss.source_id = s.id
        WHERE kss.knowledge_node_id = ANY($1::int[])
          AND kss.deleted = false
          AND ss.deleted = false
        ORDER BY kss.knowledge_node_id, ss.id`,
        [knowledgeIds]
      );
      
      sourcesResult.rows.forEach(row => {
        if (!sourcesMap[row.knowledge_node_id]) {
          sourcesMap[row.knowledge_node_id] = [];
        }
        sourcesMap[row.knowledge_node_id].push({
          section_id: row.section_id,
          chapter: row.chapter,
          section: row.section,
          page_start: row.page_start,
          page_end: row.page_end,
          anchor_text: row.anchor_text,
          source: row.source_id ? {
            id: row.source_id,
            type: row.source_type,
            title: row.source_title,
            version: row.source_version
          } : null
        });
      });
    }
    
    // 构建知识点列表
    const knowledgeNodes = knowledgeResult.rows.map(kn => ({
      id: kn.id,
      code: kn.code,
      title: kn.title,
      description: kn.description,
      importance: kn.importance,
      weight: kn.weight,
      sources: sourcesMap[kn.id] || []
    }));
    
    // 设置缓存控制头，禁用缓存，避免 304 响应
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': '', // 清除 ETag
    });

    res.json({
      code: 0,
      message: 'ok',
      data: {
        itemId: itemId,
        learningItemId: learningItemId,
        question: {
          ...question,
          is_favorited: isFavorited,
          note: question.note || '',
          knowledge_nodes: knowledgeNodes
        },
        currentIndex: practiceSession.currentIndex + 1, // 从1开始显示
        totalCount,
        finished: false
      }
    });
  } catch (error) {
    console.error('[ERROR] Get next question failed:', error);
    res.status(500).json({
      code: 1,
      message: '获取下一题失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 获取题目详情（包含解释、知识点等）
 * GET /api/c/study/questions/:id
 */
router.get('/questions/:id', authenticateToken, async (req, res) => {
  try {
    const questionId = parseInt(req.params.id);
    
    // 获取题目基本信息，同时获取收藏状态
    const questionResult = await query(
      `SELECT 
        sq.id,
        sq.exam_id,
        sq.stem,
        sq.options,
        sq.answer,
        sq.type,
        sq.explanation_raw,
        sq.explanation_human,
        sq.status,
        COALESCE(sli.is_favorited, false) as is_favorited
      FROM study_question sq
      LEFT JOIN study_learning_item sli ON sli.type = 'question' AND sli.ref_id = sq.id AND sli.deleted = false
      WHERE sq.id = $1 AND sq.status = 1`,
      [questionId]
    );
    
    if (questionResult.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '题目不存在',
        data: null
      });
    }
    
    const question = questionResult.rows[0];
    
    // 获取关联的知识点（参考admin端的实现）
    const knowledgeResult = await query(
      `SELECT 
        kn.id,
        kn.code,
        kn.title,
        kn.description,
        kn.importance,
        sqk.weight
      FROM study_question_knowledge sqk
      INNER JOIN study_knowledge_node kn ON sqk.knowledge_node_id = kn.id
      WHERE sqk.question_id = $1 AND sqk.deleted = false AND kn.deleted = false`,
      [questionId]
    );
    
    // 获取知识点的来源章节
    const knowledgeIds = knowledgeResult.rows.map(k => k.id);
    let sourcesMap = {};
    
    if (knowledgeIds.length > 0) {
      const sourcesResult = await query(
        `SELECT 
          kss.knowledge_node_id,
          ss.id as section_id,
          ss.chapter,
          ss.section,
          ss.page_start,
          ss.page_end,
          ss.anchor_text,
          s.id as source_id,
          s.type as source_type,
          s.title as source_title,
          s.version as source_version
        FROM study_knowledge_source_section kss
        INNER JOIN study_source_section ss ON kss.source_section_id = ss.id
        LEFT JOIN study_source s ON ss.source_id = s.id
        WHERE kss.knowledge_node_id = ANY($1::int[]) 
          AND kss.deleted = false 
          AND ss.deleted = false
        ORDER BY kss.knowledge_node_id, ss.id`,
        [knowledgeIds]
      );
      
      // 构建知识点到来源的映射
      sourcesResult.rows.forEach(row => {
        const knId = row.knowledge_node_id;
        if (!sourcesMap[knId]) {
          sourcesMap[knId] = [];
        }
        sourcesMap[knId].push({
          section_id: row.section_id,
          chapter: row.chapter,
          section: row.section,
          page_start: row.page_start,
          page_end: row.page_end,
          anchor_text: row.anchor_text,
          source: row.source_id ? {
            id: row.source_id,
            type: row.source_type,
            title: row.source_title,
            version: row.source_version
          } : null
        });
      });
    }
    
    // 构建知识点列表，包含来源信息
    const knowledgeNodes = knowledgeResult.rows.map(kn => ({
      id: kn.id,
      code: kn.code,
      title: kn.title,
      description: kn.description,
      importance: kn.importance,
      weight: kn.weight,
      sources: sourcesMap[kn.id] || []
    }));
    
    // 获取 learning_item_id 用于收藏功能
    const learningItemResult = await query(
      `SELECT id, is_favorited 
       FROM study_learning_item 
       WHERE type = 'question' AND ref_id = $1 AND deleted = false 
       LIMIT 1`,
      [questionId]
    );
    
    const learningItemId = learningItemResult.rows[0]?.id || null;
    const isFavorited = learningItemResult.rows[0]?.is_favorited || false;
    
    res.json({
      code: 0,
      message: 'ok',
      data: {
        ...question,
        is_favorited: isFavorited,
        learning_item_id: learningItemId,
        knowledge_nodes: knowledgeNodes
      }
    });
  } catch (error) {
    console.error('[ERROR] Get question detail failed:', error);
    res.status(500).json({
      code: 1,
      message: '获取题目详情失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 提交答案并更新学习记录明细
 * POST /api/c/study/sessions/:id/items/:itemId/submit
 */
router.post('/sessions/:id/items/:itemId/submit', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);
    const userId = req.userId;
    const { answer, timeSpent } = req.body; // answer: 用户选择的答案（如 "A" 或 ["A", "B"]），timeSpent: 耗时（秒）
    
    // 验证必填字段
    if (answer === undefined || answer === null) {
      return res.status(400).json({
        code: 1,
        message: '答案不能为空',
        data: null
      });
    }
    
    // 验证session是否属于当前用户
    const sessionCheck = await query(
      'SELECT id FROM study_session WHERE id = $1 AND user_id = $2 AND deleted = false',
      [sessionId, userId]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '学习记录不存在',
        data: null
      });
    }
    
    // 获取学习记录明细
    const itemResult = await query(
      `SELECT 
        ssi.id,
        ssi.learning_item_id,
        sli.type,
        sli.ref_id,
        sq.answer as correct_answer
      FROM study_session_item ssi
      INNER JOIN study_learning_item sli ON ssi.learning_item_id = sli.id
      LEFT JOIN study_question sq ON sli.type = 'question' AND sli.ref_id = sq.id
      WHERE ssi.id = $1 AND ssi.session_id = $2 
        AND ssi.deleted = false
        AND (sq.id IS NULL OR sq.status = 1)`,
      [itemId, sessionId]
    );
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '学习记录明细不存在',
        data: null
      });
    }
    
    const item = itemResult.rows[0];
    
    // 判断答案是否正确（使用统一的验证逻辑，与前端保持一致）
    let isCorrect = 0;
    if (item.correct_answer) {
      try {
        // 使用统一的验证函数进行比较（与前端逻辑完全一致）
        isCorrect = compareAnswers(answer, item.correct_answer) ? 1 : 0;
      } catch (e) {
        // 如果验证失败，记录错误并使用字符串比较（向后兼容）
        console.warn(`[Submit Answer] 答案验证失败，使用字符串比较: ${e.message}`);
        const correctAnswerStr = String(item.correct_answer).toUpperCase().trim();
        const userAnswerStr = String(answer).toUpperCase().trim();
        isCorrect = correctAnswerStr === userAnswerStr ? 1 : 0;
      }
    }
    
    // 格式化用户答案（确保是字符串格式）
    const formattedResponse = Array.isArray(answer) 
      ? JSON.stringify(answer) 
      : String(answer || '');
    
    // 确保 timeSpent 是有效的数字
    const timeSpentSeconds = parseInt(timeSpent) || 0;
    if (timeSpentSeconds < 0) {
      timeSpentSeconds = 0;
    }
    
    // 更新学习记录明细（填充所有字段，包括 updater）
    const updateResult = await query(
      `UPDATE study_session_item
       SET is_correct = $1,
           response = $2,
           time_spent_second = $3,
           updater = $4,
           update_time = CURRENT_TIMESTAMP
       WHERE id = $5 AND session_id = $6
       RETURNING *`,
      [
        isCorrect,
        formattedResponse,
        timeSpentSeconds,
        String(userId), // updater 字段：更新人（用户ID转字符串）
        itemId,
        sessionId
      ]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        code: 1,
        message: '更新学习记录明细失败',
        data: null
      });
    }
    
    // 解析正确答案，用于返回给前端（使用统一的解析逻辑）
    const correctAnswerArray = item.correct_answer ? parseAnswer(item.correct_answer) : [];
    
    // 返回更新后的完整数据
    const updatedItem = updateResult.rows[0];
    res.json({
      code: 0,
      message: 'ok',
      data: {
        id: updatedItem.id,
        session_id: updatedItem.session_id,
        learning_item_id: updatedItem.learning_item_id,
        is_correct: updatedItem.is_correct, // 是否正确（0或1）- 后端验证结果
        response: updatedItem.response, // 用户作答内容
        time_spent_second: updatedItem.time_spent_second, // 耗时（秒）
        correct_answers: correctAnswerArray, // 正确答案列表（用于UI显示，由后端解析）
        updater: updatedItem.updater, // 更新人
        create_time: updatedItem.create_time,
        update_time: updatedItem.update_time
      }
    });
  } catch (error) {
    console.error('[ERROR] Submit answer failed:', error);
    res.status(500).json({
      code: 1,
      message: '提交答案失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 获取考试详情
 * GET /api/c/study/exams/:examId
 */
router.get('/exams/:examId', authenticateToken, async (req, res) => {
  try {
    const examId = parseInt(req.params.examId);
    
    // 查询exam详情，包括题库中的可用题目数量
    const examResult = await query(
      `SELECT 
        se.id, 
        se.name, 
        se.exam_duration,
        COUNT(DISTINCT sq.id) as available_question_count
       FROM study_exam se
       LEFT JOIN study_question sq ON sq.exam_id = se.id AND sq.status = 1 AND sq.deleted = false
       WHERE se.id = $1 AND se.deleted = false
       GROUP BY se.id, se.name, se.exam_duration`,
      [examId]
    );
    
    if (examResult.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '考试不存在',
        data: null
      });
    }
    
    const exam = examResult.rows[0];
    
    res.json({
      code: 0,
      message: 'ok',
      data: {
        id: exam.id,
        name: exam.name,
        exam_duration: exam.exam_duration || 60,
        available_question_count: parseInt(exam.available_question_count) || 0
      }
    });
  } catch (error) {
    console.error('[ERROR] Get exam details failed:', error);
    res.status(500).json({
      code: 1,
      message: '获取考试详情失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 创建新的考试session并拉取题目
 * POST /api/c/study/exams/:examId/create-session
 * body: { question_count?: number, session_id?: number } - 考试题目数量，默认20；可选的session_id用于查询exam_id
 */
router.post('/exams/:examId/create-session', authenticateToken, async (req, res) => {
  try {
    const examId = parseInt(req.params.examId);
    const userId = req.userId;
    const { question_count, session_id } = req.body;
    
    console.log(`[INFO] Create exam session - examId: ${examId}, userId: ${userId}, session_id: ${session_id}, question_count from request: ${question_count}`);
    
    // 如果传递了session_id，先基于session_id查询session的参数（exam_duration, question_count）
    let sessionExamDuration = null;
    let sessionQuestionCount = null;
    
    if (session_id) {
      // 尝试查询session的参数（可能已经被物理删除，所以查询可能为空）
      const sessionCheck = await query(
        `SELECT exam_id, exam_duration, question_count FROM study_session 
         WHERE id = $1 AND user_id = $2 AND mode = 'exam'`,
        [session_id, userId]
      );
      
      if (sessionCheck.rows.length > 0) {
        const sessionData = sessionCheck.rows[0];
        const sessionExamId = sessionData.exam_id;
        
        if (sessionExamId !== examId) {
          console.log(`[WARN] Session的exam_id与请求的exam_id不匹配 - session_exam_id: ${sessionExamId}, request_exam_id: ${examId}`);
          return res.status(400).json({
            code: 1,
            message: 'Session的exam_id与请求的exam_id不匹配',
            data: null
          });
        }
        
        // 获取session的参数
        sessionExamDuration = sessionData.exam_duration;
        sessionQuestionCount = sessionData.question_count;
        console.log(`[INFO] Session参数 - exam_duration: ${sessionExamDuration}, question_count: ${sessionQuestionCount}`);
      } else {
        console.log(`[INFO] Session不存在或已被删除，将使用exam的默认参数 - session_id: ${session_id}, userId: ${userId}`);
      }
    }
    
    // 验证exam是否存在，并获取exam的参数
    const examCheck = await query(
      'SELECT id, name, exam_duration FROM study_exam WHERE id = $1 AND deleted = false',
      [examId]
    );
    
    if (examCheck.rows.length === 0) {
      console.log(`[WARN] 考试不存在 - examId: ${examId}`);
      return res.status(404).json({
        code: 1,
        message: '考试不存在',
        data: null
      });
    }
    
    const exam = examCheck.rows[0];
    
    // 优先使用session的参数（以session配置为主）
    // 如果session没有配置，则使用exam的参数，最后使用默认值
    const examDuration = sessionExamDuration !== null && sessionExamDuration !== undefined 
      ? sessionExamDuration 
      : (exam.exam_duration !== null && exam.exam_duration !== undefined 
          ? exam.exam_duration 
          : 60);
    
    console.log(`[INFO] 最终使用的exam_duration: ${examDuration} (session: ${sessionExamDuration}, exam: ${exam.exam_duration}, default: 60)`);
    
    // 优先使用session的question_count（以session配置为主）
    // 如果session没有，则使用请求中的question_count，如果还没有，则查询题库，最后使用默认值
    let finalQuestionCount = sessionQuestionCount;
    
    if (!finalQuestionCount) {
      // 如果session没有question_count，使用请求中的question_count
      finalQuestionCount = question_count;
      
      if (!finalQuestionCount) {
        // 如果请求中也没有，查询题库
        const availableQuestionsResult = await query(
          `SELECT COUNT(*) as count 
           FROM study_question 
           WHERE exam_id = $1 AND status = 1 AND deleted = false`,
          [examId]
        );
        const availableCount = parseInt(availableQuestionsResult.rows[0].count) || 0;
        // 如果题库中有题目，使用默认值20；如果题目数量少于20，使用实际数量
        finalQuestionCount = availableCount > 0 ? Math.min(20, availableCount) : 20;
        console.log(`[INFO] 从题库查询题目数量 - availableCount: ${availableCount}, finalQuestionCount: ${finalQuestionCount}`);
      } else {
        console.log(`[INFO] 使用请求中的question_count: ${finalQuestionCount}`);
      }
    } else {
      console.log(`[INFO] 使用session的question_count: ${finalQuestionCount}`);
    }
    
    // 确定使用哪个session：如果传递了session_id，使用它；否则查找或创建
    let targetSessionId = null;
    
    if (session_id) {
      // 检查session是否存在且属于当前用户和exam
      const existingSession = await query(
        `SELECT id FROM study_session 
         WHERE id = $1 AND user_id = $2 AND exam_id = $3 AND mode = 'exam'`,
        [session_id, userId, examId]
      );
      
      if (existingSession.rows.length > 0) {
        targetSessionId = session_id;
        console.log(`[INFO] 使用现有session: ${targetSessionId}`);
      }
    }
    
    // 如果session不存在，查找该用户该exam的考试session，如果也没有则创建新的
    if (!targetSessionId) {
      const existingSessions = await query(
        `SELECT id FROM study_session 
         WHERE exam_id = $1 AND user_id = $2 AND mode = 'exam' 
         ORDER BY create_time DESC 
         LIMIT 1`,
        [examId, userId]
      );
      
      if (existingSessions.rows.length > 0) {
        targetSessionId = existingSessions.rows[0].id;
        console.log(`[INFO] 找到现有session: ${targetSessionId}`);
      } else {
        // 再次验证：确保不会创建重复的session（防止并发问题）
        const duplicateCheck = await query(
          `SELECT id FROM study_session 
           WHERE exam_id = $1 AND user_id = $2 AND mode = 'exam' AND deleted = false
           LIMIT 1`,
          [examId, userId]
        );
        
        if (duplicateCheck.rows.length > 0) {
          targetSessionId = duplicateCheck.rows[0].id;
          console.log(`[INFO] 检测到并发创建的session，使用现有session: ${targetSessionId}`);
        } else {
          // 创建新的session（同一个用户，同一种类型下相同exam的session仅能创建一个）
          const newSessionResult = await query(
            `INSERT INTO study_session (user_id, exam_id, mode, exam_duration, question_count, score, creator, deleted, create_time, update_time)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             RETURNING id`,
            [userId, examId, 'exam', examDuration, finalQuestionCount, -1, String(userId), false]
          );
          targetSessionId = newSessionResult.rows[0].id;
          console.log(`[INFO] 创建新session: ${targetSessionId}`);
        }
      }
    }
    
    // 删除该session关联的所有item（不删除session本身）
    const deletedItems = await query(
      `DELETE FROM study_session_item 
       WHERE session_id = $1 
       RETURNING id`,
      [targetSessionId]
    );
    
    console.log(`[INFO] 已删除 ${deletedItems.rows.length} 个session关联的item，session保留: ${targetSessionId}`);
    
    // 更新session的参数（exam_duration, question_count）
    await query(
      `UPDATE study_session 
       SET exam_duration = $1, question_count = $2, score = -1, update_time = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [examDuration, finalQuestionCount, targetSessionId]
    );
    
    // 从study_question中拉取指定数量的题目（status=1，deleted=false，exam_id匹配）
    // 题目来自当前考试题库中所有题目中随机的数量题目
    const questionsResult = await query(
      `SELECT id 
       FROM study_question 
       WHERE exam_id = $1 AND status = 1 AND deleted = false 
       ORDER BY RANDOM() 
       LIMIT $2`,
      [examId, finalQuestionCount]
    );
    
    if (questionsResult.rows.length === 0) {
      return res.status(400).json({
        code: 1,
        message: '该考试中没有可用题目',
        data: null
      });
    }
    
    const questionIds = questionsResult.rows.map(row => row.id);
    
    const newSessionId = targetSessionId;
    
    // 为每个题目创建study_learning_item和study_session_item
    for (const questionId of questionIds) {
      // 创建或获取study_learning_item
      let learningItemResult = await query(
        `SELECT id FROM study_learning_item 
         WHERE type = 'question' AND ref_id = $1 AND deleted = false 
         LIMIT 1`,
        [questionId]
      );
      
      let learningItemId;
      if (learningItemResult.rows.length > 0) {
        learningItemId = learningItemResult.rows[0].id;
      } else {
        // 创建新的learning_item
        const newLearningItemResult = await query(
          `INSERT INTO study_learning_item (type, ref_id, creator, deleted, create_time, update_time)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING id`,
          ['question', questionId, String(userId), false]
        );
        learningItemId = newLearningItemResult.rows[0].id;
      }
      
      // 创建study_session_item
      await query(
        `INSERT INTO study_session_item (session_id, learning_item_id, is_correct, response, time_spent_second, creator, deleted, create_time, update_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [newSessionId, learningItemId, 0, '', 0, String(userId), false]
      );
    }
    
    res.json({
      code: 0,
      message: 'ok',
      data: {
        session_id: newSessionId,
        question_count: questionIds.length
      }
    });
  } catch (error) {
    console.error('[ERROR] Create exam session failed:', error);
    res.status(500).json({
      code: 1,
      message: '创建考试session失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 保存笔记（不推进索引）
 * PATCH /api/c/study/sessions/:id/items/:itemId/note
 * body: { note: string }
 */
router.patch('/sessions/:id/items/:itemId/note', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const itemId = parseInt(req.params.itemId);
    const userId = req.userId;
    const { note = '' } = req.body;
    
    // 验证session是否属于当前用户
    const sessionCheck = await query(
      'SELECT id FROM study_session WHERE id = $1 AND user_id = $2 AND deleted = false',
      [sessionId, userId]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '学习记录不存在',
        data: null
      });
    }
    
    // 更新笔记
    const updateResult = await query(
      `UPDATE study_session_item
       SET note = $1, update_time = CURRENT_TIMESTAMP
       WHERE id = $2 AND session_id = $3 AND deleted = false
       RETURNING id, note`,
      [note, itemId, sessionId]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '学习记录明细不存在',
        data: null
      });
    }
    
    res.json({
      code: 0,
      message: 'ok',
      data: {
        id: updateResult.rows[0].id,
        note: updateResult.rows[0].note
      }
    });
  } catch (error) {
    console.error('[ERROR] Save note failed:', error);
    res.status(500).json({
      code: 1,
      message: '保存笔记失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 重置练习进度（全部模式）
 * POST /api/c/study/sessions/:id/reset-progress
 * query: { mode: 'all' | 'wrong' | 'favorite' }
 */
router.post('/sessions/:id/reset-progress', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.userId;
    const mode = req.query.mode || 'all';
    
    // 验证session是否属于当前用户
    const sessionCheck = await query(
      'SELECT id FROM study_session WHERE id = $1 AND user_id = $2 AND deleted = false',
      [sessionId, userId]
    );
    
    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '学习记录不存在',
        data: null
      });
    }
    
    // 重置进度
    if (mode === 'all') {
      // 全部模式：重置进度题目ID
      await query(
        'UPDATE study_session SET progress_question_id = NULL WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
      );
    } else if (mode === 'exam') {
      // 考试模式：重置分数为-1（表示未完成），允许重新开始考试
      // 注意：exam_duration 是考试设置的时长，不需要重置
      // 注意：score 字段可能有 NOT NULL 约束，使用 -1 表示未完成，0-100 表示已完成
      await query(
        'UPDATE study_session SET score = -1 WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
      );
      
      // 重置所有题目的答案和正确性（清空答案，重置为未答题状态）
      // 注意：is_correct 字段可能有 NOT NULL 约束，使用 0 表示未答题/错误（重新开始时所有题目都视为未答题）
      await query(
        `UPDATE study_session_item 
         SET response = '', 
             is_correct = 0,
             update_time = CURRENT_TIMESTAMP
         WHERE session_id = $1 AND deleted = false`,
        [sessionId]
      );
    }
    
    // 清除内存中的会话状态（如果存在）
    const sessionKey = `${userId}_${sessionId}_${mode}`;
    practiceSessions.delete(sessionKey);
    
    console.log(`[POST /reset-progress] 进度已重置: sessionId=${sessionId}, userId=${userId}, mode=${mode}`);
    
    res.json({
      code: 0,
      message: 'ok',
      data: {
        sessionId: sessionId,
        reset: true
      }
    });
  } catch (error) {
    console.error('[ERROR] Reset progress failed:', error);
    res.status(500).json({
      code: 1,
      message: '重置进度失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 收藏/取消收藏题目
 * POST /api/c/study/learning-items/:id/favorite
 * body: { is_favorited: true/false }
 */
router.post('/learning-items/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const learningItemId = parseInt(req.params.id);
    const userId = req.userId;
    const { is_favorited } = req.body;
    
    if (typeof is_favorited !== 'boolean') {
      return res.status(400).json({
        code: 1,
        message: 'is_favorited 必须是布尔值',
        data: null
      });
    }
    
    // 验证 learning_item 是否存在且属于当前用户（通过关联的 session）
    const itemCheck = await query(
      `SELECT sli.id, sli.type, sli.ref_id
       FROM study_learning_item sli
       INNER JOIN study_session_item ssi ON ssi.learning_item_id = sli.id
       INNER JOIN study_session ss ON ssi.session_id = ss.id
       WHERE sli.id = $1 
         AND ss.user_id = $2 
         AND sli.deleted = false
         AND ssi.deleted = false
         AND ss.deleted = false
       LIMIT 1`,
      [learningItemId, userId]
    );
    
    if (itemCheck.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '学习项不存在或无权访问',
        data: null
      });
    }
    
    // 更新收藏状态
    const updateResult = await query(
      `UPDATE study_learning_item
       SET is_favorited = $1,
           updater = $2,
           update_time = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, is_favorited`,
      [is_favorited, String(userId), learningItemId]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        code: 1,
        message: '更新收藏状态失败',
        data: null
      });
    }
    
    res.json({
      code: 0,
      message: 'ok',
      data: {
        learning_item_id: updateResult.rows[0].id,
        is_favorited: updateResult.rows[0].is_favorited
      }
    });
  } catch (error) {
    console.error('[ERROR] Toggle favorite failed:', error);
    res.status(500).json({
      code: 1,
      message: '收藏操作失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 获取单个学习记录的详细信息
 * GET /api/c/study/sessions/:id
 */
router.get('/sessions/:id', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.userId;

    const result = await query(
      `SELECT 
        ss.id,
        ss.user_id,
        ss.exam_id,
        ss.mode,
        ss.exam_duration,
        ss.question_count,
        ss.score,
        ss.create_time,
        se.name as exam_name,
        COALESCE(ss.exam_duration, 60) as exam_duration_minutes
      FROM study_session ss
      LEFT JOIN study_exam se ON ss.exam_id = se.id
      WHERE ss.id = $1 AND ss.user_id = $2 AND ss.deleted = false`,
      [sessionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '学习记录不存在',
        data: null
      });
    }

    let session = result.rows[0];
    
    // 如果是考试模式，生成格式化的名称：exam_name[yyyyMMdd HH:mm:ss]
    if (session.mode === 'exam' && session.create_time) {
      const createTime = new Date(session.create_time);
      const year = createTime.getFullYear();
      const month = String(createTime.getMonth() + 1).padStart(2, '0');
      const day = String(createTime.getDate()).padStart(2, '0');
      const hours = String(createTime.getHours()).padStart(2, '0');
      const minutes = String(createTime.getMinutes()).padStart(2, '0');
      const seconds = String(createTime.getSeconds()).padStart(2, '0');
      const timestamp = `${year}${month}${day} ${hours}:${minutes}:${seconds}`;
      session.exam_name = `${session.exam_name || '考试'}[${timestamp}]`;
    }

    res.json({
      code: 0,
      message: 'ok',
      data: session
    });
  } catch (error) {
    console.error('[ERROR] Get session failed:', error);
    res.status(500).json({
      code: 1,
      message: '获取学习记录失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 提交考试并评分
 * POST /api/c/study/sessions/:id/submit-exam
 * body: { answers: { questionId: answer }, submit_time: ISO string }
 */
router.post('/sessions/:id/submit-exam', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.userId;
    const { answers, submit_time } = req.body;

    // 验证session是否属于当前用户，并检查是否已经提交过
    const sessionCheck = await query(
      'SELECT id, exam_id, score FROM study_session WHERE id = $1 AND user_id = $2 AND deleted = false',
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '学习记录不存在',
        data: null
      });
    }

    // 检查是否已经提交过（score 不为 null 且 >= 0 表示已提交）
    const existingScore = sessionCheck.rows[0].score;
    if (existingScore !== null && existingScore >= 0) {
      console.log(`[WARN] 考试 ${sessionId} 已经提交过，当前分数: ${existingScore}，跳过重复提交`);
      return res.status(400).json({
        code: 1,
        message: '该考试已经提交过，不能重复提交',
        data: {
          score: existingScore
        }
      });
    }

    // 获取所有题目和正确答案
    const questionsResult = await query(
      `SELECT 
        sq.id as question_id,
        sq.answer as correct_answer,
        ssi.id as item_id,
        ssi.learning_item_id
      FROM study_session_item ssi
      INNER JOIN study_learning_item sli ON ssi.learning_item_id = sli.id
      LEFT JOIN study_question sq ON sli.type = 'question' AND sli.ref_id = sq.id
      WHERE ssi.session_id = $1 
        AND ssi.deleted = false 
        AND sli.deleted = false
        AND sli.type = 'question'
        AND sq.id IS NOT NULL
        AND sq.status = 1
      ORDER BY ssi.id`,
      [sessionId]
    );

    const questions = questionsResult.rows;
    let correctCount = 0;
    let totalCount = questions.length;

    // 比对答案并更新数据库
    // 注意：未答题（userAnswer 为 null 或 undefined）应该被标记为错题（is_correct = 0）
    for (const question of questions) {
      const userAnswerRaw = answers[question.question_id];
      
      // 确保 userAnswer 永远不为 null 或 undefined
      // 如果 userAnswerRaw 为 null、undefined、空字符串或其他 falsy 值，都使用空字符串
      let userAnswer = '';
      if (userAnswerRaw !== null && userAnswerRaw !== undefined && userAnswerRaw !== '') {
        userAnswer = String(userAnswerRaw);
      }
      
      // 双重检查：确保 userAnswer 不是 null 或 undefined
      if (userAnswer === null || userAnswer === undefined) {
        console.warn(`[submit-exam] 警告：userAnswer 仍为 null/undefined，question_id=${question.question_id}, 强制设置为空字符串`);
        userAnswer = '';
      }
      
      const correctAnswer = question.correct_answer;
      
      // 解析正确答案（可能是 JSON 数组或字符串）
      let correctAnswers = [];
      try {
        const parsed = JSON.parse(correctAnswer);
        if (Array.isArray(parsed)) {
          correctAnswers = parsed.map(a => String(a).toUpperCase().trim());
        } else {
          correctAnswers = [String(parsed).toUpperCase().trim()];
        }
      } catch {
        correctAnswers = [String(correctAnswer).toUpperCase().trim()];
      }

      // 判断是否正确
      // 如果 userAnswer 为空字符串，说明未答题，应该标记为错题（is_correct = 0）
      const isCorrect = userAnswer && correctAnswers.includes(String(userAnswer).toUpperCase().trim()) ? 1 : 0;
      
      if (isCorrect) {
        correctCount++;
      }

      // 更新答案和正确性
      // 注意：未答题也会被更新，response 为空字符串，is_correct 为 0（错题）
      // 再次确保 userAnswer 不为 null
      const finalAnswer = userAnswer || '';
      await query(
        `UPDATE study_session_item
         SET response = $1,
             is_correct = $2,
             update_time = CURRENT_TIMESTAMP
         WHERE id = $3 AND session_id = $4`,
        [finalAnswer, isCorrect, question.item_id, sessionId]
      );
    }

    // 计算分数（百分比）
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    // 更新session的分数（exam_duration 是考试设置的时长，不需要修改）
    await query(
      `UPDATE study_session
       SET score = $1,
           update_time = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3`,
      [score, sessionId, userId]
    );

    // 奖励积分（根据分数）- 每次考试完成都奖励积分
    try {
      console.log(`[INFO] ========== 开始奖励积分 ==========`);
      console.log(`[INFO] userId: ${userId}, score: ${score}, sessionId: ${sessionId}`);
      console.log(`[INFO] score type: ${typeof score}, sessionId type: ${typeof sessionId}`);
      
      const pointsAwarded = await awardExamPoints(userId, score, sessionId);
      
      if (pointsAwarded && pointsAwarded > 0) {
        console.log(`[INFO] ✅ 积分奖励成功 - 奖励了 ${pointsAwarded} 积分`);
      } else if (pointsAwarded === null || pointsAwarded === 0) {
        console.log(`[WARN] ⚠️ 积分奖励返回 ${pointsAwarded}，可能已经奖励过或分数为0`);
      } else {
        console.log(`[WARN] ⚠️ 积分奖励返回异常值: ${pointsAwarded}`);
      }
      console.log(`[INFO] ========== 积分奖励流程结束 ==========`);
    } catch (pointsError) {
      console.error('[ERROR] ❌ Award points failed:', pointsError);
      console.error('[ERROR] Error message:', pointsError.message);
      console.error('[ERROR] Error stack:', pointsError.stack);
      // 积分奖励失败不影响考试提交，但记录错误
    }

    res.json({
      code: 0,
      message: 'ok',
      data: {
        score: score,
        correctCount: correctCount,
        totalCount: totalCount,
        correctRate: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
      }
    });
  } catch (error) {
    console.error('[ERROR] Submit exam failed:', error);
    res.status(500).json({
      code: 1,
      message: '提交考试失败: ' + error.message,
      data: null
    });
  }
});

module.exports = router;



