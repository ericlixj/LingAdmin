// StudySessionList.jsx
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// 练习模式大图标组件
const PracticeIcon = ({ size = 120, color = "#52c41a" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ display: "block" }}
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M8 7h8" />
    <path d="M8 11h6" />
    <path d="M8 15h4" />
  </svg>
);

// 考试模式大图标组件
const ExamIcon = ({ size = 120, color = "#1890ff" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ display: "block" }}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
    <path d="M16 18h.01" />
  </svg>
);

function StudySessionList({ lang, onStartPractice, onStartExam }) {
  // 检测移动端
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 480;
    }
    return false;
  });

  // 检测深色模式
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // 视图状态：'main' | 'practice-list' | 'exam-list'
  const [currentView, setCurrentView] = useState('main');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 监听窗口大小变化
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDarkMode(e.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // 主题颜色配置
  const theme = {
    bg: isDarkMode ? "#1a1a1a" : "#f5f5f5",
    cardBg: isDarkMode ? "#2d2d2d" : "#ffffff",
    text: isDarkMode ? "#e0e0e0" : "#333333",
    textSecondary: isDarkMode ? "#b0b0b0" : "#666666",
    border: isDarkMode ? "#404040" : "#ddd",
    shadow: isDarkMode ? "0 4px 12px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.15)",
  };

  // 获取sessions列表
  const fetchSessions = async (mode) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError(lang === "cn" ? "未登录" : lang === "en" ? "Not logged in" : "未登錄");
        return;
      }

      const response = await fetch(`${API_URL}/api/c/study/sessions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`获取学习记录失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        const allSessions = result.data;
        const filteredSessions = allSessions.filter(s => {
          if (mode === "exam") {
            return s.mode === "exam";
          } else {
            return s.mode === "practice" || !s.mode || s.mode === "";
          }
        });
        setSessions(filteredSessions);
        setCurrentView(mode === "exam" ? "exam-list" : "practice-list");
      } else {
        throw new Error(result.message || "获取学习记录失败");
      }
    } catch (err) {
      console.error("获取学习记录失败:", err);
      setError(lang === "cn" ? "获取学习记录失败: " + String(err) : lang === "en" ? "Failed to get study records: " + String(err) : "獲取學習記錄失敗: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  // 处理练习入口点击
  const handlePracticeClick = () => {
    fetchSessions("practice");
  };

  // 处理考试入口点击
  const handleExamClick = () => {
    fetchSessions("exam");
  };

  // 返回主入口
  const handleBackToMain = () => {
    setCurrentView('main');
    setSessions([]);
    setError("");
  };

  // 渲染主入口页面
  const renderMainView = () => (
    <div style={{
      backgroundColor: theme.bg,
      minHeight: "100vh",
      padding: isMobile ? "2rem 1rem" : "3rem 2rem",
      color: theme.text,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <h1 style={{ 
        marginBottom: isMobile ? "2rem" : "3rem",
        fontSize: isMobile ? "1.5rem" : "2rem",
        fontWeight: "600",
        color: theme.text,
        textAlign: "center",
      }}>
        {lang === "cn" ? "学习记录" : lang === "en" ? "Study Records" : "學習記錄"}
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
        gap: isMobile ? "2rem" : "3rem",
        width: "100%",
        maxWidth: isMobile ? "100%" : "800px",
      }}>
        {/* 练习模式入口 */}
        <button
          onClick={handlePracticeClick}
          style={{
            backgroundColor: theme.cardBg,
            border: `2px solid #52c41a`,
            borderRadius: "20px",
            padding: isMobile ? "2.5rem 1.5rem" : "3rem 2rem",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? "1rem" : "1.5rem",
            boxShadow: theme.shadow,
            transition: "all 0.3s ease",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
            userSelect: "none",
            minHeight: isMobile ? "200px" : "280px",
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = isDarkMode 
                ? "0 8px 20px rgba(82, 196, 26, 0.3)" 
                : "0 8px 20px rgba(82, 196, 26, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = theme.shadow;
            }
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = "scale(0.98)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: isMobile ? "100px" : "120px",
            height: isMobile ? "100px" : "120px",
          }}>
            <PracticeIcon size={isMobile ? 100 : 120} color="#52c41a" />
          </div>
          <div style={{
            fontSize: isMobile ? "1.2rem" : "1.5rem",
            fontWeight: "600",
            color: theme.text,
            textAlign: "center",
          }}>
            {lang === "cn" ? "练习模式" : lang === "en" ? "Practice Mode" : "練習模式"}
          </div>
          <div style={{
            fontSize: isMobile ? "0.85rem" : "1rem",
            color: theme.textSecondary,
            textAlign: "center",
            lineHeight: 1.5,
          }}>
            {lang === "cn" 
              ? "自由练习，随时暂停，支持笔记和收藏" 
              : lang === "en"
              ? "Free practice, pause anytime, with notes and favorites"
              : "自由練習，隨時暫停，支持筆記和收藏"}
          </div>
        </button>

        {/* 考试模式入口 */}
        <button
          onClick={handleExamClick}
          style={{
            backgroundColor: theme.cardBg,
            border: `2px solid #1890ff`,
            borderRadius: "20px",
            padding: isMobile ? "2.5rem 1.5rem" : "3rem 2rem",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? "1rem" : "1.5rem",
            boxShadow: theme.shadow,
            transition: "all 0.3s ease",
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
            userSelect: "none",
            minHeight: isMobile ? "200px" : "280px",
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = isDarkMode 
                ? "0 8px 20px rgba(24, 144, 255, 0.3)" 
                : "0 8px 20px rgba(24, 144, 255, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = theme.shadow;
            }
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = "scale(0.98)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: isMobile ? "100px" : "120px",
            height: isMobile ? "100px" : "120px",
          }}>
            <ExamIcon size={isMobile ? 100 : 120} color="#1890ff" />
          </div>
          <div style={{
            fontSize: isMobile ? "1.2rem" : "1.5rem",
            fontWeight: "600",
            color: theme.text,
            textAlign: "center",
          }}>
            {lang === "cn" ? "考试模式" : lang === "en" ? "Exam Mode" : "考試模式"}
          </div>
          <div style={{
            fontSize: isMobile ? "0.85rem" : "1rem",
            color: theme.textSecondary,
            textAlign: "center",
            lineHeight: 1.5,
          }}>
            {lang === "cn" 
              ? "限时考试，自动评分，查看成绩" 
              : lang === "en"
              ? "Timed exam, auto-grading, view results"
              : "限時考試，自動評分，查看成績"}
          </div>
        </button>
      </div>
    </div>
  );

  // 渲染列表页面
  const renderListView = () => {
    const isPracticeList = currentView === "practice-list";
    const title = isPracticeList 
      ? (lang === "cn" ? "练习记录" : lang === "en" ? "Practice Records" : "練習記錄")
      : (lang === "cn" ? "考试记录" : lang === "en" ? "Exam Records" : "考試記錄");

    if (loading) {
      return (
        <div style={{
          backgroundColor: theme.bg,
          minHeight: "100vh",
          padding: isMobile ? "2rem 1rem" : "3rem 2rem",
          color: theme.text,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <p>{lang === "cn" ? "加载中..." : lang === "en" ? "Loading..." : "載入中..."}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{
          backgroundColor: theme.bg,
          minHeight: "100vh",
          padding: isMobile ? "2rem 1rem" : "3rem 2rem",
          color: theme.text,
        }}>
          <div style={{
            padding: "1rem",
            backgroundColor: isDarkMode ? "#3a1a1a" : "#fee",
            border: `1px solid ${isDarkMode ? "#ff6b6b" : "#fcc"}`,
            borderRadius: "8px",
            marginBottom: "1rem",
            color: isDarkMode ? "#ff6b6b" : "#c00",
          }}>
            {error}
          </div>
          <button
            onClick={handleBackToMain}
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

    if (sessions.length === 0) {
      return (
        <div style={{
          backgroundColor: theme.bg,
          minHeight: "100vh",
          padding: isMobile ? "2rem 1rem" : "3rem 2rem",
          color: theme.text,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "2rem",
          }}>
            <button
              onClick={handleBackToMain}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "transparent",
                border: `1px solid ${theme.border}`,
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1rem",
                color: theme.text,
              }}
            >
              ← {lang === "cn" ? "返回" : lang === "en" ? "Back" : "返回"}
            </button>
            <h1 style={{ 
              margin: 0,
              fontSize: isMobile ? "1.3rem" : "1.5rem",
              fontWeight: "600",
              color: theme.text,
            }}>
              {title}
            </h1>
          </div>
          <div style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: theme.textSecondary,
          }}>
            <p>
              {isPracticeList
                ? (lang === "cn" ? "暂无练习记录" : lang === "en" ? "No practice records" : "暫無練習記錄")
                : (lang === "cn" ? "暂无考试记录" : lang === "en" ? "No exam records" : "暫無考試記錄")}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        backgroundColor: theme.bg,
        minHeight: "100vh",
        padding: isMobile ? "1rem 0.75rem" : "1.5rem",
        color: theme.text,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: isMobile ? "1rem" : "1.5rem",
        }}>
          <button
            onClick={handleBackToMain}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "transparent",
              border: `1px solid ${theme.border}`,
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              color: theme.text,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.backgroundColor = isDarkMode ? "#3a3a3a" : "#f5f5f5";
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            ← {lang === "cn" ? "返回" : lang === "en" ? "Back" : "返回"}
          </button>
          <h1 style={{ 
            margin: 0,
            fontSize: isMobile ? "1.3rem" : "1.5rem",
            fontWeight: "600",
            color: theme.text,
          }}>
            {title}
          </h1>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
          gap: isMobile ? "0.75rem" : "1rem",
        }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: "12px",
                padding: isMobile ? "1rem" : "1.5rem",
                backgroundColor: theme.cardBg,
                boxShadow: theme.shadow,
                transition: "all 0.2s",
              }}
            >
              <h3 style={{ 
                marginTop: 0, 
                marginBottom: isMobile ? "0.5rem" : "0.75rem",
                fontSize: isMobile ? "1.1rem" : "1.25rem",
                fontWeight: "600",
                color: theme.text,
                wordBreak: "break-word",
              }}>
                {session.exam_name || `Exam #${session.exam_id}`}
              </h3>
              <div style={{ 
                marginBottom: isMobile ? "0.75rem" : "1rem", 
                color: theme.textSecondary, 
                fontSize: isMobile ? "0.85rem" : "0.9rem",
                lineHeight: 1.6,
              }}>
                {!isPracticeList && session.score !== null && session.score !== undefined && session.score >= 0 && (
                  <div>
                    <strong>
                      {lang === "cn" ? "分数:" : lang === "en" ? "Score:" : "分數:"}
                    </strong>{" "}
                    {session.score}
                  </div>
                )}
                {!isPracticeList && session.exam_duration_minutes && (
                  <div>
                    <strong>
                      {lang === "cn" ? "考试时长（分钟）:" : lang === "en" ? "Exam Duration (minutes):" : "考試時長（分鐘）:"}
                    </strong>{" "}
                    {session.exam_duration_minutes}
                  </div>
                )}
                {!isPracticeList && session.question_count && (
                  <div>
                    <strong>
                      {lang === "cn" ? "考试题目数量:" : lang === "en" ? "Question Count:" : "考試題目數量:"}
                    </strong>{" "}
                    {session.question_count}
                  </div>
                )}
                <div>
                  <strong>
                    {lang === "cn" ? "创建时间:" : lang === "en" ? "Created:" : "創建時間:"}
                  </strong>{" "}
                  {new Date(session.create_time).toLocaleString()}
                </div>
              </div>
              
              {/* 操作按钮区域 */}
              <div style={{ 
                display: "flex", 
                gap: isMobile ? "0.5rem" : "0.75rem", 
                marginTop: isMobile ? "0.75rem" : "1rem", 
                flexWrap: "wrap" 
              }}>
                {isPracticeList ? (
                  <>
                    <button
                      onClick={() => {
                        if (session.total_count === 0) {
                          alert(lang === "cn" ? "该学习记录中没有题目" : lang === "en" ? "No questions in this session" : "該學習記錄中沒有題目");
                          return;
                        }
                        onStartPractice(session.id, "all");
                      }}
                      style={{
                        flex: isMobile ? "1 1 calc(50% - 0.25rem)" : 1,
                        minWidth: isMobile ? "calc(50% - 0.25rem)" : "100px",
                        padding: isMobile ? "0.85rem 0.5rem" : "0.75rem",
                        backgroundColor: "#ff6b35",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: isMobile ? "0.9rem" : "1rem",
                        fontWeight: "600",
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                        userSelect: "none",
                        transition: "background-color 0.2s, transform 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.target.style.backgroundColor = "#e55a2b";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.target.style.backgroundColor = "#ff6b35";
                        }
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.backgroundColor = "#e55a2b";
                        e.currentTarget.style.transform = "scale(0.97)";
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.backgroundColor = "#ff6b35";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {lang === "cn" ? "全部" : lang === "en" ? "All" : "全部"}
                      {session.total_count !== undefined && session.total_count > 0 ? (
                        session.completed_count !== undefined && session.completed_count !== null
                          ? ` ${session.completed_count}/${session.total_count}`
                          : ` 0/${session.total_count}`
                      ) : (
                        session.total_count !== undefined ? `（${session.total_count}）` : ''
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (session.wrong_count === 0) {
                          alert(lang === "cn" ? "该学习记录中没有错题" : lang === "en" ? "No wrong questions in this session" : "該學習記錄中沒有錯題");
                          return;
                        }
                        onStartPractice(session.id, "wrong");
                      }}
                      style={{
                        flex: isMobile ? "1 1 calc(50% - 0.25rem)" : 1,
                        minWidth: isMobile ? "calc(50% - 0.25rem)" : "100px",
                        padding: isMobile ? "0.85rem 0.5rem" : "0.75rem",
                        backgroundColor: "#52c41a",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: isMobile ? "0.9rem" : "1rem",
                        fontWeight: "600",
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                        userSelect: "none",
                        transition: "background-color 0.2s, transform 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.target.style.backgroundColor = "#389e0d";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.target.style.backgroundColor = "#52c41a";
                        }
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.backgroundColor = "#389e0d";
                        e.currentTarget.style.transform = "scale(0.97)";
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.backgroundColor = "#52c41a";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {lang === "cn" ? "错题" : lang === "en" ? "Wrong" : "錯題"}
                      {session.wrong_count !== undefined && `（${session.wrong_count}）`}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        if (session.total_count === 0) {
                          alert(lang === "cn" ? "该学习记录中没有题目" : lang === "en" ? "No questions in this session" : "該學習記錄中沒有題目");
                          return;
                        }
                        // 点击按钮自动生成新的study_session
                        onStartExam(session.id, true);
                      }}
                      style={{
                        flex: isMobile ? "1 1 calc(50% - 0.25rem)" : 1,
                        minWidth: isMobile ? "calc(50% - 0.25rem)" : "100px",
                        padding: isMobile ? "0.85rem 0.5rem" : "0.75rem",
                        backgroundColor: "#1890ff",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: isMobile ? "0.9rem" : "1rem",
                        fontWeight: "600",
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                        userSelect: "none",
                        transition: "background-color 0.2s, transform 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.target.style.backgroundColor = "#096dd9";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.target.style.backgroundColor = "#1890ff";
                        }
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.backgroundColor = "#096dd9";
                        e.currentTarget.style.transform = "scale(0.97)";
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.backgroundColor = "#1890ff";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {lang === "cn" ? "开始考试" : lang === "en" ? "Start Exam" : "開始考試"}
                    </button>
                    <button
                      onClick={() => {
                        if (session.wrong_count === 0) {
                          alert(lang === "cn" ? "该学习记录中没有错题" : lang === "en" ? "No wrong questions in this session" : "該學習記錄中沒有錯題");
                          return;
                        }
                        onStartPractice(session.id, "wrong");
                      }}
                      style={{
                        flex: isMobile ? "1 1 calc(50% - 0.25rem)" : 1,
                        minWidth: isMobile ? "calc(50% - 0.25rem)" : "100px",
                        padding: isMobile ? "0.85rem 0.5rem" : "0.75rem",
                        backgroundColor: "#52c41a",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: isMobile ? "0.9rem" : "1rem",
                        fontWeight: "600",
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation",
                        userSelect: "none",
                        transition: "background-color 0.2s, transform 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.target.style.backgroundColor = "#389e0d";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.target.style.backgroundColor = "#52c41a";
                        }
                      }}
                      onTouchStart={(e) => {
                        e.currentTarget.style.backgroundColor = "#389e0d";
                        e.currentTarget.style.transform = "scale(0.97)";
                      }}
                      onTouchEnd={(e) => {
                        e.currentTarget.style.backgroundColor = "#52c41a";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {lang === "cn" ? "错题" : lang === "en" ? "Wrong" : "錯題"}
                      {session.wrong_count !== undefined && `（${session.wrong_count}）`}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 根据当前视图渲染不同内容
  if (currentView === 'main') {
    return renderMainView();
  } else {
    return renderListView();
  }
}

export default StudySessionList;
