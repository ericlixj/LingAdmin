// StudySessionList.jsx
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function StudySessionList({ lang, onStartPractice }) {
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

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 主题颜色配置
  const theme = {
    bg: isDarkMode ? "#1a1a1a" : "#f5f5f5",
    cardBg: isDarkMode ? "#2d2d2d" : "#ffffff",
    text: isDarkMode ? "#e0e0e0" : "#333333",
    textSecondary: isDarkMode ? "#b0b0b0" : "#666666",
    border: isDarkMode ? "#404040" : "#ddd",
    shadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
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
        setSessions(result.data);
        setError("");
      } else {
        throw new Error(result.message || "获取学习记录失败");
      }
    } catch (err) {
      setError("加载失败: " + String(err));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        textAlign: "center", 
        padding: isMobile ? "1.5rem 1rem" : "2rem",
        backgroundColor: theme.bg,
        color: theme.text,
        minHeight: "100vh"
      }}>
        <p style={{ fontSize: isMobile ? "0.95rem" : "1rem" }}>
          {lang === "cn" ? "加载中..." : lang === "en" ? "Loading..." : "載入中..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: isMobile ? "0.75rem" : "1rem",
          backgroundColor: isDarkMode ? "#3a1a1a" : "#fee",
          border: `1px solid ${isDarkMode ? "#ff6b6b" : "#fcc"}`,
          borderRadius: "8px",
          marginBottom: "1rem",
          color: isDarkMode ? "#ff6b6b" : "#c00",
          fontSize: isMobile ? "0.9rem" : "1rem",
        }}
      >
        错误: {error}
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
      <h2 style={{ 
        marginBottom: isMobile ? "1rem" : "1.5rem",
        fontSize: isMobile ? "1.3rem" : "1.5rem",
        fontWeight: "600",
        color: theme.text,
      }}>
        {lang === "cn" ? "学习记录" : lang === "en" ? "Study Records" : "學習記錄"}
      </h2>

      {sessions.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: isMobile ? "2rem 1rem" : "2rem",
          color: theme.textSecondary,
        }}>
          <p style={{ fontSize: isMobile ? "0.95rem" : "1rem" }}>
            {lang === "cn"
              ? "暂无学习记录"
              : lang === "en"
              ? "No study records"
              : "暫無學習記錄"}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
            gap: isMobile ? "0.75rem" : "1rem",
          }}
        >
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                border: `1px solid ${theme.border}`,
                borderRadius: "12px",
                padding: isMobile ? "1rem" : "1.5rem",
                backgroundColor: theme.cardBg,
                boxShadow: theme.shadow,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onTouchStart={(e) => {
                // iOS触摸反馈
                e.currentTarget.style.transform = "scale(0.98)";
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = "scale(1)";
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
                <div>
                  <strong>
                    {lang === "cn" ? "模式:" : lang === "en" ? "Mode:" : "模式:"}
                  </strong>{" "}
                  {session.mode || "-"}
                </div>
                {session.score !== null && (
                  <div>
                    <strong>
                      {lang === "cn" ? "分数:" : lang === "en" ? "Score:" : "分數:"}
                    </strong>{" "}
                    {session.score}
                  </div>
                )}
                <div>
                  <strong>
                    {lang === "cn" ? "创建时间:" : lang === "en" ? "Created:" : "創建時間:"}
                  </strong>{" "}
                  {new Date(session.create_time).toLocaleString()}
                </div>
              </div>
              <div style={{ 
                display: "flex", 
                gap: isMobile ? "0.5rem" : "0.75rem", 
                marginTop: isMobile ? "0.75rem" : "1rem", 
                flexWrap: "wrap" 
              }}>
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
                    WebkitTapHighlightColor: "transparent", // iOS点击高亮
                    touchAction: "manipulation", // 优化触摸响应
                    userSelect: "none", // 防止文本选择
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
                  {session.total_count !== undefined && `（${session.total_count}）`}
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
                <button
                  onClick={() => {
                    if (session.favorite_count === 0) {
                      alert(lang === "cn" ? "该学习记录中没有收藏题目" : lang === "en" ? "No favorite questions in this session" : "該學習記錄中沒有收藏題目");
                      return;
                    }
                    onStartPractice(session.id, "favorite");
                  }}
                  style={{
                    flex: isMobile ? "1 1 100%" : 1,
                    minWidth: isMobile ? "100%" : "100px",
                    padding: isMobile ? "0.85rem 0.5rem" : "0.75rem",
                    backgroundColor: "#faad14",
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
                      e.target.style.backgroundColor = "#d48806";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.target.style.backgroundColor = "#faad14";
                    }
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.backgroundColor = "#d48806";
                    e.currentTarget.style.transform = "scale(0.97)";
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.backgroundColor = "#faad14";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {lang === "cn" ? "收藏" : lang === "en" ? "Favorite" : "收藏"}
                  {session.favorite_count !== undefined && `（${session.favorite_count}）`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudySessionList;


