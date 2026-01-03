// ExamPage.jsx
// 考试模式页面：倒计时、题目乱序、前进后退、完成考试、中途退出
import { useState, useEffect, useRef, useCallback } from "react";
import { getProxyImageUrl } from "./utils/imageProxy";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// 解析选项 JSON
const DEFAULT_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const parseOptions = (optionsStr) => {
  if (!optionsStr) return [];
  try {
    const parsed = JSON.parse(optionsStr);
    if (typeof parsed === "object" && !Array.isArray(parsed) && parsed !== null) {
      return Object.entries(parsed).map(([key, value]) => ({
        label: key,
        value: String(value),
      }));
    }
    if (Array.isArray(parsed)) {
      return parsed.map((item, index) => {
        if (typeof item === "string") {
          return { label: DEFAULT_LABELS[index] || String(index + 1), value: item };
        }
        if (typeof item === "object" && item !== null) {
          return {
            label: item.label || DEFAULT_LABELS[index] || String(index + 1),
            value: item.value || item.text || "",
          };
        }
        return { label: DEFAULT_LABELS[index] || String(index + 1), value: String(item) };
      });
    }
    return [];
  } catch {
    return optionsStr.split("\n").filter(Boolean).map((text, index) => ({
      label: DEFAULT_LABELS[index] || String(index + 1),
      value: text,
    }));
  }
};

function ExamPage({ sessionId, lang, onBack }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 480;
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // 考试相关状态
  const [examDuration, setExamDuration] = useState(60); // 考试时长（分钟）
  const [timeRemaining, setTimeRemaining] = useState(0); // 剩余时间（秒）
  const [answers, setAnswers] = useState({}); // 保存所有题目的答案 { questionId: answer }
  const [submitted, setSubmitted] = useState(false); // 是否已提交
  const [questionIdMap, setQuestionIdMap] = useState({}); // 保存题目索引到题目ID的映射 { index: questionId }
  
  // 考试结果相关状态
  const [showResultModal, setShowResultModal] = useState(false);
  const [examResult, setExamResult] = useState(null); // { score, correctCount, totalCount, pointsEarned }
  const [pointsAnimation, setPointsAnimation] = useState(false);
  
  const timeIntervalRef = useRef(null);
  const submittingRef = useRef(false); // 提交锁，防止并发提交

  // 主题颜色配置
  const theme = {
    bg: isDarkMode ? "#1a1a1a" : "#f5f5f5",
    cardBg: isDarkMode ? "#2d2d2d" : "#ffffff",
    text: isDarkMode ? "#e0e0e0" : "#333333",
    textSecondary: isDarkMode ? "#b0b0b0" : "#666666",
    border: isDarkMode ? "#404040" : "#ddd",
    shadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
  };

  // 初始化考试
  useEffect(() => {
    let isMounted = true; // 防止组件卸载后继续执行
    
    // 重置提交锁和提交状态
    console.log('[DEBUG] 组件初始化 - 重置 submittingRef 和 submitted');
    submittingRef.current = false;
    setSubmitted(false);
    
    const init = async () => {
      if (isMounted) {
        await initializeExam();
      }
    };
    
    init();
    
    // 清理函数
    return () => {
      isMounted = false; // 标记组件已卸载
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
      // 清理时重置提交锁
      console.log('[DEBUG] 组件清理 - 重置 submittingRef');
      submittingRef.current = false;
    };
  }, [sessionId]);

  // 初始化考试
  const initializeExam = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      // 注意：现在每次开始考试都会创建新的session，不需要reset逻辑

      // 获取考试信息（包括开始和结束时间）
      const sessionResponse = await fetch(
        `${API_URL}/api/c/study/sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!sessionResponse.ok) {
        throw new Error("获取考试信息失败");
      }

      const sessionResult = await sessionResponse.json();
      if (sessionResult.code !== 0) {
        throw new Error(sessionResult.message || "获取考试信息失败");
      }

      const session = sessionResult.data;
      
      // 设置考试时长（分钟）
      const durationMinutes = session.exam_duration_minutes || session.exam_duration || 60;
      setExamDuration(durationMinutes);
      
      // 计算剩余时间（秒）
      const remainingSeconds = durationMinutes * 60;
      setTimeRemaining(remainingSeconds);
      
      // 启动倒计时
      startCountdown();

      // 开始考试（获取题目列表，题目会乱序）
      const startResponse = await fetch(
        `${API_URL}/api/c/study/sessions/${sessionId}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mode: "exam" }),
        }
      );

      if (!startResponse.ok) {
        throw new Error("开始考试失败");
      }

      const startResult = await startResponse.json();
      if (startResult.code !== 0) {
        throw new Error(startResult.message || "开始考试失败");
      }

      // 获取所有题目的ID列表（用于确认框显示未答题题目）
      // 通过循环调用/next API获取所有题目的ID，但不显示题目
      const allQuestionIds = {};
      const totalQuestions = startResult.data.totalCount;
      
      // 获取所有题目的ID（只获取ID，不显示）
      for (let i = 0; i < totalQuestions; i++) {
        try {
          const questionResponse = await fetch(
            `${API_URL}/api/c/study/sessions/${sessionId}/next?mode=exam&index=${i}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          if (questionResponse.ok) {
            const questionResult = await questionResponse.json();
            if (questionResult.code === 0 && questionResult.data.question) {
              allQuestionIds[i] = questionResult.data.question.id;
            }
          }
        } catch (err) {
          console.warn(`获取题目 ${i} 的ID失败:`, err);
        }
      }
      
      // 保存所有题目的ID映射
      setQuestionIdMap(allQuestionIds);

      // 获取第一题（考试模式从索引0开始）
      await fetchQuestion(0);

      // 设置页面离开警告（在组件卸载时处理自动提交）

    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // 启动倒计时
  const startCountdown = () => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }

    timeIntervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // 时间到，自动提交（只提交一次）
          // 先清除倒计时器，防止重复触发
          if (timeIntervalRef.current) {
            clearInterval(timeIntervalRef.current);
            timeIntervalRef.current = null;
          }
          // 延迟调用，确保状态更新完成，并且只调用一次
          setTimeout(() => {
            if (!submittingRef.current && !submitted) {
              handleSubmitExam(true); // true 表示时间到自动提交
            }
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 格式化时间显示
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 获取题目
  const fetchQuestion = async (index) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `${API_URL}/api/c/study/sessions/${sessionId}/next?mode=exam&index=${index}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("获取题目失败");
      }

      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.message || "获取题目失败");
      }

      if (result.data.finished) {
        // 所有题目都已显示完
        return;
      }

      setCurrentQuestion(result.data.question);
      // 注意：result.data.currentIndex 是从1开始的，需要转换为从0开始的索引
      const questionIndex = result.data.currentIndex - 1;
      setCurrentIndex(questionIndex);
      setTotalCount(result.data.totalCount);
      
      // 保存题目索引到题目ID的映射
      if (result.data.question && result.data.question.id) {
        setQuestionIdMap((prev) => ({
          ...prev,
          [questionIndex]: result.data.question.id,
        }));
      }
      
      // 恢复已保存的答案
      if (answers[result.data.question.id]) {
        setSelectedAnswer(answers[result.data.question.id]);
      } else {
        setSelectedAnswer(null);
      }
    } catch (err) {
      setError(String(err));
    }
  };

  // 保存答案
  // 注意：即使 selectedAnswer 为 null，也要保存（表示未答题）
  const saveAnswer = useCallback(() => {
    if (currentQuestion) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: selectedAnswer !== null && selectedAnswer !== undefined ? selectedAnswer : null,
      }));
    }
  }, [currentQuestion, selectedAnswer]);

  // 切换到上一题
  const handlePrev = () => {
    if (currentIndex > 0) {
      saveAnswer();
      fetchQuestion(currentIndex - 1);
    }
  };

  // 切换到下一题
  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      // 检查是否已选择答案
      if (selectedAnswer === null || selectedAnswer === undefined || selectedAnswer === '') {
        // 提示用户选择答案
        const message = lang === "cn" 
          ? "请先选择答案后再进入下一题"
          : lang === "en"
          ? "Please select an answer before proceeding to the next question"
          : "請先選擇答案後再進入下一題";
        alert(message);
        return;
      }
      
      // 已选择答案，保存并进入下一题
      saveAnswer();
      fetchQuestion(currentIndex + 1);
    }
  };

  // 提交考试
  const handleSubmitExam = async (autoSubmit = false) => {
    // 防止重复提交：使用 ref 锁，因为状态更新是异步的
    if (submittingRef.current || submitted) {
      console.log('[DEBUG] 考试正在提交或已提交，跳过重复提交');
      return;
    }

    // 如果不是自动提交，先检查当前题目是否已选择答案
    if (!autoSubmit) {
      // 检查当前题目是否已选择答案
      if (selectedAnswer === null || selectedAnswer === undefined || selectedAnswer === '') {
        // 提示用户选择答案
        const message = lang === "cn" 
          ? "请先选择答案后再提交试卷"
          : lang === "en"
          ? "Please select an answer before submitting the exam"
          : "請先選擇答案後再提交試卷";
        alert(message);
        return;
      }
    }

    // 保存当前题目的答案
    saveAnswer();

    // 如果不是自动提交，需要确认
    if (!autoSubmit) {
      // 统计已提交答案的题目数量和未提交答案的题目
      const answeredCount = Object.keys(answers).filter(
        (questionId) => answers[questionId] !== null && answers[questionId] !== undefined
      ).length;
      
      // 找出未提交答案的题目索引
      const unansweredIndices = [];
      for (let i = 0; i < totalCount; i++) {
        const questionId = questionIdMap[i];
        if (!questionId) {
          // 如果这个索引还没有加载过题目，也算作未答题
          unansweredIndices.push(i + 1); // 显示时从1开始
        } else {
          // 检查答案是否存在且不为null/undefined
          const answer = answers[questionId];
          if (answer === null || answer === undefined || answer === '') {
            unansweredIndices.push(i + 1); // 显示时从1开始
          }
        }
      }
      
      // 构建确认消息
      let confirmMessage = "";
      if (lang === "cn") {
        confirmMessage = `确定要提交试卷吗？\n\n`;
        confirmMessage += `考试题目总数：${totalCount}\n`;
        confirmMessage += `已提交答案题目数量：${answeredCount}\n`;
        confirmMessage += `未提交答案题目数量：${unansweredIndices.length}\n`;
        if (unansweredIndices.length > 0) {
          confirmMessage += `\n未提交答案的题目：\n`;
          // 如果未答题数量太多，只显示前20个
          const displayIndices = unansweredIndices.slice(0, 20);
          confirmMessage += displayIndices.join("、");
          if (unansweredIndices.length > 20) {
            confirmMessage += ` 等${unansweredIndices.length}题`;
          }
        }
        confirmMessage += `\n\n提交后将无法修改答案。`;
      } else if (lang === "en") {
        confirmMessage = `Are you sure you want to submit the exam?\n\n`;
        confirmMessage += `Total questions: ${totalCount}\n`;
        confirmMessage += `Answered questions: ${answeredCount}\n`;
        confirmMessage += `Unanswered questions: ${unansweredIndices.length}\n`;
        if (unansweredIndices.length > 0) {
          confirmMessage += `\nUnanswered question numbers:\n`;
          const displayIndices = unansweredIndices.slice(0, 20);
          confirmMessage += displayIndices.join(", ");
          if (unansweredIndices.length > 20) {
            confirmMessage += ` and ${unansweredIndices.length - 20} more`;
          }
        }
        confirmMessage += `\n\nYou cannot modify answers after submission.`;
      } else {
        confirmMessage = `確定要提交試卷嗎？\n\n`;
        confirmMessage += `考試題目總數：${totalCount}\n`;
        confirmMessage += `已提交答案題目數量：${answeredCount}\n`;
        confirmMessage += `未提交答案題目數量：${unansweredIndices.length}\n`;
        if (unansweredIndices.length > 0) {
          confirmMessage += `\n未提交答案的題目：\n`;
          const displayIndices = unansweredIndices.slice(0, 20);
          confirmMessage += displayIndices.join("、");
          if (unansweredIndices.length > 20) {
            confirmMessage += ` 等${unansweredIndices.length}題`;
          }
        }
        confirmMessage += `\n\n提交後將無法修改答案。`;
      }
      
      if (!confirm(confirmMessage)) {
        // 用户取消，不设置锁，直接返回
        return;
      }
    }
    
    // 用户确认后，立即设置提交锁，防止并发提交
    submittingRef.current = true;
    
    // 设置 submitted 状态（在确认后）
    setSubmitted(true);

    try {
      setLoading(true);
      
      const token = localStorage.getItem("access_token");
      
      // 停止倒计时
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }

      // 提交答案并评分
      const submitResponse = await fetch(
        `${API_URL}/api/c/study/sessions/${sessionId}/submit-exam`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: answers,
            submit_time: new Date().toISOString(),
          }),
        }
      );

      if (!submitResponse.ok) {
        throw new Error("提交考试失败");
      }

      const result = await submitResponse.json();
      if (result.code !== 0) {
        throw new Error(result.message || "提交考试失败");
      }

      // 显示分数
      // score 是百分比（0-100），correctCount 是正确题目数量
      const correctCount = result.data.correctCount || 0;
      const totalCount = result.data.totalCount || 0;
      const score = result.data.score || 0; // 百分比分数
      
      // 获取用户积分信息（查看是否获得了积分）
      // 等待一小段时间确保积分已经奖励完成
      let pointsEarned = 0;
      try {
        // 等待1秒确保后端积分奖励完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`[DEBUG] 查询积分 - sessionId: ${sessionId}`);
        
        // 获取最新的交易记录，找到这次考试的积分奖励
        const transactionsResponse = await fetch(
          `${API_URL}/api/c/points/transactions?page=1&pageSize=20`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (transactionsResponse.ok) {
          const transactionsResult = await transactionsResponse.json();
          console.log(`[DEBUG] 交易记录查询结果:`, transactionsResult);
          
          if (transactionsResult.code === 0 && transactionsResult.data.transactions.length > 0) {
            console.log(`[DEBUG] 找到 ${transactionsResult.data.transactions.length} 条交易记录`);
            
            // 查找这次考试的积分奖励（最新的exam类型交易）
            // 确保sessionId类型匹配
            const sessionIdNum = parseInt(sessionId);
            console.log(`[DEBUG] 查找积分 - sessionId: ${sessionId}, sessionIdNum: ${sessionIdNum}`);
            console.log(`[DEBUG] 所有交易记录:`, transactionsResult.data.transactions.map(tx => ({
              id: tx.id,
              source_type: tx.source_type,
              source_id: tx.source_id,
              source_id_type: typeof tx.source_id,
              transaction_type: tx.transaction_type,
              amount: tx.amount,
              create_time: tx.create_time
            })));
            
            const examTransaction = transactionsResult.data.transactions.find(
              (tx) => {
                const txSourceId = parseInt(tx.source_id) || tx.source_id;
                const match = tx.source_type === 'exam' &&
                  txSourceId === sessionIdNum &&
                  tx.transaction_type === 'earn';
                if (match) {
                  console.log(`[DEBUG] 找到匹配的交易:`, tx);
                }
                return match;
              }
            );
            
            console.log(`[DEBUG] 查找结果 - sessionId: ${sessionId}, 找到交易:`, examTransaction);
            
            if (examTransaction) {
              pointsEarned = parseFloat(examTransaction.amount || 0);
              console.log(`[DEBUG] 找到积分奖励: ${pointsEarned} 积分`);
            } else {
              // 如果没有找到精确匹配，尝试查找最近的exam交易
              const recentExamTransaction = transactionsResult.data.transactions.find(
                (tx) => tx.source_type === 'exam' && tx.transaction_type === 'earn'
              );
              if (recentExamTransaction) {
                console.log(`[DEBUG] 找到最近的exam交易（可能sessionId不匹配）:`, recentExamTransaction);
                // 如果时间很近（5秒内），也认为是这次考试的积分
                const transactionTime = new Date(recentExamTransaction.create_time).getTime();
                const now = Date.now();
                if (now - transactionTime < 5000) {
                  pointsEarned = parseFloat(recentExamTransaction.amount || 0);
                  console.log(`[DEBUG] 使用最近的exam交易作为积分: ${pointsEarned}`);
                }
              }
            }
          } else {
            console.log(`[DEBUG] 没有找到交易记录`);
          }
        } else {
          console.error(`[ERROR] 获取交易记录失败: ${transactionsResponse.status}`);
        }
      } catch (pointsError) {
        console.error('获取积分信息失败:', pointsError);
      }
      
      console.log(`[DEBUG] 最终获得的积分: ${pointsEarned}`);
      
      // 显示结果弹窗
      setExamResult({
        score,
        correctCount,
        totalCount,
        pointsEarned
      });
      setShowResultModal(true);
      
      // 触发积分动画
      setTimeout(() => {
        setPointsAnimation(true);
      }, 500);
    } catch (err) {
      setError(String(err));
      setSubmitted(false);
      submittingRef.current = false; // 提交失败，重置锁
    } finally {
      setLoading(false);
    }
  };

  // 使用 ref 保存最新的状态，避免在 beforeunload 时使用过时的闭包值
  const answersRef = useRef(answers);
  const currentQuestionRef = useRef(currentQuestion);
  const selectedAnswerRef = useRef(selectedAnswer);
  
  // 更新 ref 值
  useEffect(() => {
    answersRef.current = answers;
    currentQuestionRef.current = currentQuestion;
    selectedAnswerRef.current = selectedAnswer;
  }, [answers, currentQuestion, selectedAnswer]);

  // 处理页面离开警告（不自动提交，只在用户点击完成考试时提交）
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!submitted && currentQuestionRef.current) {
        // 只显示警告消息，不自动提交
        // 提交答案统一在用户点击"完成考试"按钮时进行
        e.preventDefault();
        e.returnValue = lang === "cn" 
          ? "考试进行中，离开页面将丢失当前进度，请先完成考试" 
          : "Exam in progress. Leaving will lose your progress. Please complete the exam first.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [submitted, lang]);

  // 调试：监控完成考试按钮的状态（必须在所有条件返回之前）
  const isLastQuestion = currentIndex >= totalCount - 1;
  useEffect(() => {
    if (isLastQuestion) {
      // 如果 submittingRef 被错误地设置为 true，但 submitted 是 false，则重置它
      if (submittingRef.current && !submitted) {
        console.log('[DEBUG] 检测到 submittingRef 异常为 true，重置为 false');
        submittingRef.current = false;
      }
      const isDisabled = submitted || submittingRef.current || !selectedAnswer;
      console.log('[DEBUG] 完成考试按钮状态更新:', {
        isLastQuestion: true,
        submitted,
        submittingRef: submittingRef.current,
        selectedAnswer,
        isDisabled,
        timestamp: new Date().toISOString()
      });
    }
  }, [isLastQuestion, submitted, selectedAnswer]);

  // 调试：打印图片URL信息 - 必须在所有早期返回之前
  useEffect(() => {
    if (currentQuestion?.image_url) {
      console.log('[ExamPage] 原始图片URL:', currentQuestion.image_url);
      console.log('[ExamPage] 代理后URL:', getProxyImageUrl(currentQuestion.image_url));
    }
  }, [currentQuestion?.image_url]);

  if (loading && !currentQuestion) {
    return (
      <div style={{
        textAlign: "center",
        padding: isMobile ? "2rem 1rem" : "2rem",
        backgroundColor: theme.bg,
        color: theme.text,
        minHeight: "100vh",
      }}>
        <p>{lang === "cn" ? "加载中..." : lang === "en" ? "Loading..." : "載入中..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: isMobile ? "1rem" : "1.5rem",
        backgroundColor: theme.bg,
        color: theme.text,
        minHeight: "100vh",
      }}>
        <div style={{
          padding: "1rem",
          backgroundColor: isDarkMode ? "#3a1a1a" : "#fee",
          border: `1px solid ${isDarkMode ? "#ff6b6b" : "#fcc"}`,
          borderRadius: "8px",
          marginBottom: "1rem",
          color: isDarkMode ? "#ff6b6b" : "#c00",
        }}>
          错误: {error}
        </div>
        <button
          onClick={onBack}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#1890ff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          {lang === "cn" ? "返回" : lang === "en" ? "Back" : "返回"}
        </button>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const options = parseOptions(currentQuestion.options);

  return (
    <div style={{
      backgroundColor: theme.bg,
      minHeight: "100vh",
      padding: isMobile ? "1rem 0.75rem" : "1.5rem",
      color: theme.text,
    }}>
      {/* 顶部：倒计时和题目进度 */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
        padding: "1rem",
        backgroundColor: theme.cardBg,
        borderRadius: "12px",
        boxShadow: theme.shadow,
        flexWrap: "wrap",
        gap: "0.5rem",
      }}>
        <div style={{
          fontSize: isMobile ? "1rem" : "1.2rem",
          fontWeight: "600",
          color: timeRemaining < 300 ? "#ff4d4f" : theme.text, // 剩余时间少于5分钟时显示红色
        }}>
          {lang === "cn" ? "剩余时间:" : lang === "en" ? "Time Remaining:" : "剩餘時間:"} {formatTime(timeRemaining)}
        </div>
        <div style={{
          fontSize: isMobile ? "0.9rem" : "1rem",
          color: theme.textSecondary,
        }}>
          {currentIndex + 1} / {totalCount}
        </div>
      </div>

      {/* 题目卡片 */}
      <div style={{
        backgroundColor: theme.cardBg,
        borderRadius: "12px",
        padding: isMobile ? "1rem" : "1.5rem",
        boxShadow: theme.shadow,
        marginBottom: "1rem",
      }}>
        <h3 style={{
          marginTop: 0,
          marginBottom: "1rem",
          fontSize: isMobile ? "1.1rem" : "1.25rem",
          fontWeight: "600",
          color: theme.text,
        }}>
          {currentQuestion.stem}
        </h3>

        {currentQuestion.image_url && (
          <img
            src={getProxyImageUrl(currentQuestion.image_url)}
            alt="Question"
            style={{
              maxWidth: "100%",
              height: "auto",
              marginBottom: "1rem",
              borderRadius: "8px",
            }}
            onLoad={() => {
              console.log('[ExamPage] 图片加载成功:', currentQuestion.image_url);
            }}
            onError={(e) => {
              console.error('[ExamPage] 图片加载失败:', {
                src: e.target.src,
                originalUrl: currentQuestion.image_url,
                error: '图片加载失败'
              });
              // 如果代理失败，尝试使用原始URL
              if (e.target.src.includes("/api/v1/imageProxy/proxy")) {
                console.log('[ExamPage] 尝试使用原始URL:', currentQuestion.image_url);
                e.target.src = currentQuestion.image_url;
              } else {
                console.log('[ExamPage] 隐藏图片');
                e.target.style.display = "none";
              }
            }}
          />
        )}

        <div style={{ marginBottom: "1rem" }}>
          {options.map((option, index) => (
            <label
              key={index}
              style={{
                display: "block",
                padding: "0.75rem",
                marginBottom: "0.5rem",
                backgroundColor: selectedAnswer === option.label
                  ? (isDarkMode ? "#1890ff33" : "#e6f7ff")
                  : "transparent",
                border: `2px solid ${
                  selectedAnswer === option.label
                    ? "#1890ff"
                    : theme.border
                }`,
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={() => {
                console.log('[DEBUG] 选择答案:', option.label, '当前题目索引:', currentIndex, '是否最后一题:', currentIndex >= totalCount - 1);
                // 如果 submittingRef 被错误地设置为 true，但 submitted 是 false，则重置它
                if (submittingRef.current && !submitted) {
                  console.log('[DEBUG] 检测到 submittingRef 异常为 true，重置为 false');
                  submittingRef.current = false;
                }
                setSelectedAnswer(option.label);
                saveAnswer();
              }}
            >
              <input
                type="radio"
                name="answer"
                value={option.label}
                checked={selectedAnswer === option.label}
                onChange={() => {
                  // 如果 submittingRef 被错误地设置为 true，但 submitted 是 false，则重置它
                  if (submittingRef.current && !submitted) {
                    console.log('[DEBUG] 检测到 submittingRef 异常为 true，重置为 false');
                    submittingRef.current = false;
                  }
                  setSelectedAnswer(option.label);
                  saveAnswer();
                }}
                style={{ marginRight: "0.5rem" }}
              />
              <strong>{option.label}.</strong> {option.value}
            </label>
          ))}
        </div>
      </div>

      {/* 底部按钮 */}
      <div style={{
        display: "flex",
        gap: "0.75rem",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}>
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0 || submitted}
          style={{
            flex: 1,
            minWidth: "100px",
            padding: "0.75rem",
            backgroundColor: currentIndex === 0 || submitted ? "#d9d9d9" : "#52c41a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: currentIndex === 0 || submitted ? "not-allowed" : "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            opacity: currentIndex === 0 || submitted ? 0.6 : 1,
          }}
        >
          {lang === "cn" ? "上一题" : lang === "en" ? "Previous" : "上一題"}
        </button>

        {isLastQuestion ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[DEBUG] 完成考试按钮被点击:', {
                submitted,
                submittingRef: submittingRef.current,
                selectedAnswer,
                timestamp: new Date().toISOString()
              });
              if (!submitted && !submittingRef.current && selectedAnswer) {
                console.log('[DEBUG] 条件满足，开始提交考试');
                handleSubmitExam(false);
              } else {
                console.log('[DEBUG] 完成考试按钮被阻止 - submitted:', submitted, 'submittingRef.current:', submittingRef.current, 'selectedAnswer:', selectedAnswer);
              }
            }}
            disabled={submitted || submittingRef.current || !selectedAnswer}
            title={`调试信息: submitted=${submitted}, submittingRef=${submittingRef.current}, selectedAnswer=${selectedAnswer}`}
            style={{
              flex: 2,
              minWidth: "150px",
              padding: "0.75rem",
              backgroundColor: (submitted || submittingRef.current || !selectedAnswer) ? "#d9d9d9" : "#ff4d4f",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: (submitted || submittingRef.current || !selectedAnswer) ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              opacity: (submitted || submittingRef.current || !selectedAnswer) ? 0.6 : 1,
            }}
          >
            {lang === "cn" ? "完成考试" : lang === "en" ? "Submit Exam" : "完成考試"}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={submitted}
            style={{
              flex: 1,
              minWidth: "100px",
              padding: "0.75rem",
              backgroundColor: submitted ? "#d9d9d9" : "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: submitted ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              opacity: submitted ? 0.6 : 1,
            }}
          >
            {lang === "cn" ? "下一题" : lang === "en" ? "Next" : "下一題"}
          </button>
        )}
      </div>

      {/* 考试结果弹窗 */}
      {showResultModal && examResult && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            animation: "fadeIn 0.3s ease-in",
          }}
          onClick={() => {
            setShowResultModal(false);
            onBack();
          }}
        >
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: "20px",
              padding: isMobile ? "2rem 1.5rem" : "3rem",
              maxWidth: isMobile ? "90%" : "500px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
              animation: "slideUp 0.5s ease-out",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => {
                setShowResultModal(false);
                onBack();
              }}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: theme.textSecondary,
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = theme.bg;
                e.target.style.color = theme.text;
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.color = theme.textSecondary;
              }}
            >
              ×
            </button>

            {/* 成功图标 */}
            <div
              style={{
                fontSize: "4rem",
                marginBottom: "1rem",
                animation: "bounceIn 0.6s ease-out",
              }}
            >
              🎉
            </div>

            {/* 标题 */}
            <h2
              style={{
                fontSize: isMobile ? "1.5rem" : "2rem",
                fontWeight: "bold",
                marginBottom: "1.5rem",
                color: theme.text,
                animation: "fadeInUp 0.6s ease-out 0.2s both",
              }}
            >
              {lang === "cn"
                ? "考试完成！"
                : lang === "en"
                ? "Exam Completed!"
                : "考試完成！"}
            </h2>

            {/* 分数展示 */}
            <div
              style={{
                marginBottom: "2rem",
                animation: "fadeInUp 0.6s ease-out 0.3s both",
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? "3rem" : "4rem",
                  fontWeight: "bold",
                  background: `linear-gradient(135deg, ${
                    examResult.score >= 90
                      ? "#667eea 0%, #764ba2 100%"
                      : examResult.score >= 80
                      ? "#f093fb 0%, #f5576c 100%"
                      : examResult.score >= 60
                      ? "#4facfe 0%, #00f2fe 100%"
                      : "#fa709a 0%, #fee140 100%"
                  })`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: "0.5rem",
                  animation: "scaleIn 0.6s ease-out 0.4s both",
                }}
              >
                {examResult.score}分
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  color: theme.textSecondary,
                  marginTop: "0.5rem",
                }}
              >
                {lang === "cn"
                  ? `正确：${examResult.correctCount}/${examResult.totalCount}`
                  : lang === "en"
                  ? `Correct: ${examResult.correctCount}/${examResult.totalCount}`
                  : `正確：${examResult.correctCount}/${examResult.totalCount}`}
              </div>
            </div>

            {/* 积分展示 */}
            {examResult.pointsEarned > 0 && (
              <div
                style={{
                  padding: "1.5rem",
                  backgroundColor: isDarkMode ? "#1a1a1a" : "#fff3cd",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                  border: "2px solid #ffc107",
                  animation: pointsAnimation
                    ? "pointsPulse 1s ease-out 0.5s both"
                    : "fadeInUp 0.6s ease-out 0.5s both",
                }}
              >
                <div
                  style={{
                    fontSize: "1.2rem",
                    color: theme.text,
                    marginBottom: "0.5rem",
                    fontWeight: "600",
                  }}
                >
                  {lang === "cn"
                    ? "获得积分"
                    : lang === "en"
                    ? "Points Earned"
                    : "獲得積分"}
                </div>
                <div
                  style={{
                    fontSize: isMobile ? "2.5rem" : "3rem",
                    fontWeight: "bold",
                    color: "#ff6b35",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    animation: pointsAnimation
                      ? "pointsBounce 0.8s ease-out 0.7s both"
                      : "none",
                  }}
                >
                  <span>💰</span>
                  <span
                    style={{
                      animation: pointsAnimation
                        ? "numberCount 1s ease-out 0.7s both"
                        : "none",
                    }}
                  >
                    +{examResult.pointsEarned}
                  </span>
                </div>
              </div>
            )}

            {/* 确认按钮 */}
            <button
              onClick={() => {
                setShowResultModal(false);
                onBack();
              }}
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: "1.1rem",
                fontWeight: "600",
                backgroundColor: "#1890ff",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.3s",
                animation: "fadeInUp 0.6s ease-out 0.6s both",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#40a9ff";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#1890ff";
                e.target.style.transform = "translateY(0)";
              }}
            >
              {lang === "cn"
                ? "返回"
                : lang === "en"
                ? "Back"
                : "返回"}
            </button>
          </div>
        </div>
      )}

      {/* CSS动画样式 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes bounceIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes pointsPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes pointsBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes numberCount {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default ExamPage;

