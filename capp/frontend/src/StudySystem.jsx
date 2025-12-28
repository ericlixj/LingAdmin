// StudySystem.jsx
import { useState, useEffect } from "react";
import StudySessionList from "./StudySessionList";
import PracticePage from "./PracticePage";
import ExamPage from "./ExamPage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function StudySystem({ lang, user }) {
  const [view, setView] = useState("list"); // "list"、"practice" 或 "exam"
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [practiceMode, setPracticeMode] = useState("all"); // "all"、"wrong" 或 "favorite"

  // 开始练习
  // 注意：每次调用此函数时，practiceMode 的变化会触发 PracticePage 重新初始化
  // 错题模式每次进入都会从第一题开始，按顺序显示（不打乱）
  const handleStartPractice = (sessionId, mode = "all") => {
    setSelectedSessionId(sessionId);
    setPracticeMode(mode);
    setView("practice");
  };

  // 开始考试
  const handleStartExam = async (sessionId, restart = false) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert(lang === "cn" ? "未登录" : lang === "en" ? "Not logged in" : "未登錄");
        return;
      }

      // 获取session信息，获取exam_id
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
      const examId = session.exam_id;
      const questionCount = session.question_count || 20;

      // 创建新的study_session
      const createResponse = await fetch(
        `${API_URL}/api/c/study/exams/${examId}/create-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            question_count: questionCount,
            restart: restart // 传递restart参数，标识是否是重新开始
          }),
        }
      );

      if (!createResponse.ok) {
        throw new Error("创建考试session失败");
      }

      const createResult = await createResponse.json();
      if (createResult.code !== 0) {
        throw new Error(createResult.message || "创建考试session失败");
      }

      // 使用新创建的sessionId
      setSelectedSessionId(createResult.data.session_id);
      setView("exam");
    } catch (err) {
      console.error("开始考试失败:", err);
      alert(lang === "cn" ? "开始考试失败: " + String(err) : lang === "en" ? "Failed to start exam: " + String(err) : "開始考試失敗: " + String(err));
    }
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedSessionId(null);
    setPracticeMode("all");
  };

  if (view === "practice") {
    return (
      <PracticePage
        sessionId={selectedSessionId}
        practiceMode={practiceMode}
        lang={lang}
        onBack={handleBackToList}
      />
    );
  }

  if (view === "exam") {
    return (
      <ExamPage
        sessionId={selectedSessionId}
        lang={lang}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <StudySessionList
      lang={lang}
      onStartPractice={handleStartPractice}
      onStartExam={handleStartExam}
    />
  );
}

export default StudySystem;



