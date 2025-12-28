// ExamPage.jsx
// 考试模式页面：倒计时、题目乱序、前进后退、完成考试、中途退出
import { useState, useEffect, useRef, useCallback } from "react";

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
  
  const timeIntervalRef = useRef(null);

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
    initializeExam();
    
    // 清理函数
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
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
          // 时间到，自动提交
          handleSubmitExam(true); // true 表示时间到自动提交
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
    if (submitted) return;

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
        return;
      }
    }

    try {
      setLoading(true);
      setSubmitted(true);
      
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
      const scoreMessage = lang === "cn"
        ? `考试完成！\n结果：${correctCount}/${totalCount}\n分数：${score}`
        : lang === "en"
        ? `Exam completed!\nResult: ${correctCount}/${totalCount}\nScore: ${score}`
        : `考試完成！\n結果：${correctCount}/${totalCount}\n分數：${score}`;

      alert(scoreMessage);
      
      // 返回列表
      onBack();
    } catch (err) {
      setError(String(err));
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  // 处理页面离开（中途退出）
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!submitted && currentQuestion) {
        // 保存当前答案到 answers 状态（同步操作）
        if (currentQuestion && selectedAnswer !== null) {
          setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: selectedAnswer,
          }));
        }
        // 设置警告消息
        e.preventDefault();
        e.returnValue = lang === "cn" ? "考试进行中，退出将自动提交试卷" : "Exam in progress. Leaving will auto-submit.";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // 组件卸载时，如果还没提交，自动提交（中途退出）
      if (!submitted && currentQuestion) {
        // 保存当前答案
        const finalAnswers = { ...answers };
        if (currentQuestion && selectedAnswer !== null) {
          finalAnswers[currentQuestion.id] = selectedAnswer;
        }
        // 使用 fetch 的 keepalive 选项发送提交请求（即使页面关闭也能发送）
        const token = localStorage.getItem("access_token");
        if (token) {
          fetch(`${API_URL}/api/c/study/sessions/${sessionId}/submit-exam`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              answers: finalAnswers,
              submit_time: new Date().toISOString(),
            }),
            keepalive: true, // 即使页面关闭也会发送请求
          }).catch(err => {
            console.error("自动提交失败:", err);
          });
        }
      }
    };
  }, [submitted, currentQuestion, selectedAnswer, answers, sessionId, lang]);

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
  const isLastQuestion = currentIndex >= totalCount - 1;

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
            src={currentQuestion.image_url}
            alt="Question"
            style={{
              maxWidth: "100%",
              height: "auto",
              marginBottom: "1rem",
              borderRadius: "8px",
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
            onClick={() => handleSubmitExam(false)}
            disabled={submitted}
            style={{
              flex: 2,
              minWidth: "150px",
              padding: "0.75rem",
              backgroundColor: submitted ? "#d9d9d9" : "#ff4d4f",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: submitted ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontWeight: "600",
              opacity: submitted ? 0.6 : 1,
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
    </div>
  );
}

export default ExamPage;

