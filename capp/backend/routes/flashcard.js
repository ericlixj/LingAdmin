// routes/flashcard.js
const express = require('express');
const { query } = require('../utils/db');
const { authenticateToken } = require('../utils/jwt');

const router = express.Router();

/**
 * 获取今日 Flashcard 学习内容
 * POST /api/c/study/flashcard/get_today_items
 * query: { exam_id?: number, session_id?: number }
 * 
 * 前提3：学习入口永远不"生成数据"
 * - Flashcard 学习入口只做：SELECT * FROM flashcard_progress WHERE next_review_date <= now ORDER BY next_review_date
 * - 入口是纯读逻辑
 * 
 * 职责：只返回今天需要学习的内容（next_review_date <= today）
 * 
 * 注意：
 * - 此接口不创建新记录，新记录的创建由定时任务/API 负责（内容引入）
 * - 用户学习行为（记忆曲线调整）由 update_rating 接口负责
 */
router.post('/get_today_items', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { exam_id, session_id, test_date } = req.query; // 添加 test_date 参数用于测试
    
    if (!exam_id) {
      return res.status(400).json({
        code: 1,
        message: 'exam_id 参数不能为空',
        data: null
      });
    }
    
    // 获取查询日期（用于测试时可以传入 test_date，否则使用系统当前日期）
    let today;
    if (test_date) {
      // 如果提供了 test_date，使用该日期（格式：YYYY-MM-DD）
      today = new Date(test_date);
      if (isNaN(today.getTime())) {
        return res.status(400).json({
          code: 1,
          message: 'test_date 格式无效，请使用 YYYY-MM-DD 格式',
          data: null
        });
      }
    } else {
      // 否则使用系统当前日期
      today = new Date();
    }
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const examIdInt = parseInt(exam_id);
    
    console.log(`[Flashcard] 查询日期: ${todayStr}${test_date ? ' (测试模式)' : ''}, 用户ID: ${userId}, Exam ID: ${examIdInt}`);
    
    // 获取今日需要学习的内容
    // 只返回 next_review_date <= today 的 flashcard_progress 记录
    // 注意：此接口不创建新记录，新记录的创建由定时任务/API 负责
    const todayItemsQuery = `
      SELECT sfp.*
      FROM study_flashcard_progress sfp
      WHERE sfp.user_id = $1
        AND sfp.exam_id = $2
        AND sfp.deleted = false
        AND sfp.next_review_date <= $3::date
      ORDER BY sfp.next_review_date ASC, sfp.id ASC
    `;
    const todayItemsResult = await query(todayItemsQuery, [userId, examIdInt, todayStr]);
    console.log(`[Flashcard] 找到 ${todayItemsResult.rows.length} 个今日需要学习的内容 (next_review_date <= ${todayStr})`);
    const todayItems = todayItemsResult.rows;
    
    // 获取详细信息
    const resultItems = [];
    for (const progress of todayItems) {
      // 获取 session_item
      const sessionItemResult = await query(
        `SELECT ssi.learning_item_id
         FROM study_session_item ssi
         WHERE ssi.id = $1 AND ssi.deleted = false`,
        [progress.session_item_id]
      );
      
      if (sessionItemResult.rows.length === 0) continue;
      
      const learningItemId = sessionItemResult.rows[0].learning_item_id;
      
      // 获取 learning_item
      const learningItemResult = await query(
        `SELECT sli.type, sli.ref_id
         FROM study_learning_item sli
         WHERE sli.id = $1 AND sli.deleted = false`,
        [learningItemId]
      );
      
      if (learningItemResult.rows.length === 0) continue;
      
      const learningItem = learningItemResult.rows[0];
      const itemData = {
        progress_id: progress.id,
        session_item_id: progress.session_item_id,
        learning_item_id: learningItemId,
        type: learningItem.type,
        interval_days: progress.interval_days,
        next_review_date: progress.next_review_date,
        last_rating: progress.last_rating,
        state: progress.state,
        review_count: progress.review_count,
      };
      
      if (learningItem.type === 'knowledge') {
        // 知识点
        const knowledgeResult = await query(
          `SELECT id, title, description, code
           FROM study_knowledge_node
           WHERE id = $1 AND deleted = false`,
          [learningItem.ref_id]
        );
        
        if (knowledgeResult.rows.length > 0) {
          const knowledge = knowledgeResult.rows[0];
          itemData.content = {
            id: knowledge.id,
            title: knowledge.title,
            description: knowledge.description,
            code: knowledge.code,
          };
        }
      } else if (learningItem.type === 'question') {
        // 题目
        const questionResult = await query(
          `SELECT id, stem, options
           FROM study_question
           WHERE id = $1 AND status = 1 AND deleted = false`,
          [learningItem.ref_id]
        );
        
        if (questionResult.rows.length > 0) {
          const question = questionResult.rows[0];
          itemData.content = {
            id: question.id,
            stem: question.stem,
            options: question.options,
          };
        }
      }
      
      resultItems.push(itemData);
    }
    
    console.log(`[Flashcard] 今日学习集合: 总计 ${resultItems.length} 个 (next_review_date <= ${todayStr})`);
    console.log(`[Flashcard] 查询日期: ${todayStr}, 用户ID: ${userId}, Exam ID: ${examIdInt}`);
    
    res.json({
      code: 0,
      message: 'ok',
      data: {
        success: true,
        data: resultItems,
        total: resultItems.length,
        today_date: todayStr, // 返回查询使用的日期，用于调试
      }
    });
  } catch (error) {
    console.error('[ERROR] Get today flashcard items failed:', error);
    res.status(500).json({
      code: 1,
      message: '获取今日学习内容失败: ' + error.message,
      data: null
    });
  }
});

/**
 * 更新 Flashcard 评分
 * POST /api/c/study/flashcard/update_rating/:progress_id
 * body: { rating: "again" | "good" | "easy" }
 */
router.post('/update_rating/:progress_id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const progressId = parseInt(req.params.progress_id);
    const { rating } = req.body;
    
    if (!['again', 'good', 'easy'].includes(rating)) {
      return res.status(400).json({
        code: 1,
        message: 'rating 必须是 again、good 或 easy',
        data: null
      });
    }
    
    // 获取当前 progress
    const progressResult = await query(
      `SELECT * FROM study_flashcard_progress
       WHERE id = $1 AND user_id = $2 AND deleted = false`,
      [progressId, userId]
    );
    
    if (progressResult.rows.length === 0) {
      return res.status(404).json({
        code: 1,
        message: '学习进度不存在',
        data: null
      });
    }
    
    const progress = progressResult.rows[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let newIntervalDays;
    let newState;
    
    if (rating === 'again') {
      newIntervalDays = 1;
      newState = 'learning';
    } else if (rating === 'good') {
      newIntervalDays = progress.interval_days * 2;
      newState = newIntervalDays >= 7 ? 'review' : 'learning';
    } else { // easy
      newIntervalDays = progress.interval_days * 3;
      newState = newIntervalDays >= 7 ? 'review' : 'learning';
    }
    
    const nextReviewDate = new Date(today);
    nextReviewDate.setDate(nextReviewDate.getDate() + newIntervalDays);
    const nextReviewDateStr = nextReviewDate.toISOString().split('T')[0];
    
    // 更新 progress
    const updateResult = await query(
      `UPDATE study_flashcard_progress
       SET interval_days = $1,
           next_review_date = $2,
           last_rating = $3,
           last_reviewed_at = CURRENT_TIMESTAMP,
           state = $4,
           review_count = review_count + 1,
           updater = $5,
           update_time = CURRENT_TIMESTAMP
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [newIntervalDays, nextReviewDateStr, rating, newState, String(userId), progressId, userId]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({
        code: 1,
        message: '更新学习进度失败',
        data: null
      });
    }
    
    res.json({
      code: 0,
      message: 'ok',
      data: updateResult.rows[0]
    });
  } catch (error) {
    console.error('[ERROR] Update flashcard rating failed:', error);
    res.status(500).json({
      code: 1,
      message: '更新评分失败: ' + error.message,
      data: null
    });
  }
});

module.exports = router;
