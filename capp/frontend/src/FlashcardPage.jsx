// FlashcardPage.jsx
import { useState, useEffect } from "react";
import { getProxyImageUrl } from "./utils/imageProxy";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// HTML清理函数：保留安全的HTML标签，移除危险的脚本和事件
const sanitizeHtml = (html) => {
  if (!html) return "";
  
  // 创建一个临时div来解析HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  
  // 允许的标签列表
  const allowedTags = [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i', 'span', 'div',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ];
  
  // 允许的属性
  const allowedAttributes = ['href', 'src', 'alt', 'title', 'class', 'style'];
  
  // 递归清理节点
  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode(true);
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      // 如果是不允许的标签，只保留文本内容
      if (!allowedTags.includes(tagName)) {
        const textNode = document.createTextNode(node.textContent || '');
        return textNode;
      }
      
      // 创建新节点
      const newNode = document.createElement(tagName);
      
      // 复制允许的属性
      Array.from(node.attributes).forEach(attr => {
        const attrName = attr.name.toLowerCase();
        if (allowedAttributes.includes(attrName)) {
          // 对于style属性，进行额外清理
          if (attrName === 'style') {
            // 只保留安全的CSS属性
            const safeStyles = ['color', 'font-size', 'font-weight', 'text-align', 
                              'margin', 'padding', 'line-height', 'background-color'];
            const styleValue = attr.value;
            const cleanedStyles = styleValue.split(';')
              .filter(style => {
                const prop = style.split(':')[0].trim().toLowerCase();
                return safeStyles.some(safe => prop.includes(safe));
              })
              .join(';');
            if (cleanedStyles) {
              newNode.setAttribute('style', cleanedStyles);
            }
          } else if (attrName === 'href' || attrName === 'src') {
            // 确保链接是安全的（只允许http/https）
            const url = attr.value;
            if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
              newNode.setAttribute(attrName, url);
            }
          } else {
            newNode.setAttribute(attrName, attr.value);
          }
        }
      });
      
      // 递归清理子节点
      Array.from(node.childNodes).forEach(child => {
        const cleanedChild = cleanNode(child);
        if (cleanedChild) {
          newNode.appendChild(cleanedChild);
        }
      });
      
      return newNode;
    }
    
    return null;
  };
  
  // 清理所有节点
  const fragment = document.createDocumentFragment();
  Array.from(tempDiv.childNodes).forEach(node => {
    const cleaned = cleanNode(node);
    if (cleaned) {
      fragment.appendChild(cleaned);
    }
  });
  
  // 将清理后的内容转换为HTML字符串
  const cleanedDiv = document.createElement("div");
  cleanedDiv.appendChild(fragment);
  return cleanedDiv.innerHTML;
};

// Flashcard 状态文字映射函数
const getFlashcardStateText = (state, lang = "cn") => {
  if (!state) return "";
  
  const stateMap = {
    cn: {
      new: "新增",
      learning: "学习中",
      review: "复习中"
    },
    en: {
      new: "New",
      learning: "Learning",
      review: "Reviewing"
    },
    hk: {
      new: "新增",
      learning: "學習中",
      review: "複習中"
    }
  };
  
  const stateLower = state.toLowerCase();
  return stateMap[lang]?.[stateLower] || state;
};

function FlashcardPage({ sessionId, lang, onBack }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 480;
  
  // 检测深色模式
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

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

  const theme = {
    bg: isDarkMode ? "#1a1a1a" : "#f5f5f5",
    cardBg: isDarkMode ? "#2d2d2d" : "#ffffff",
    text: isDarkMode ? "#e0e0e0" : "#333333",
    textSecondary: isDarkMode ? "#b0b0b0" : "#666666",
    border: isDarkMode ? "#404040" : "#ddd",
    shadow: isDarkMode ? "0 4px 12px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.15)",
  };

  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // 获取 session 信息
  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token || !sessionId) return;
        
        const response = await fetch(`${API_URL}/api/c/study/sessions/${sessionId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.code === 0 && result.data) {
            setSessionInfo(result.data);
          }
        }
      } catch (err) {
        console.error("获取session信息失败:", err);
      }
    };
    
    fetchSessionInfo();
  }, [sessionId]);

  // 获取今日学习内容
  useEffect(() => {
    const fetchTodayItems = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("access_token");
        if (!token || !sessionId || !sessionInfo) return;
        
        // 检查是否有测试日期（从 localStorage 读取，用于模拟不同日期）
        const testDate = localStorage.getItem("flashcard_test_date");
        let url = `${API_URL}/api/c/study/flashcard/get_today_items?exam_id=${sessionInfo.exam_id}&session_id=${sessionId}`;
        if (testDate) {
          url += `&test_date=${testDate}`;
          console.log(`[Flashcard] 使用测试日期: ${testDate}`);
        }
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`获取学习内容失败: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.code === 0 && result.data) {
          setItems(result.data.data || []);
          setCurrentIndex(0);
          setShowAnswer(false);
        } else {
          throw new Error(result.message || "获取学习内容失败");
        }
      } catch (err) {
        console.error("获取学习内容失败:", err);
        setError(lang === "cn" ? "获取学习内容失败: " + String(err) : lang === "en" ? "Failed to get learning content: " + String(err) : "獲取學習內容失敗: " + String(err));
      } finally {
        setLoading(false);
      }
    };
    
    if (sessionInfo) {
      fetchTodayItems();
    }
  }, [sessionId, sessionInfo, lang]);

  // 处理评分
  const handleRating = async (rating) => {
    if (submitting || currentIndex >= items.length) return;
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem("access_token");
      const currentItem = items[currentIndex];
      
      if (!currentItem || !currentItem.progress_id) {
        throw new Error("当前项目无效");
      }
      
      const response = await fetch(
        `${API_URL}/api/c/study/flashcard/update_rating/${currentItem.progress_id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ rating }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`更新评分失败: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.code === 0) {
        // 移动到下一题
        if (currentIndex < items.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setShowAnswer(false);
        } else {
          // 学习完成
          alert(lang === "cn" ? "今日学习完成！" : lang === "en" ? "Today's learning completed!" : "今日學習完成！");
          onBack();
        }
      } else {
        throw new Error(result.message || "更新评分失败");
      }
    } catch (err) {
      console.error("更新评分失败:", err);
      alert(lang === "cn" ? "更新评分失败: " + String(err) : lang === "en" ? "Failed to update rating: " + String(err) : "更新評分失敗: " + String(err));
    } finally {
      setSubmitting(false);
    }
  };

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
          onClick={onBack}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#722ed1",
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

  if (items.length === 0) {
    return (
      <div style={{
        backgroundColor: theme.bg,
        minHeight: "100vh",
        padding: isMobile ? "2rem 1rem" : "3rem 2rem",
        color: theme.text,
      }}>
        <div style={{
          textAlign: "center",
          padding: "3rem 1rem",
          color: theme.textSecondary,
        }}>
          <p>
            {lang === "cn" 
              ? "今日没有需要学习的内容" 
              : lang === "en"
              ? "No learning content for today"
              : "今日沒有需要學習的內容"}
          </p>
        </div>
        <button
          onClick={onBack}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#722ed1",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem",
            display: "block",
            margin: "0 auto",
          }}
        >
          {lang === "cn" ? "返回" : lang === "en" ? "Back" : "返回"}
        </button>
      </div>
    );
  }

  const currentItem = items[currentIndex];
  const content = currentItem?.content || {};
  const isKnowledge = currentItem?.type === "knowledge";

  return (
    <>
      {/* 添加富文本样式 */}
      <style>{`
        .flashcard-description {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .flashcard-description p {
          margin: 0.5rem 0;
        }
        .flashcard-description p:first-child {
          margin-top: 0;
        }
        .flashcard-description p:last-child {
          margin-bottom: 0;
        }
        .flashcard-description ul,
        .flashcard-description ol {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .flashcard-description li {
          margin: 0.25rem 0;
        }
        .flashcard-description h1,
        .flashcard-description h2,
        .flashcard-description h3,
        .flashcard-description h4,
        .flashcard-description h5,
        .flashcard-description h6 {
          margin: 0.75rem 0 0.5rem 0;
          font-weight: 600;
        }
        .flashcard-description h1:first-child,
        .flashcard-description h2:first-child,
        .flashcard-description h3:first-child,
        .flashcard-description h4:first-child,
        .flashcard-description h5:first-child,
        .flashcard-description h6:first-child {
          margin-top: 0;
        }
        .flashcard-description img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.5rem 0;
        }
        .flashcard-description a {
          color: ${isDarkMode ? "#7c3aed" : "#722ed1"};
          text-decoration: underline;
        }
        .flashcard-description a:hover {
          opacity: 0.8;
        }
        .flashcard-description table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.5rem 0;
        }
        .flashcard-description th,
        .flashcard-description td {
          padding: 0.5rem;
          border: 1px solid ${theme.border};
        }
        .flashcard-description blockquote {
          margin: 0.5rem 0;
          padding-left: 1rem;
          border-left: 3px solid ${theme.border};
          font-style: italic;
        }
        .flashcard-description code {
          background-color: ${isDarkMode ? "#3a3a3a" : "#f5f5f5"};
          padding: 0.2rem 0.4rem;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .flashcard-description pre {
          background-color: ${isDarkMode ? "#3a3a3a" : "#f5f5f5"};
          padding: 1rem;
          border-radius: 8px;
          overflow-x: auto;
        }
        .flashcard-description pre code {
          background-color: transparent;
          padding: 0;
        }
      `}</style>
      <div style={{
        backgroundColor: theme.bg,
        minHeight: "100vh",
        padding: isMobile ? "1rem 0.75rem" : "1.5rem",
        color: theme.text,
      }}>
      {/* 头部 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginBottom: isMobile ? "1rem" : "1.5rem",
      }}>
        <button
          onClick={onBack}
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
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0,
            fontSize: isMobile ? "1.3rem" : "1.5rem",
            fontWeight: "600",
            color: theme.text,
          }}>
            {lang === "cn" ? "FlashCard 学习" : lang === "en" ? "FlashCard Learning" : "FlashCard 學習"}
          </h1>
          <p style={{
            margin: "0.25rem 0 0 0",
            fontSize: isMobile ? "0.85rem" : "0.9rem",
            color: theme.textSecondary,
          }}>
            {currentIndex + 1} / {items.length}
          </p>
        </div>
      </div>

      {/* 卡片 */}
      <div style={{
        backgroundColor: theme.cardBg,
        borderRadius: "16px",
        padding: isMobile ? "2rem 1.5rem" : "3rem 2rem",
        boxShadow: theme.shadow,
        marginBottom: "2rem",
        minHeight: isMobile ? "300px" : "400px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}>
        {isKnowledge ? (
          <>
            <h2 style={{
              marginTop: 0,
              marginBottom: "1rem",
              fontSize: isMobile ? "1.3rem" : "1.5rem",
              fontWeight: "600",
              color: theme.text,
            }}>
              {content.title || content.code || ""}
            </h2>
            {/* 显示图片（front text 部分） */}
            {content.image_url && (
              <div style={{
                marginBottom: "1rem",
                textAlign: "center",
              }}>
                <img
                  src={getProxyImageUrl(content.image_url)}
                  alt={content.title || content.code || ""}
                  style={{
                    maxWidth: "100%",
                    maxHeight: isMobile ? "200px" : "300px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    boxShadow: theme.shadow,
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
            {showAnswer && (
              <div 
                style={{
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: `1px solid ${theme.border}`,
                  fontSize: isMobile ? "0.95rem" : "1rem",
                  lineHeight: 1.6,
                  color: theme.text,
                }}
                className="flashcard-description"
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeHtml(content.description || "") 
                }}
              />
            )}
          </>
        ) : (
          <div style={{
            fontSize: isMobile ? "0.95rem" : "1rem",
            lineHeight: 1.6,
            color: theme.text,
            whiteSpace: "pre-wrap",
          }}>
            {content.stem || ""}
            {/* 显示图片（front text 部分） */}
            {content.image_url && (
              <div style={{
                marginTop: "1rem",
                marginBottom: "1rem",
                textAlign: "center",
              }}>
                <img
                  src={getProxyImageUrl(content.image_url)}
                  alt="题目图片"
                  style={{
                    maxWidth: "100%",
                    maxHeight: isMobile ? "200px" : "300px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    boxShadow: theme.shadow,
                  }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
            {showAnswer && content.options && (
              <div style={{
                marginTop: "1rem",
                paddingTop: "1rem",
                borderTop: `1px solid ${theme.border}`,
              }}>
                {JSON.parse(content.options || "{}") && Object.entries(JSON.parse(content.options || "{}")).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: "0.5rem" }}>
                    <strong>{key}:</strong> {value}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {!showAnswer ? (
        <button
          onClick={() => setShowAnswer(true)}
          style={{
            width: "100%",
            padding: isMobile ? "1rem" : "1.25rem",
            backgroundColor: "#722ed1",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: isMobile ? "1rem" : "1.1rem",
            fontWeight: "600",
            marginBottom: "1rem",
          }}
        >
          {lang === "cn" ? "显示答案" : lang === "en" ? "Show Answer" : "顯示答案"}
        </button>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "0.75rem",
        }}>
          <button
            onClick={() => handleRating("again")}
            disabled={submitting}
            style={{
              padding: isMobile ? "1rem 0.5rem" : "1.25rem",
              backgroundColor: "#ff4d4f",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: isMobile ? "0.9rem" : "1rem",
              fontWeight: "600",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {lang === "cn" ? "重来" : lang === "en" ? "Again" : "重來"}
          </button>
          <button
            onClick={() => handleRating("good")}
            disabled={submitting}
            style={{
              padding: isMobile ? "1rem 0.5rem" : "1.25rem",
              backgroundColor: "#52c41a",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: isMobile ? "0.9rem" : "1rem",
              fontWeight: "600",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {lang === "cn" ? "良好" : lang === "en" ? "Good" : "良好"}
          </button>
          <button
            onClick={() => handleRating("easy")}
            disabled={submitting}
            style={{
              padding: isMobile ? "1rem 0.5rem" : "1.25rem",
              backgroundColor: "#1890ff",
              color: "white",
              border: "none",
              borderRadius: "12px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: isMobile ? "0.9rem" : "1rem",
              fontWeight: "600",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {lang === "cn" ? "简单" : lang === "en" ? "Easy" : "簡單"}
          </button>
        </div>
      )}
      </div>
    </>
  );
}

export default FlashcardPage;
