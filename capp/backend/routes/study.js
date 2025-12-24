// routes/study.js
const express = require('express');
const { query } = require('../utils/db');
const { authenticateToken } = require('../utils/jwt');

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
 * 获取用户的学习记录列表
 * GET /api/c/study/sessions
 */
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId; // 从JWT中获取用户ID
    
    const result = await query(
      `SELECT 
        ss.id,
        ss.user_id,
        ss.exam_id,
        ss.mode,
        ss.start_time,
        ss.end_time,
        ss.score,
        ss.create_time,
        se.name as exam_name
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
        const totalResult = await query(
          `SELECT COUNT(*) as total_count
           FROM study_session_item ssi
           INNER JOIN study_learning_item sli ON ssi.learning_item_id = sli.id
           LEFT JOIN study_question sq ON sli.type = 'question' AND sli.ref_id = sq.id
           WHERE ssi.session_id = $1 
             AND ssi.deleted = false 
             AND sli.deleted = false
             AND sli.type = 'question'
             AND sq.id IS NOT NULL
             AND sq.status = 1`,
          [session.id]
        );
        
        // 获取错题数量
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
             AND ssi.is_correct = 0`,
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
        
        return {
          ...session,
          total_count: parseInt(totalResult.rows[0]?.total_count || 0),
          wrong_count: parseInt(wrongResult.rows[0]?.wrong_count || 0),
          favorite_count: parseInt(favoriteResult.rows[0]?.favorite_count || 0)
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
 * 开始练习：初始化练习会话，将所有题目加载到内存并打乱
 * POST /api/c/study/sessions/:id/start
 * body: { mode: "all" | "wrong" } - 练习模式：全部题目或仅错题
 */
router.post('/sessions/:id/start', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.userId;
    const { mode = "all" } = req.body; // 默认为"all"，可选"wrong"
    
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
      // 错题模式：只获取 is_correct = 0 的题目
      whereCondition += ` AND ssi.is_correct = 0`;
    } else if (mode === "favorite") {
      // 收藏模式：只获取 is_favorited = true 的题目
      whereCondition += ` AND sli.is_favorited = true`;
    }
    
    // 获取学习记录明细中的题目ID列表（包含 learning_item_id）
    // 对于"全部题库"模式，按question ID排序；对于"错题"和"收藏"模式，按ssi.id排序（后续会打乱）
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
    
    // 对于"全部题库"模式，按ID排序，读取进度
    if (mode === "all") {
      // 从数据库读取当前进度
      const progressResult = await query(
        'SELECT progress_question_id FROM study_session WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
      );
      
      const progressQuestionId = progressResult.rows[0]?.progress_question_id;
      
      if (progressQuestionId) {
        // 找到进度对应的题目索引
        const progressIndex = questionData.findIndex(q => q.questionId === progressQuestionId);
        if (progressIndex >= 0) {
          currentIndex = progressIndex;
        } else {
          // 如果进度题目不在列表中，从头开始
          currentIndex = 0;
        }
      }
    } else {
      // 对于"错题"和"收藏"模式，打乱题目顺序
      finalQuestionData = shuffleArray(questionData);
    }
    
    // 存储到内存中
    const sessionKey = `${userId}_${sessionId}_${mode}`;
    practiceSessions.set(sessionKey, {
      questionData: finalQuestionData,
      currentIndex: currentIndex,
      totalCount: finalQuestionData.length,
      mode: mode
    });
    
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
    const sessionKey = `${userId}_${sessionId}_${mode}`;
    
    // 从内存中获取练习会话
    const practiceSession = practiceSessions.get(sessionKey);
    if (!practiceSession) {
      return res.status(404).json({
        code: 1,
        message: '练习会话未初始化，请先调用开始练习接口',
        data: null
      });
    }
    
    const { questionData, currentIndex, totalCount } = practiceSession;
    
    // 检查是否还有题目
    if (currentIndex >= questionData.length) {
      return res.json({
        code: 0,
        message: 'ok',
        data: {
          finished: true,
          totalCount,
          currentIndex
        }
      });
    }
    
    // 获取当前题目
    const currentQuestion = questionData[currentIndex];
    const questionId = currentQuestion.questionId;
    const itemId = currentQuestion.itemId;
    const learningItemId = currentQuestion.learningItemId;
    const isFavorited = currentQuestion.isFavorited || false;
    
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
        currentIndex: currentIndex + 1, // 从1开始显示
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
 * 移动到下一题：更新当前索引，保存进度和笔记
 * POST /api/c/study/sessions/:id/next
 * body: { mode, itemId, note, isCorrect, response, timeSpent }
 */
router.post('/sessions/:id/next', authenticateToken, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = req.userId;
    const { mode = "all", itemId, note, isCorrect, response, timeSpent } = req.body;
    const sessionKey = `${userId}_${sessionId}_${mode}`;
    
    // 从内存中获取练习会话
    const practiceSession = practiceSessions.get(sessionKey);
    if (!practiceSession) {
      return res.status(404).json({
        code: 1,
        message: '练习会话未初始化',
        data: null
      });
    }
    
    // 保存笔记和答题结果（如果提供了）
    if (itemId) {
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      if (note !== undefined) {
        updateFields.push(`note = $${paramIndex++}`);
        updateValues.push(note || '');
      }
      if (isCorrect !== undefined) {
        updateFields.push(`is_correct = $${paramIndex++}`);
        updateValues.push(isCorrect ? 1 : 0);
      }
      if (response !== undefined) {
        updateFields.push(`response = $${paramIndex++}`);
        updateValues.push(response || '');
      }
      if (timeSpent !== undefined) {
        updateFields.push(`time_spent_second = $${paramIndex++}`);
        updateValues.push(timeSpent || 0);
      }
      
      if (updateFields.length > 0) {
        updateValues.push(itemId);
        await query(
          `UPDATE study_session_item 
           SET ${updateFields.join(', ')}, update_time = CURRENT_TIMESTAMP
           WHERE id = $${paramIndex} AND session_id = $${paramIndex + 1} AND deleted = false`,
          [...updateValues, sessionId]
        );
      }
    }
    
    // 更新索引
    practiceSession.currentIndex += 1;
    
    // 对于"全部题库"模式，保存进度到数据库
    if (mode === "all" && practiceSession.questionData && practiceSession.currentIndex < practiceSession.questionData.length) {
      const currentQuestion = practiceSession.questionData[practiceSession.currentIndex];
      if (currentQuestion && currentQuestion.questionId) {
        await query(
          'UPDATE study_session SET progress_question_id = $1 WHERE id = $2 AND user_id = $3',
          [currentQuestion.questionId, sessionId, userId]
        );
      }
    } else if (mode === "all" && practiceSession.currentIndex >= practiceSession.totalCount) {
      // 全部完成后，重置进度
      await query(
        'UPDATE study_session SET progress_question_id = NULL WHERE id = $1 AND user_id = $2',
        [sessionId, userId]
      );
    }
    
    const finished = practiceSession.currentIndex >= practiceSession.totalCount;
    
    res.json({
      code: 0,
      message: 'ok',
      data: {
        currentIndex: practiceSession.currentIndex,
        totalCount: practiceSession.totalCount,
        finished: finished
      }
    });
  } catch (error) {
    console.error('[ERROR] Move to next question failed:', error);
    res.status(500).json({
      code: 1,
      message: '移动到下一题失败: ' + error.message,
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
    
    // 判断答案是否正确
    let isCorrect = 0;
    if (item.correct_answer) {
      try {
        // 解析正确答案（可能是 "A" 或 ["A", "B"]）
        const correctAnswers = JSON.parse(item.correct_answer);
        const correctAnswerArray = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];
        
        // 用户答案也转换为数组
        const userAnswerArray = Array.isArray(answer) ? answer : [answer];
        
        // 比较答案（忽略大小写和顺序）
        const correctSet = new Set(correctAnswerArray.map(a => String(a).toUpperCase()));
        const userSet = new Set(userAnswerArray.map(a => String(a).toUpperCase()));
        
        isCorrect = correctSet.size === userSet.size && 
                   [...correctSet].every(a => userSet.has(a)) ? 1 : 0;
      } catch (e) {
        // 如果解析失败，直接比较字符串
        isCorrect = String(item.correct_answer).toUpperCase() === String(answer).toUpperCase() ? 1 : 0;
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
    
    // 返回更新后的完整数据
    const updatedItem = updateResult.rows[0];
    res.json({
      code: 0,
      message: 'ok',
      data: {
        id: updatedItem.id,
        session_id: updatedItem.session_id,
        learning_item_id: updatedItem.learning_item_id,
        is_correct: updatedItem.is_correct, // 是否正确（0或1）
        response: updatedItem.response, // 用户作答内容
        time_spent_second: updatedItem.time_spent_second, // 耗时（秒）
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

module.exports = router;
