// StudySessionList.jsx
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function StudySessionList({ lang, onStartPractice }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p>{lang === "cn" ? "加载中..." : lang === "en" ? "Loading..." : "載入中..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "1rem",
          backgroundColor: "#fee",
          border: "1px solid #fcc",
          borderRadius: "4px",
          marginBottom: "1rem",
          color: "#c00",
        }}
      >
        错误: {error}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: "1.5rem" }}>
        {lang === "cn" ? "学习记录" : lang === "en" ? "Study Records" : "學習記錄"}
      </h2>

      {sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>
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
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1rem",
          }}
        >
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1.5rem",
                backgroundColor: "white",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
                {session.exam_name || `Exam #${session.exam_id}`}
              </h3>
              <div style={{ marginBottom: "0.5rem", color: "#666", fontSize: "0.9rem" }}>
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
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <button
                  onClick={() => {
                    if (session.total_count === 0) {
                      alert(lang === "cn" ? "该学习记录中没有题目" : lang === "en" ? "No questions in this session" : "該學習記錄中沒有題目");
                      return;
                    }
                    onStartPractice(session.id, "all");
                  }}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#ff6b35",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "bold",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#e55a2b";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#ff6b35";
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
                    flex: 1,
                    padding: "0.75rem",
                    backgroundColor: "#52c41a",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "bold",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#389e0d";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "#52c41a";
                  }}
                >
                  {lang === "cn" ? "错题" : lang === "en" ? "Wrong" : "錯題"}
                  {session.wrong_count !== undefined && `（${session.wrong_count}）`}
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
