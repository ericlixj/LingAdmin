// PracticePage.jsx
import { useState, useEffect, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// 解析题干中的图片 URL - 格式: [IMAGE:url]
// 不再需要从 stem 中解析图片，直接使用 image_url 字段

// 解析选项 JSON
const DEFAULT_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const parseOptions = (optionsStr) => {
  if (!optionsStr) return [];
  try {
    const parsed = JSON.parse(optionsStr);
    // 对象格式: {"A": "选项A", "B": "选项B", ...}
    if (typeof parsed === "object" && !Array.isArray(parsed) && parsed !== null) {
      return Object.entries(parsed).map(([key, value]) => ({
        label: key,
        value: String(value),
      }));
    }
    // 数组格式
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

// 解析答案
const parseAnswer = (answerStr) => {
  if (!answerStr) return [];
  try {
    const parsed = JSON.parse(answerStr);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
    return [String(parsed)];
  } catch {
    return [answerStr];
  }
};

// 随机打乱数组
// shuffleArray 函数已移到后端，不再需要

// 重要性颜色映射
const IMPORTANCE_COLOR = {
  high: "red",
  medium: "orange",
  low: "blue",
};

// 来源类型图标
const SOURCE_TYPE_ICON = {
  pdf: "📄",
  book: "📚",
  video: "🎬",
  web: "🌐",
};

function PracticePage({ sessionId, practiceMode = "all", lang, onBack }) {
  const [currentItem, setCurrentItem] = useState(null); // 当前题目的item信息
  const [currentQuestion, setCurrentQuestion] = useState(null); // 当前题目的详细信息
  const [currentIndex, setCurrentIndex] = useState(0); // 当前题目索引（从1开始显示）
  const [totalCount, setTotalCount] = useState(0); // 题目总数
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [practiceStarted, setPracticeStarted] = useState(false); // 是否已开始练习

  // 初始化：开始练习
  useEffect(() => {
    startPractice();
  }, [sessionId, practiceMode]);

  // 开始练习：初始化练习会话
  const startPractice = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      const response = await fetch(`${API_URL}/api/c/study/sessions/${sessionId}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: practiceMode // "all" 或 "wrong"
        }),
      });

      const result = await response.json();
      
      if (!response.ok || result.code !== 0) {
        // 如果是错题模式但没有错题，显示友好提示并返回
        if (practiceMode === "wrong" && (result.message && result.message.includes("没有错题") || result.code === 1)) {
          alert(lang === "cn" ? "该学习记录中没有错题" : lang === "en" ? "No wrong questions in this session" : "該學習記錄中沒有錯題");
          onBack();
          return;
        }
        // 如果是全部模式但没有题目
        if (practiceMode === "all" && (result.message && result.message.includes("没有题目") || result.code === 1)) {
          alert(lang === "cn" ? "该学习记录中没有题目" : lang === "en" ? "No questions in this session" : "該學習記錄中沒有題目");
          onBack();
          return;
        }
        throw new Error(result.message || `开始练习失败: ${response.status}`);
      }

      console.log('✅ 练习已开始:', result.data);
      setTotalCount(result.data.totalCount);
      setPracticeStarted(true);
      // 获取第一题
      await fetchNextQuestion();
    } catch (err) {
      console.error("❌ 开始练习失败:", err);
      setError("开始练习失败: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  // 获取下一题
  const fetchNextQuestion = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      const response = await fetch(`${API_URL}/api/c/study/sessions/${sessionId}/next?mode=${practiceMode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`获取题目失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        if (result.data.finished) {
          // 练习完成
          alert(lang === "cn" ? "练习完成！" : lang === "en" ? "Practice completed!" : "練習完成！");
          onBack();
          return;
        }
        
        console.log('✅ 获取题目成功:', result.data);
        setCurrentItem({ id: result.data.itemId });
        setCurrentQuestion(result.data.question);
        setCurrentIndex(result.data.currentIndex);
        setTotalCount(result.data.totalCount);
        // 重置状态
        setStartTime(Date.now());
        setSelectedAnswer(null);
        setSubmitted(false);
      } else {
        throw new Error(result.message || "获取题目失败");
      }
    } catch (err) {
      console.error("❌ 获取题目失败:", err);
      setError("获取题目失败: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  // 调试：检查状态（开发环境）- 必须在所有早期返回之前
  useEffect(() => {
    if (submitted && process.env.NODE_ENV === 'development') {
      console.log('🔍 提交后状态检查:', {
        submitted,
        showResult: submitted,
        isCorrect: currentItem ? (Number(currentItem.is_correct) === 1) : false,
        hasQuestion: !!currentQuestion,
        currentIndex,
        currentItem: currentItem ? { 
          id: currentItem.id, 
          is_correct: currentItem.is_correct
        } : null
      });
    }
  }, [submitted, currentQuestion, currentIndex, currentItem]);


  const handleSubmit = async () => {
    if (!selectedAnswer || submitted) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      // 计算耗时（秒），确保是正整数
      const timeSpent = startTime ? Math.max(0, Math.floor((Date.now() - startTime) / 1000)) : 0;

      // currentItem 已经在 state 中
      const response = await fetch(
        `${API_URL}/api/c/study/sessions/${sessionId}/items/${currentItem.id}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answer: selectedAnswer, // 用户选择的答案
            timeSpent: timeSpent, // 耗时（秒）
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`提交答案失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        // 更新当前item的状态
        setCurrentItem({
          ...currentItem,
          is_correct: result.data.is_correct,
          response: result.data.response,
          time_spent_second: result.data.time_spent_second,
        });
        
        setSubmitting(false);
        setSubmitted(true);
        
        console.log('✅ 答案已提交并保存:', {
          is_correct: result.data.is_correct,
          response: result.data.response,
          time_spent_second: result.data.time_spent_second,
          updater: result.data.updater
        });
      } else {
        throw new Error(result.message || "提交答案失败");
      }
    } catch (err) {
      console.error("提交答案失败:", err);
      alert("提交答案失败: " + String(err));
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      // 通知后端移动到下一题
      const response = await fetch(`${API_URL}/api/c/study/sessions/${sessionId}/next`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: practiceMode
        }),
      });

      if (!response.ok) {
        throw new Error(`移动到下一题失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        if (result.data.finished) {
          // 练习完成
          alert(lang === "cn" ? "练习完成！" : lang === "en" ? "Practice completed!" : "練習完成！");
          onBack();
        } else {
          // 获取下一题
          await fetchNextQuestion();
        }
      } else {
        throw new Error(result.message || "移动到下一题失败");
      }
    } catch (err) {
      console.error("移动到下一题失败:", err);
      alert("移动到下一题失败: " + String(err));
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
      <div>
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
        <button
          onClick={onBack}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {lang === "cn" ? "返回" : lang === "en" ? "Back" : "返回"}
        </button>
      </div>
    );
  }

  if (!practiceStarted || !currentQuestion) {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>{lang === "cn" ? "加载中..." : lang === "en" ? "Loading..." : "載入中..."}</p>
        </div>
      );
    }
    if (error) {
      return (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ color: "#ff4d4f" }}>{error}</p>
          <button
            onClick={onBack}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {lang === "cn" ? "返回" : lang === "en" ? "Back" : "返回"}
          </button>
        </div>
      );
    }
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p>{lang === "cn" ? "准备中..." : lang === "en" ? "Preparing..." : "準備中..."}</p>
      </div>
    );
  }

  const options = parseOptions(currentQuestion.options);
  const correctAnswers = parseAnswer(currentQuestion.answer);
  const stemText = currentQuestion.stem || "";
  const stemImageUrl = currentQuestion.image_url || null;
  // 只有提交后才显示结果
  const showResult = submitted;
  // 提交后从当前item获取是否正确（确保是数字比较）
  const isCorrect = showResult && currentItem ? (Number(currentItem.is_correct) === 1) : false;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* 进度条 */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
            color: "#666",
          }}
        >
          <span>
            {lang === "cn" ? "进度:" : lang === "en" ? "Progress:" : "進度:"} {currentIndex} / {totalCount}
          </span>
          <button
            onClick={onBack}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            {lang === "cn" ? "返回列表" : lang === "en" ? "Back to List" : "返回列表"}
          </button>
        </div>
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#e0e0e0",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(currentIndex / totalCount) * 100}%`,
              height: "100%",
              backgroundColor: "#ff6b35",
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {/* 题目卡片 */}
      {currentQuestion ? (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "1.5rem",
            backgroundColor: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            marginBottom: "1.5rem",
          }}
        >
          {/* 题干 */}
          <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.2rem" }}>
            {stemText}
          </h3>

          {/* 题干图片 */}
          {stemImageUrl && (
            <div style={{ marginBottom: "1rem" }}>
              <img
                src={stemImageUrl}
                alt="题目图片"
                style={{
                  maxWidth: "100%",
                  maxHeight: 300,
                  borderRadius: 8,
                  border: "1px solid #d9d9d9",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          )}

          {/* 选项 */}
          <div style={{ marginBottom: "1.5rem" }}>
            {options.map((option, index) => {
              const isSelected = selectedAnswer === option.label || (Array.isArray(selectedAnswer) && selectedAnswer.includes(option.label));
              const isCorrectOption = correctAnswers.includes(option.label) || correctAnswers.includes(option.label.toLowerCase());

              let optionStyle = {
                padding: "12px 16px",
                marginBottom: 8,
                borderRadius: 8,
                border: "1px solid #d9d9d9",
                backgroundColor: "#fff",
                cursor: showResult ? "default" : "pointer",
                display: "flex",
                alignItems: "flex-start",
                transition: "all 0.2s",
              };

              // 只有提交后才显示正确答案和错误答案的标记
              if (showResult) {
                if (isCorrectOption) {
                  // 正确答案：绿色边框和背景
                  optionStyle.border = "2px solid #52c41a";
                  optionStyle.backgroundColor = "#f6ffed";
                }
                if (isSelected && !isCorrectOption) {
                  // 选错了：红色边框和背景
                  optionStyle.border = "2px solid #ff4d4f";
                  optionStyle.backgroundColor = "#fff1f0";
                }
              } else if (isSelected) {
                // 未提交时，只显示选中状态：蓝色边框
                optionStyle.border = "2px solid #1890ff";
                optionStyle.backgroundColor = "#e6f7ff";
              }

              return (
                <div
                  key={index}
                  style={optionStyle}
                  onClick={() => {
                    // 只有未提交且未作答时才能选择
                    if (!showResult) {
                      setSelectedAnswer(option.label);
                    }
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      minWidth: 24,
                      height: 24,
                      lineHeight: "24px",
                      textAlign: "center",
                      borderRadius: "50%",
                      backgroundColor: showResult
                        ? isCorrectOption
                          ? "#52c41a"
                          : isSelected
                          ? "#ff4d4f"
                          : "#d9d9d9"
                        : isSelected
                        ? "#1890ff"
                        : "#d9d9d9",
                      color: "white",
                      marginRight: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {option.label}
                  </span>
                  <span style={{ flex: 1 }}>{option.value}</span>
                  {showResult && isCorrectOption && (
                    <span style={{ color: "#52c41a", fontSize: "18px", marginLeft: "8px" }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 提交按钮 - 只有未提交时显示 */}
          {!showResult && (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer || submitting}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: selectedAnswer && !submitting ? "#ff6b35" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: selectedAnswer && !submitting ? "pointer" : "not-allowed",
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              {submitting
                ? lang === "cn"
                  ? "提交中..."
                  : lang === "en"
                  ? "Submitting..."
                  : "提交中..."
                : lang === "cn"
                ? "提交答案"
                : lang === "en"
                ? "Submit Answer"
                : "提交答案"}
            </button>
          )}

          {/* 下一题/完成练习按钮 - 提交后显示，位置与提交按钮一致 */}
          {showResult && (
            <button
              onClick={handleNext}
              style={{
                width: "100%",
                padding: "0.75rem",
                backgroundColor: "#ff6b35",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              {currentIndex < totalCount
                ? lang === "cn"
                  ? "下一题"
                  : lang === "en"
                  ? "Next Question"
                  : "下一題"
                : lang === "cn"
                ? "完成练习"
                : lang === "en"
                ? "Finish Practice"
                : "完成練習"}
            </button>
          )}

          {/* 结果显示 - 提交后显示所有题目详情（按钮下方） */}
          {showResult && currentQuestion && (
            <div style={{ marginTop: "1.5rem" }}>
              <>
              {/* 1. 答案比对结果 - 正确/错误提示 */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  backgroundColor: isCorrect ? "#f6ffed" : "#fff1f0",
                  border: `1px solid ${isCorrect ? "#52c41a" : "#ff4d4f"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: isCorrect ? "#52c41a" : "#ff4d4f",
                    marginBottom: "0.5rem",
                  }}
                >
                  {isCorrect
                    ? lang === "cn"
                      ? "✓ 回答正确"
                      : lang === "en"
                      ? "✓ Correct"
                      : "✓ 回答正確"
                    : lang === "cn"
                    ? "✗ 回答错误"
                    : lang === "en"
                    ? "✗ Incorrect"
                    : "✗ 回答錯誤"}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>
                  {lang === "cn" ? "正确答案:" : lang === "en" ? "Correct Answer:" : "正確答案:"}{" "}
                  {correctAnswers.join(", ")}
                </div>
              </div>

              {/* 4. 题目详细解析 - 官方解释和通俗解释 */}
              {(currentQuestion.explanation_raw || currentQuestion.explanation_human) && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#f0f7ff",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    border: "1px solid #91d5ff",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                    {lang === "cn" ? "解析:" : lang === "en" ? "Explanation:" : "解析:"}
                  </div>
                  {currentQuestion.explanation_raw && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.25rem" }}>
                        {lang === "cn" ? "官方解释:" : lang === "en" ? "Official:" : "官方解釋:"}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{currentQuestion.explanation_raw}</div>
                    </div>
                  )}
                  {currentQuestion.explanation_human && (
                    <div>
                      <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.25rem" }}>
                        {lang === "cn" ? "通俗解释:" : lang === "en" ? "Simple:" : "通俗解釋:"}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{currentQuestion.explanation_human}</div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. 题目详细解析 - 关联知识点及来源 */}
              {currentQuestion.knowledge_nodes && currentQuestion.knowledge_nodes.length > 0 && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: "#fffbe6",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    border: "1px solid #ffe58f",
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
                    {lang === "cn" ? "关联知识点:" : lang === "en" ? "Related Knowledge:" : "關聯知識點:"}
                  </div>
                  {currentQuestion.knowledge_nodes.map((kn, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: idx < currentQuestion.knowledge_nodes.length - 1 ? "0.75rem" : 0,
                        paddingBottom: idx < currentQuestion.knowledge_nodes.length - 1 ? "0.75rem" : 0,
                        borderBottom:
                          idx < currentQuestion.knowledge_nodes.length - 1 ? "1px solid #e0e0e0" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            backgroundColor:
                              IMPORTANCE_COLOR[kn.importance] === "red"
                                ? "#ffccc7"
                                : IMPORTANCE_COLOR[kn.importance] === "orange"
                                ? "#ffe7ba"
                                : "#d4edda",
                            color:
                              IMPORTANCE_COLOR[kn.importance] === "red"
                                ? "#a8071a"
                                : IMPORTANCE_COLOR[kn.importance] === "orange"
                                ? "#ad6800"
                                : "#135200",
                            marginRight: "8px",
                          }}
                        >
                          {kn.importance === "high"
                            ? lang === "cn"
                              ? "高"
                              : lang === "en"
                              ? "High"
                              : "高"
                            : kn.importance === "medium"
                            ? lang === "cn"
                              ? "中"
                              : lang === "en"
                              ? "Medium"
                              : "中"
                            : lang === "cn"
                            ? "低"
                            : lang === "en"
                            ? "Low"
                            : "低"}
                        </span>
                        <span style={{ fontWeight: "bold" }}>{kn.title}</span>
                      </div>
                      {kn.description && (
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "#666",
                            marginTop: "0.25rem",
                            marginLeft: "60px",
                          }}
                        >
                          {kn.description}
                        </div>
                      )}
                      {kn.sources && kn.sources.length > 0 && (
                        <div style={{ fontSize: "0.8rem", color: "#999", marginTop: "0.25rem", marginLeft: "60px" }}>
                          {kn.sources.map((source, sIdx) => (
                            <div key={sIdx} style={{ marginTop: "0.25rem" }}>
                              {source.source && (
                                <span>
                                  {SOURCE_TYPE_ICON[source.source.type] || "📄"} {source.source.title}
                                  {source.source.version && ` v${source.source.version}`}
                                </span>
                              )}
                              <span style={{ marginLeft: "4px" }}>
                                {source.chapter}
                                {source.section && ` › ${source.section}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              </>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>{lang === "cn" ? "加载题目中..." : lang === "en" ? "Loading question..." : "載入題目中..."}</p>
        </div>
      )}
    </div>
  );
}

export default PracticePage;
