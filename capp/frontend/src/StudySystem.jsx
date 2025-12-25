// StudySystem.jsx
import { useState, useEffect } from "react";
import StudySessionList from "./StudySessionList";
import PracticePage from "./PracticePage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function StudySystem({ lang, user }) {
  const [view, setView] = useState("list"); // "list" 或 "practice"
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [practiceMode, setPracticeMode] = useState("all"); // "all"、"wrong" 或 "favorite"

  const handleStartPractice = (sessionId, mode = "all") => {
    setSelectedSessionId(sessionId);
    setPracticeMode(mode);
    setView("practice");
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

  return (
    <StudySessionList
      lang={lang}
      onStartPractice={handleStartPractice}
    />
  );
}

export default StudySystem;


