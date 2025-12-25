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
        
        return {
          ...session,
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
 * body: { mode: "all" | "wrong" | "favorite" } - 练习模式：全部题目、仅错题或仅收藏
 * 注意：错题模式按顺序显示，每次进入从第一题开始；收藏模式会打乱顺序
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
    const sessionKey = `${userId}_${sessionId}_${mode}`;
    
    console.log(`[GET /next] 请求参数:`, {
      sessionId,
      userId,
      mode,
      sessionKey,
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
    
    console.log(`[GET /next] 当前索引: ${currentIndex} (内部索引，从0开始), 总题目数: ${totalCount}, 题目数据长度: ${questionData.length}, 是否首次调用: ${isFirstCall}`);
    
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
        practiceSession.isFirstCall = false;
        console.log(`[GET /next] 全部模式首次调用，返回索引 ${targetIndex} 的题目（currentIndex 保持为 ${currentIndex}，不推进）`);
      } else {
        // 点击下一题：保存当前题目进度，然后推进索引
        // 当前显示的题目索引是 currentIndex，保存这一题的进度
        if (currentIndex >= 0 && currentIndex < questionData.length) {
          const currentQuestion = questionData[currentIndex];
          if (currentQuestion && currentQuestion.questionId) {
            // 保存当前题目的ID作为进度（表示已完成到这一题）
            query(
              'UPDATE study_session SET progress_question_id = $1 WHERE id = $2 AND user_id = $3',
              [currentQuestion.questionId, sessionId, userId]
            ).catch(err => {
              console.error(`[GET /next] 保存进度失败:`, err);
            });
            console.log(`[GET /next] 保存进度: 已完成到索引 ${currentIndex}，题目ID=${currentQuestion.questionId}`);
          }
        }
        
        // 推进索引，返回下一题
        if (currentIndex < 0) {
          // 如果 currentIndex 还是 -1（不应该发生），推进到 0
          practiceSession.currentIndex = 0;
        } else {
          // 正常推进
          practiceSession.currentIndex += 1;
        }
        targetIndex = practiceSession.currentIndex;
        console.log(`[GET /next] 全部模式点击下一题，索引从 ${currentIndex} 推进到 ${practiceSession.currentIndex}`);
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
        // 第一次调用：返回第一题（索引0），不推进索引
        // currentIndex 保持为 -1，不改变
        targetIndex = 0;
        practiceSession.isFirstCall = false;
        console.log(`[GET /next] ${mode}模式首次调用，返回索引 0 的题目（第一题），currentIndex 保持为 ${currentIndex}（不推进）, totalCount=${totalCount}, questionData.length=${questionData.length}`);
        
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
        // currentIndex 从 -1 推进到 0，或从 0 推进到 1，等等
        if (currentIndex < 0) {
          // 如果 currentIndex 还是 -1（不应该发生，因为首次调用后应该已经显示过题目了），推进到 0
          practiceSession.currentIndex = 0;
        } else {
          // 正常推进
          practiceSession.currentIndex += 1;
        }
        targetIndex = practiceSession.currentIndex;
        console.log(`[GET /next] ${mode}模式点击下一题，索引从 ${currentIndex} 推进到 ${practiceSession.currentIndex}, totalCount=${totalCount}, questionData.length=${questionData.length}`);
        
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



