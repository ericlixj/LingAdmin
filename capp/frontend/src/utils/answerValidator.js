/**
 * 答案验证工具函数
 * 前后端使用相同的验证逻辑，确保一致性
 */

/**
 * 解析答案字符串为数组格式
 * 支持多种格式：
 * 1. 对象格式: {"correct": ["A"]} 或 {"correct": ["A", "B"]}
 * 2. 数组格式: ["A"] 或 ["A", "B"]
 * 3. 字符串格式: "A"
 * 
 * @param {string} answerStr - 答案字符串（JSON格式或普通字符串）
 * @returns {string[]} 答案数组
 */
export function parseAnswer(answerStr) {
  if (!answerStr) return [];
  
  try {
    const parsed = JSON.parse(answerStr);
    
    // 如果是对象格式，提取 correct 字段
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      if (parsed.correct && Array.isArray(parsed.correct)) {
        return parsed.correct.map(item => String(item).toUpperCase().trim());
      }
      // 如果对象没有 correct 字段，尝试其他可能的字段
      if (parsed.answer && Array.isArray(parsed.answer)) {
        return parsed.answer.map(item => String(item).toUpperCase().trim());
      }
      // 如果 correct 不是数组，转换为数组
      if (parsed.correct) {
        return [String(parsed.correct).toUpperCase().trim()];
      }
      // 如果都不是，返回空数组
      return [];
    }
    
    // 如果是数组格式
    if (Array.isArray(parsed)) {
      return parsed.map(item => String(item).toUpperCase().trim());
    }
    
    // 如果是字符串或其他类型
    return [String(parsed).toUpperCase().trim()];
  } catch {
    // 不是 JSON，直接返回原字符串（如 "A"）
    return [String(answerStr).toUpperCase().trim()];
  }
}

/**
 * 将用户答案转换为数组格式
 * 支持单个值或数组
 * 
 * @param {string|string[]} userAnswer - 用户答案（单个值或数组）
 * @returns {string[]} 答案数组
 */
export function normalizeUserAnswer(userAnswer) {
  if (!userAnswer) return [];
  
  if (Array.isArray(userAnswer)) {
    return userAnswer.map(item => String(item).toUpperCase().trim());
  }
  
  return [String(userAnswer).toUpperCase().trim()];
}

/**
 * 比较用户答案和正确答案
 * 忽略大小写、顺序和前后空格
 * 
 * @param {string|string[]} userAnswer - 用户答案
 * @param {string|string[]} correctAnswer - 正确答案（可以是字符串或数组）
 * @returns {boolean} 是否正确
 */
export function compareAnswers(userAnswer, correctAnswer) {
  // 解析正确答案
  let correctAnswerArray = [];
  if (typeof correctAnswer === 'string') {
    correctAnswerArray = parseAnswer(correctAnswer);
  } else if (Array.isArray(correctAnswer)) {
    correctAnswerArray = correctAnswer.map(item => String(item).toUpperCase().trim());
  } else {
    correctAnswerArray = [String(correctAnswer).toUpperCase().trim()];
  }
  
  // 标准化用户答案
  const userAnswerArray = normalizeUserAnswer(userAnswer);
  
  // 如果正确答案为空，返回 false
  if (correctAnswerArray.length === 0) {
    return false;
  }
  
  // 使用 Set 进行比较，忽略顺序
  const correctSet = new Set(correctAnswerArray);
  const userSet = new Set(userAnswerArray);
  
  // 只有当两个集合大小相同且所有元素都匹配时，才认为答案正确
  return correctSet.size === userSet.size && 
         correctSet.size > 0 &&
         [...correctSet].every(a => userSet.has(a));
}

/**
 * 检查选项是否为正确答案
 * 
 * @param {string} optionLabel - 选项标签（如 "A", "B"）
 * @param {string|string[]} correctAnswer - 正确答案
 * @returns {boolean} 是否为正确答案
 */
export function isCorrectOption(optionLabel, correctAnswer) {
  const correctAnswerArray = typeof correctAnswer === 'string' 
    ? parseAnswer(correctAnswer)
    : (Array.isArray(correctAnswer) ? correctAnswer.map(item => String(item).toUpperCase().trim()) : []);
  
  const normalizedLabel = String(optionLabel).toUpperCase().trim();
  
  return correctAnswerArray.includes(normalizedLabel);
}
