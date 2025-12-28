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
      
      console.log('[INFO] Session数据:', {
        sessionId: sessionId,
        examId: session.exam_id,
        exam_duration: session.exam_duration,
        question_count: session.question_count
      });
      
      // 重新查询当前考试的基本信息，包括时长、题目数目等，不使用内存中的数据
      const examResponse = await fetch(
        `${API_URL}/api/c/study/exams/${examId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!examResponse.ok) {
        throw new Error("获取考试详情失败");
      }

      const examResult = await examResponse.json();
      if (examResult.code !== 0) {
        throw new Error(examResult.message || "获取考试详情失败");
      }

      const exam = examResult.data;
      
      console.log('[INFO] Exam数据:', {
        examId: exam.id,
        exam_duration: exam.exam_duration,
        available_question_count: exam.available_question_count
      });
      
      // 使用从数据库查询的最新exam参数创建新的study_session
      // 传递session_id，后端会优先使用session的参数（exam_duration, question_count）
      const requestBody = {
        session_id: sessionId // 传递当前session_id，用于查询session的参数
      };
      
      // 注意：不再传递question_count，让后端使用session的question_count
      // 如果session没有question_count，后端会使用exam的可用题目数量或默认值

      // 创建新的study_session
      // 后端会先删除该用户该exam的所有已有考试，然后创建新的考试session
      const createResponse = await fetch(
        `${API_URL}/api/c/study/exams/${examId}/create-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!createResponse.ok) {
        throw new Error("创建考试session失败");
      }

      const createResult = await createResponse.json();
      if (createResult.code !== 0) {
        throw new Error(createResult.message || "创建考试session失败");
      }

      // 使用返回的sessionId（可能是当前session或新创建的session）
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



