// PracticePage.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { getProxyImageUrl } from "./utils/imageProxy";
import { parseAnswer, normalizeUserAnswer, compareAnswers, isCorrectOption } from "./utils/answerValidator";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// 音效播放函数
const playSound = (type) => {
  try {
    // 使用 Web Audio API 生成音效
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (type === 'correct') {
      // 答对音效：上升音调
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else if (type === 'wrong') {
      // 答错音效：下降音调
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime); // G4
      oscillator.frequency.setValueAtTime(311.13, audioContext.currentTime + 0.15); // D#4
      oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime + 0.3); // C4
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      oscillator.type = 'sawtooth';
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    }
  } catch (error) {
    // 如果 Web Audio API 不可用，静默失败
    console.log('Audio not available:', error);
  }
};

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
// 解析答案 - 支持多种格式：
// 1. 对象格式: {"correct": ["A"]} 或 {"correct": ["A", "B"]}
// 2. 数组格式: ["A"] 或 ["A", "B"]
// 3. 字符串格式: "A"
// parseAnswer 函数已移至 utils/answerValidator.js，使用统一的验证逻辑

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
    
    // 现代浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // 旧版浏览器兼容
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

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
  const [learningItemId, setLearningItemId] = useState(null); // 当前题目的 learning_item_id
  const [isFavoriting, setIsFavoriting] = useState(false); // 收藏操作中
  const [note, setNote] = useState(""); // 用户笔记
  const [isEditingNote, setIsEditingNote] = useState(false); // 是否正在编辑笔记
  const [editingNote, setEditingNote] = useState(""); // 正在编辑的笔记内容
  const [savingNote, setSavingNote] = useState(false); // 是否正在保存笔记
  const [sessionMode, setSessionMode] = useState(null); // session的模式，用于判断是否显示笔记
  const [isHandlingFinished, setIsHandlingFinished] = useState(false); // 是否正在处理完成状态，防止重复弹出
  const [userRejectedRestart, setUserRejectedRestart] = useState(false); // 用户是否拒绝了重新开始
  const [finishedHandled, setFinishedHandled] = useState(false); // 完成状态是否已被处理（无论用户选择是或否）
  const finishedHandledRef = useRef(false); // 使用 ref 来同步检查，防止竞态条件
  const fetchingRef = useRef(false); // 防止 fetchNextQuestion 被并发调用
  const [showAnimation, setShowAnimation] = useState(false); // 控制动画显示
  const [animationType, setAnimationType] = useState(null); // 动画类型：'correct' 或 'wrong'

  // 获取session信息，检查是否是考试模式
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
            setSessionMode(result.data.mode || null);
          }
        }
      } catch (err) {
        console.error("获取session信息失败:", err);
      }
    };
    
    fetchSessionInfo();
  }, [sessionId]);

  // 初始化：开始练习
  // 注意：当 sessionId 或 practiceMode 变化时，会重新初始化练习会话
  // 错题模式每次进入都会从第一题开始，按顺序显示（不打乱）
  useEffect(() => {
    let isMounted = true;
    // 重置完成状态处理标志和拒绝标志
    setIsHandlingFinished(false);
    setUserRejectedRestart(false);
    setFinishedHandled(false);
    finishedHandledRef.current = false; // 重置 ref
    fetchingRef.current = false; // 重置获取标志
    const initPractice = async () => {
      if (isMounted) {
        await startPractice();
      }
    };
    initPractice();
    return () => {
      isMounted = false;
      setIsHandlingFinished(false);
      setUserRejectedRestart(false);
      setFinishedHandled(false);
      finishedHandledRef.current = false; // 重置 ref
      fetchingRef.current = false; // 重置获取标志
    };
  }, [sessionId, practiceMode]);

  // 开始练习：初始化练习会话
  // 错题模式：按顺序显示，每次进入从第一题开始
  // 全部模式：按顺序显示，支持进度保存
  // 收藏模式：打乱顺序显示
  const startPractice = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      // 错题模式每次进入都重新初始化，确保从第一题开始
      const response = await fetch(`${API_URL}/api/c/study/sessions/${sessionId}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: practiceMode // "all"、"wrong" 或 "favorite"
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
        // 如果是收藏模式但没有收藏题目，显示友好提示并返回
        if (practiceMode === "favorite" && (result.message && result.message.includes("没有收藏题目") || result.code === 1)) {
          alert(lang === "cn" ? "该学习记录中没有收藏题目" : lang === "en" ? "No favorite questions in this session" : "該學習記錄中沒有收藏題目");
          onBack();
          return;
        }
        // 如果是全部模式但没有题目
        if (practiceMode === "all" && (result.message && result.message.includes("没有题目") || result.code === 1)) {
          alert(lang === "cn" ? "该学习记录中没有题目" : lang === "en" ? "No questions in this session" : "該學習記錄中沒有題目");
          onBack();
          return;
        }
        // 如果是模式不匹配的错误，显示友好提示并返回
        if (result.message && (result.message.includes("练习模式") || result.message.includes("考试模式"))) {
          alert(result.message);
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
  // 错题模式：按顺序获取下一题（不打乱）
  // 全部模式：按顺序获取下一题，支持进度保存
  // 收藏模式：按打乱后的顺序获取下一题
  const fetchNextQuestion = async () => {
    // 防止并发调用：如果正在获取题目，直接返回
    if (fetchingRef.current) {
      console.log('⚠️ [fetchNextQuestion] 正在获取题目，跳过重复调用');
      return;
    }
    
    // 如果完成状态已经被处理过，直接返回，不再调用 API
    if (finishedHandledRef.current) {
      console.log('⚠️ [fetchNextQuestion] 完成状态已处理过（ref检查），跳过 API 调用');
      return;
    }
    
    // 标记正在获取题目
    fetchingRef.current = true;
    
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
          console.log('🔍 [fetchNextQuestion] 检测到 finished=true, practiceMode=', practiceMode, 'finishedHandledRef.current=', finishedHandledRef.current, 'finishedHandled=', finishedHandled);
          
          // 使用 ref 同步检查，防止竞态条件（React 状态更新是异步的）
          if (finishedHandledRef.current) {
            console.log('⚠️ 完成状态已处理过（ref检查），直接返回');
            onBack();
            return;
          }
          
          // 如果完成状态已经被处理过（无论用户选择是或否），直接返回，不再弹出 confirm 框
          if (finishedHandled) {
            console.log('⚠️ 完成状态已处理过，直接返回');
            onBack();
            return;
          }
          
          // 如果用户已经拒绝了重新开始，直接返回，不再弹出 confirm 框
          if (userRejectedRestart) {
            console.log('⚠️ 用户已拒绝重新开始，直接返回');
            onBack();
            return;
          }
          
          // 防止重复弹出 confirm 框
          if (isHandlingFinished) {
            console.log('⚠️ 正在处理完成状态，跳过重复弹出');
            return;
          }
          
          // 立即设置 ref 和状态，防止重复调用（在弹出 confirm 之前就设置）
          finishedHandledRef.current = true; // 立即设置 ref（同步操作）
          setIsHandlingFinished(true);
          setFinishedHandled(true); // 标记完成状态正在被处理
          
          console.log('✅ [fetchNextQuestion] 准备弹出 confirm 框, practiceMode=', practiceMode);
          
          // 练习完成，询问是否重新开始（仅对全部模式）
          if (practiceMode === "all") {
            const confirmMessage = lang === "cn" 
              ? "练习完成，是否重新开始？" 
              : lang === "en" 
              ? "Practice completed! Do you want to start over?" 
              : "練習完成，是否重新開始？";
            
            console.log('🔔 [fetchNextQuestion] 弹出 confirm 框:', confirmMessage);
            const userChoice = window.confirm(confirmMessage);
            console.log('🔔 [fetchNextQuestion] 用户选择:', userChoice);
            
            // 无论用户选择什么，都立即标记为已处理，防止重复弹出
            // 必须在调用 onBack() 之前设置，确保后续的 fetchNextQuestion 调用会被阻止
            // 注意：ref 已经在弹出 confirm 之前就设置了，这里再次确认
            finishedHandledRef.current = true; // 再次确认 ref 已设置（同步操作）
            setIsHandlingFinished(false);
            setFinishedHandled(true); // 标记完成状态已被处理
            
            if (userChoice) {
              // 用户选择"是"：重置进度，然后重新开始练习（不返回，继续在当前页面）
              try {
                setLoading(true); // 显示加载状态
                
                // 先重置所有相关状态，确保能正常重新开始
                finishedHandledRef.current = false;
                setFinishedHandled(false);
                setIsHandlingFinished(false);
                setUserRejectedRestart(false);
                fetchingRef.current = false; // 重置获取标志，允许重新获取题目
                
                // 重置进度
                const resetResponse = await fetch(`${API_URL}/api/c/study/sessions/${sessionId}/reset-progress?mode=${practiceMode}`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                });
                
                const resetResult = await resetResponse.json();
                if (resetResult.code !== 0) {
                  throw new Error(resetResult.message || '重置进度失败');
                }
                
                console.log('✅ 进度已重置，重新开始练习');
                
                // 重新初始化会话（调用 /start API）
                const startResponse = await fetch(`${API_URL}/api/c/study/sessions/${sessionId}/start`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    mode: practiceMode
                  }),
                });
                
                const startResult = await startResponse.json();
                if (!startResponse.ok || startResult.code !== 0) {
                  throw new Error(startResult.message || '重新初始化会话失败');
                }
                
                console.log('✅ 会话已重新初始化:', startResult.data);
                
                // 重置所有状态，准备显示第一题
                setTotalCount(startResult.data.totalCount);
                setPracticeStarted(true);
                setCurrentQuestion(null); // 清空当前题目，确保重新加载
                setCurrentItem(null);
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setSubmitted(false);
                setNote("");
                setIsEditingNote(false);
                setEditingNote("");
                
                // 确保 ref 和状态都已重置，然后获取第一题
                finishedHandledRef.current = false;
                setFinishedHandled(false);
                fetchingRef.current = false;
                
                // 重新获取第一题（不通过fetchNextQuestion，直接调用API避免检查）
                const nextResponse = await fetch(`${API_URL}/api/c/study/sessions/${sessionId}/next?mode=${practiceMode}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
                
                if (!nextResponse.ok) {
                  throw new Error(`获取题目失败: ${nextResponse.status}`);
                }
                
                const nextResult = await nextResponse.json();
                if (nextResult.code === 0 && !nextResult.data.finished) {
                  // 成功获取题目，更新状态
                  console.log('✅ 获取第一题成功:', nextResult.data);
                  setCurrentItem({ id: nextResult.data.itemId });
                  setCurrentQuestion(nextResult.data.question);
                  setCurrentIndex(nextResult.data.currentIndex);
                  setTotalCount(nextResult.data.totalCount);
                  setLearningItemId(nextResult.data.learningItemId);
                  const savedNote = nextResult.data.question.note || "";
                  setNote(savedNote);
                  setIsEditingNote(false);
                  setEditingNote("");
                  setStartTime(Date.now());
                  setSelectedAnswer(null);
                  setSubmitted(false);
                  setLoading(false); // 隐藏加载状态
                } else {
                  throw new Error(nextResult.message || "获取题目失败");
                }
              } catch (err) {
                console.error("重新开始失败:", err);
                // 确保 ref 已设置
                finishedHandledRef.current = true;
                setLoading(false);
                alert(lang === "cn" ? "重新开始失败: " + String(err) : lang === "en" ? "Failed to restart: " + String(err) : "重新開始失敗: " + String(err));
                onBack();
              }
            } else {
              // 用户选择"否"：保持当前状态，返回学习记录列表
              console.log('⚠️ 用户选择保持当前状态，返回学习记录列表');
              // 立即设置 ref，防止任何后续的 fetchNextQuestion 调用
              finishedHandledRef.current = true;
              setUserRejectedRestart(true);
              setFinishedHandled(true);
              // 使用 setTimeout 确保 ref 设置后再调用 onBack，避免竞态条件
              setTimeout(() => {
                onBack();
              }, 0);
            }
            return; // 立即返回，不执行后续代码
          } else {
            // 错题或收藏模式，直接返回
            setIsHandlingFinished(false);
            setFinishedHandled(true); // 标记完成状态已被处理
            alert(lang === "cn" ? "练习完成！" : lang === "en" ? "Practice completed!" : "練習完成！");
            onBack();
          }
          return;
        }
        
        // 如果获取到题目，重置完成状态处理标志和拒绝标志
        setIsHandlingFinished(false);
        setUserRejectedRestart(false);
        setFinishedHandled(false); // 重置完成状态处理标志
        finishedHandledRef.current = false; // 重置 ref
        
        console.log('✅ 获取题目成功:', result.data);
        setCurrentItem({ id: result.data.itemId });
        setCurrentQuestion(result.data.question);
        setCurrentIndex(result.data.currentIndex);
        setTotalCount(result.data.totalCount);
        setLearningItemId(result.data.learningItemId);
        // 设置笔记（如果有）
        const savedNote = result.data.question.note || "";
        setNote(savedNote);
        setIsEditingNote(false); // 重置编辑状态
        setEditingNote(""); // 清空编辑内容
        // 重置状态
        setStartTime(Date.now());
        setSelectedAnswer(null);
        setSubmitted(false);
        setShowAnimation(false); // 重置动画状态
        setAnimationType(null); // 重置动画类型
      } else {
        throw new Error(result.message || "获取题目失败");
      }
    } catch (err) {
      console.error("❌ 获取题目失败:", err);
      // 如果完成状态已经被处理过，不再设置错误信息
      if (!finishedHandledRef.current) {
        setError("获取题目失败: " + String(err));
      }
    } finally {
      // 重置获取标志
      fetchingRef.current = false;
      // 如果完成状态已经被处理过，不再设置 loading 状态
      if (!finishedHandledRef.current) {
        setLoading(false);
      }
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

  // 调试：打印图片URL信息 - 必须在所有早期返回之前
  useEffect(() => {
    if (currentQuestion?.image_url) {
      console.log('[PracticePage] 原始图片URL:', currentQuestion.image_url);
      console.log('[PracticePage] 代理后URL:', getProxyImageUrl(currentQuestion.image_url));
    }
  }, [currentQuestion?.image_url]);


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
        // 更新当前item的状态（完全依赖后端返回的数据）
        const isCorrect = Number(result.data.is_correct) === 1;
        
        setCurrentItem({
          ...currentItem,
          is_correct: result.data.is_correct,
          response: result.data.response,
          time_spent_second: result.data.time_spent_second,
          correct_answers: result.data.correct_answers || [], // 后端返回的正确答案列表
        });
        
        setSubmitting(false);
        setSubmitted(true);
        
        // 触发动画和音效
        setAnimationType(isCorrect ? 'correct' : 'wrong');
        setShowAnimation(true);
        playSound(isCorrect ? 'correct' : 'wrong');
        
        // 3秒后隐藏动画
        setTimeout(() => {
          setShowAnimation(false);
        }, 2000);
        
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

  // 收藏/取消收藏题目
  const handleToggleFavorite = async () => {
    if (!learningItemId || isFavoriting) {
      return;
    }

    setIsFavoriting(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      const newFavoriteStatus = !currentQuestion.is_favorited;
      const response = await fetch(
        `${API_URL}/api/c/study/learning-items/${learningItemId}/favorite`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_favorited: newFavoriteStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`收藏操作失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        // 更新当前题目的收藏状态
        setCurrentQuestion({
          ...currentQuestion,
          is_favorited: result.data.is_favorited,
        });
        console.log('✅ 收藏状态已更新:', result.data);
      } else {
        throw new Error(result.message || "收藏操作失败");
      }
    } catch (err) {
      console.error("收藏操作失败:", err);
      alert("收藏操作失败: " + String(err));
    } finally {
      setIsFavoriting(false);
    }
  };

  // 保存笔记（不推进索引）
  const handleSaveNote = async () => {
    if (!currentItem?.id || savingNote) {
      return;
    }

    setSavingNote(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      // 使用专门的保存笔记接口，不会推进索引
      const response = await fetch(`${API_URL}/api/c/study/sessions/${sessionId}/items/${currentItem.id}/note`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: editingNote || "",
        }),
      });

      if (!response.ok) {
        throw new Error(`保存笔记失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        // 更新笔记状态
        setNote(editingNote);
        setIsEditingNote(false);
        console.log('✅ 笔记已保存');
      } else {
        throw new Error(result.message || "保存笔记失败");
      }
    } catch (err) {
      console.error("保存笔记失败:", err);
      alert("保存笔记失败: " + String(err));
    } finally {
      setSavingNote(false);
    }
  };

  // 切换笔记编辑状态
  const handleToggleNote = () => {
    if (isEditingNote) {
      // 如果正在编辑，关闭编辑区域
      setIsEditingNote(false);
      setEditingNote("");
    } else {
      // 如果未编辑，打开编辑区域并加载当前笔记
      setEditingNote(note);
      setIsEditingNote(true);
    }
  };

  // 取消编辑笔记
  const handleCancelEditNote = () => {
    setEditingNote("");
    setIsEditingNote(false);
  };

  // 删除笔记（不推进索引）
  const handleDeleteNote = async () => {
    if (!currentItem?.id || savingNote) {
      return;
    }

    // 确认删除
    if (!confirm(lang === "cn" ? "确定要删除笔记吗？" : lang === "en" ? "Are you sure you want to delete this note?" : "確定要刪除筆記嗎？")) {
      return;
    }

    setSavingNote(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      // 使用专门的保存笔记接口，传递空字符串来删除笔记，不会推进索引
      const response = await fetch(`${API_URL}/api/c/study/sessions/${sessionId}/items/${currentItem.id}/note`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: "", // 清空笔记
        }),
      });

      if (!response.ok) {
        throw new Error(`删除笔记失败: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        // 更新笔记状态为空
        setNote("");
        setEditingNote("");
        setIsEditingNote(false);
        console.log('✅ 笔记已删除');
      } else {
        throw new Error(result.message || "删除笔记失败");
      }
    } catch (err) {
      console.error("删除笔记失败:", err);
      alert("删除笔记失败: " + String(err));
    } finally {
      setSavingNote(false);
    }
  };

  const handleNext = async () => {
    try {
      // 答案已经在 handleSubmit 时通过 /submit 接口保存了
      // 笔记可以通过 handleSaveNote 单独保存
      // 这里只需要调用 GET /next 获取下一题即可（后端会自动推进索引）
      await fetchNextQuestion();
    } catch (err) {
      console.error("移动到下一题失败:", err);
      alert("移动到下一题失败: " + String(err));
    }
  };

  // 动画组件
  const AnswerAnimation = ({ type, show }) => {
    if (!show) return null;
    
    const isCorrect = type === 'correct';
    
    return (
      <>
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            pointerEvents: 'none',
            animation: isCorrect ? 'correctPulse 0.6s ease-out' : 'wrongShake 0.6s ease-out',
          }}
        >
          <div
            style={{
              fontSize: '120px',
              color: isCorrect ? '#52c41a' : '#ff4d4f',
              textShadow: `0 0 20px ${isCorrect ? 'rgba(82, 196, 26, 0.5)' : 'rgba(255, 77, 79, 0.5)'}`,
              animation: isCorrect ? 'correctScale 0.6s ease-out' : 'wrongScale 0.6s ease-out',
            }}
          >
            {isCorrect ? '✓' : '✗'}
          </div>
          {isCorrect && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                border: `3px solid #52c41a`,
                animation: 'correctRipple 0.6s ease-out',
                opacity: 0,
              }}
            />
          )}
        </div>
        <style>{`
          @keyframes correctPulse {
            0% {
              transform: translate(-50%, -50%) scale(0);
              opacity: 0;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.2);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.9;
            }
          }
          @keyframes correctScale {
            0% {
              transform: scale(0) rotate(0deg);
            }
            50% {
              transform: scale(1.3) rotate(180deg);
            }
            100% {
              transform: scale(1) rotate(360deg);
            }
          }
          @keyframes correctRipple {
            0% {
              transform: translate(-50%, -50%) scale(0.8);
              opacity: 0.8;
            }
            100% {
              transform: translate(-50%, -50%) scale(2);
              opacity: 0;
            }
          }
          @keyframes wrongShake {
            0%, 100% {
              transform: translate(-50%, -50%) translateX(0);
            }
            10%, 30%, 50%, 70%, 90% {
              transform: translate(-50%, -50%) translateX(-10px);
            }
            20%, 40%, 60%, 80% {
              transform: translate(-50%, -50%) translateX(10px);
            }
          }
          @keyframes wrongScale {
            0% {
              transform: scale(0);
              opacity: 0;
            }
            50% {
              transform: scale(1.3);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 0.9;
            }
          }
          @keyframes resultFadeIn {
            0% {
              opacity: 0;
              transform: translateY(-10px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes optionCorrect {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.4);
            }
            50% {
              transform: scale(1.02);
              box-shadow: 0 0 0 8px rgba(82, 196, 26, 0);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
            }
          }
          @keyframes optionWrong {
            0% {
              transform: translateX(0);
            }
            10%, 30%, 50%, 70%, 90% {
              transform: translateX(-5px);
            }
            20%, 40%, 60%, 80% {
              transform: translateX(5px);
            }
            100% {
              transform: translateX(0);
            }
          }
        `}</style>
      </>
    );
  };

  // 主题颜色配置
  const theme = {
    bg: isDarkMode ? "#1a1a1a" : "#ffffff",
    cardBg: isDarkMode ? "#2d2d2d" : "#ffffff",
    text: isDarkMode ? "#e0e0e0" : "#333333",
    textSecondary: isDarkMode ? "#b0b0b0" : "#666666",
    border: isDarkMode ? "#404040" : "#ddd",
    borderLight: isDarkMode ? "#505050" : "#e0e0e0",
    progressBg: isDarkMode ? "#3a3a3a" : "#e0e0e0",
    optionBg: isDarkMode ? "#2d2d2d" : "#fff",
    optionSelectedBg: isDarkMode ? "#1e3a5f" : "#e6f7ff",
    optionSelectedBorder: isDarkMode ? "#4a9eff" : "#1890ff",
    correctBg: isDarkMode ? "#1a3a1a" : "#f6ffed",
    correctBorder: isDarkMode ? "#52c41a" : "#52c41a",
    wrongBg: isDarkMode ? "#3a1a1a" : "#fff1f0",
    wrongBorder: isDarkMode ? "#ff6b6b" : "#ff4d4f",
    explanationBg: isDarkMode ? "#1a2a3a" : "#f0f7ff",
    explanationBorder: isDarkMode ? "#4a6a9a" : "#91d5ff",
    knowledgeBg: isDarkMode ? "#2a2a1a" : "#fffbe6",
    knowledgeBorder: isDarkMode ? "#6a6a4a" : "#ffe58f",
    buttonDisabled: isDarkMode ? "#4a4a4a" : "#ccc",
    shadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 4px rgba(0,0,0,0.1)",
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", backgroundColor: theme.bg, color: theme.text, minHeight: "100vh" }}>
        <p>{lang === "cn" ? "加载中..." : lang === "en" ? "Loading..." : "載入中..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: theme.bg, minHeight: "100vh", padding: "1rem", color: theme.text }}>
        <div
          style={{
            padding: "1rem",
            backgroundColor: isDarkMode ? "#3a1a1a" : "#fee",
            border: `1px solid ${isDarkMode ? "#ff6b6b" : "#fcc"}`,
            borderRadius: "4px",
            marginBottom: "1rem",
            color: isDarkMode ? "#ff6b6b" : "#c00",
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
        <div style={{ textAlign: "center", padding: "2rem", backgroundColor: theme.bg, color: theme.text, minHeight: "100vh" }}>
          <p>{lang === "cn" ? "加载中..." : lang === "en" ? "Loading..." : "載入中..."}</p>
        </div>
      );
    }
    if (error) {
      return (
        <div style={{ textAlign: "center", padding: "2rem", backgroundColor: theme.bg, color: theme.text, minHeight: "100vh" }}>
          <p style={{ color: theme.wrongBorder }}>{error}</p>
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
      <div style={{ textAlign: "center", padding: "2rem", backgroundColor: theme.bg, color: theme.text, minHeight: "100vh" }}>
        <p>{lang === "cn" ? "准备中..." : lang === "en" ? "Preparing..." : "準備中..."}</p>
      </div>
    );
  }

  const options = parseOptions(currentQuestion.options);
  const stemText = currentQuestion.stem || "";
  const stemImageUrl = currentQuestion.image_url || null;
  
  // 解析正确答案（前后端使用相同的逻辑）
  const correctAnswers = parseAnswer(currentQuestion.answer);
  
  // 标准化用户答案（前后端使用相同的逻辑）
  const selectedAnswersArray = normalizeUserAnswer(selectedAnswer);
  
  // 前端验证（用于即时反馈，但最终结果以后端为准）
  const frontendIsCorrect = submitted && currentQuestion.answer 
    ? compareAnswers(selectedAnswer, currentQuestion.answer)
    : false;
  
  // 只有提交后才显示结果
  const showResult = submitted;
  
  // 优先使用后端返回的结果，如果没有则使用前端验证结果
  // 注意：后端验证是最终权威，前端验证仅用于即时反馈
  const isCorrect = showResult && currentItem 
    ? (Number(currentItem.is_correct) === 1) 
    : frontendIsCorrect;

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        position: 'relative',
      }}
    >
      {/* 答题动画 */}
      <AnswerAnimation type={animationType} show={showAnimation} />
      
      <div
        style={{
          padding: isMobile ? "12px" : "0 16px",
          paddingBottom: isMobile ? "80px" : "20px", // 为移动端底部按钮留出空间
          backgroundColor: theme.bg,
          minHeight: isMobile ? "-webkit-fill-available" : "100vh", // iOS Safari支持
          color: theme.text,
          WebkitOverflowScrolling: "touch", // iOS平滑滚动
          overflowX: "hidden", // 防止横向滚动
        }}
      >
      {/* 进度条 */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
            fontSize: isMobile ? "0.85rem" : "0.9rem",
            color: theme.textSecondary,
            flexWrap: "wrap",
            gap: 8,
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
            backgroundColor: theme.progressBg,
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
            border: `1px solid ${theme.border}`,
            borderRadius: "8px",
            padding: isMobile ? "1rem" : "1.5rem",
            backgroundColor: theme.cardBg,
            boxShadow: theme.shadow,
            marginBottom: "1.5rem",
          }}
        >
          {/* 题干 */}
          <div style={{ marginBottom: isMobile ? "0.75rem" : "1rem" }}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: 0,
                fontSize: isMobile ? "1.05rem" : "1.2rem",
                lineHeight: 1.45,
                wordBreak: "break-word",
              }}
            >
              {stemText}
            </h3>
          </div>

          {/* 操作按钮组 */}
          <div style={{ 
            display: "flex", 
            gap: isMobile ? "6px" : "8px", 
            marginBottom: isMobile ? "0.75rem" : "1rem",
            flexWrap: "wrap",
            justifyContent: isMobile ? "flex-start" : "flex-end",
          }}>
              {/* 笔记按钮 - 考试模式下不显示 */}
              {sessionMode !== "exam" && (
              <button
                onClick={handleToggleNote}
                style={{
                  padding: isMobile ? "6px 10px" : "8px 12px",
                  backgroundColor: isEditingNote ? (isDarkMode ? "#3a2a1a" : "#fff7e6") : "transparent",
                  border: `1px solid ${isEditingNote ? "#faad14" : theme.border}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: isMobile ? "0.8rem" : "0.9rem",
                  color: isEditingNote ? "#faad14" : theme.textSecondary,
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "3px" : "4px",
                  minWidth: "fit-content",
                  transition: "all 0.2s",
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                  userSelect: "none",
                }}
                onTouchStart={(e) => {
                  if (!isEditingNote) {
                    e.currentTarget.style.transform = "scale(0.95)";
                  }
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseEnter={(e) => {
                  if (!isEditingNote && !isMobile) {
                    e.currentTarget.style.backgroundColor = isDarkMode ? "#3a3a3a" : "#f5f5f5";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isEditingNote) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: isMobile ? "14px" : "16px" }}>
                  {isEditingNote ? "✕" : "📝"}
                </span>
                {!isMobile && (
                  <span>
                    {lang === "cn" ? "笔记" : lang === "en" ? "Note" : "筆記"}
                  </span>
                )}
              </button>
              )}
              {/* 收藏按钮 */}
              {learningItemId && (
                <button
                  onClick={handleToggleFavorite}
                  disabled={isFavoriting}
                  style={{
                    padding: isMobile ? "6px 10px" : "8px 12px",
                    backgroundColor: "transparent",
                    border: `1px solid ${currentQuestion.is_favorited ? "#ff6b35" : theme.border}`,
                    borderRadius: "6px",
                    cursor: isFavoriting ? "not-allowed" : "pointer",
                    fontSize: isMobile ? "0.8rem" : "0.9rem",
                    color: currentQuestion.is_favorited ? "#ff6b35" : theme.textSecondary,
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? "3px" : "4px",
                    minWidth: "fit-content",
                    transition: "all 0.2s",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                    userSelect: "none",
                  }}
                  onTouchStart={(e) => {
                    if (!isFavoriting) {
                      e.currentTarget.style.transform = "scale(0.95)";
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  onMouseEnter={(e) => {
                    if (!isFavoriting && !isMobile) {
                      e.currentTarget.style.backgroundColor = isDarkMode ? "#3a3a3a" : "#f5f5f5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span style={{ fontSize: isMobile ? "16px" : "18px" }}>
                    {currentQuestion.is_favorited ? "★" : "☆"}
                  </span>
                  {!isMobile && (
                    <span>
                      {currentQuestion.is_favorited
                        ? lang === "cn"
                          ? "已收藏"
                          : lang === "en"
                          ? "Favorited"
                          : "已收藏"
                        : lang === "cn"
                        ? "收藏"
                        : lang === "en"
                        ? "Favorite"
                        : "收藏"}
                    </span>
                  )}
                </button>
              )}
            </div>

          {/* 笔记编辑区域 - 考试模式下不显示 */}
          {sessionMode !== "exam" && isEditingNote && (
            <div
              style={{
                padding: isMobile ? "0.75rem" : "1rem",
                backgroundColor: theme.cardBg,
                borderRadius: "8px",
                marginBottom: "1rem",
                border: `1px solid ${theme.border}`,
                color: theme.text,
              }}
            >
              <div style={{ 
                fontWeight: "bold", 
                marginBottom: isMobile ? "0.5rem" : "0.5rem", 
                color: theme.text, 
                fontSize: isMobile ? "0.85rem" : "0.9rem" 
              }}>
                {lang === "cn" ? "📝 我的笔记:" : lang === "en" ? "📝 My Note:" : "📝 我的筆記:"}
              </div>
              <textarea
                value={editingNote}
                onChange={(e) => setEditingNote(e.target.value)}
                placeholder={lang === "cn" ? "记录你的答题心得、易错点、知识点总结等..." : lang === "en" ? "Record your thoughts, common mistakes, knowledge summary, etc..." : "記錄你的答題心得、易錯點、知識點總結等..."}
                style={{
                  width: "100%",
                  minHeight: isMobile ? "80px" : "100px",
                  padding: isMobile ? "0.6rem" : "0.75rem",
                  borderRadius: "6px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.bg,
                  color: theme.text,
                  fontSize: isMobile ? "0.85rem" : "0.9rem",
                  fontFamily: "inherit",
                  resize: "vertical",
                  boxSizing: "border-box",
                  marginBottom: isMobile ? "0.6rem" : "0.75rem",
                  lineHeight: 1.5,
                  WebkitTapHighlightColor: "transparent",
                }}
              />
              <div style={{ 
                display: "flex", 
                gap: isMobile ? "6px" : "8px", 
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}>
                <button
                  onClick={handleCancelEditNote}
                  disabled={savingNote}
                  style={{
                    padding: isMobile ? "0.4rem 0.8rem" : "0.5rem 1rem",
                    backgroundColor: "transparent",
                    border: `1px solid ${theme.border}`,
                    borderRadius: "6px",
                    cursor: savingNote ? "not-allowed" : "pointer",
                    fontSize: isMobile ? "0.85rem" : "0.9rem",
                    color: theme.textSecondary,
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                    userSelect: "none",
                  }}
                >
                  {lang === "cn" ? "取消" : lang === "en" ? "Cancel" : "取消"}
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  style={{
                    padding: isMobile ? "0.4rem 0.8rem" : "0.5rem 1rem",
                    backgroundColor: savingNote ? theme.buttonDisabled : "#52c41a",
                    border: "none",
                    borderRadius: "6px",
                    cursor: savingNote ? "not-allowed" : "pointer",
                    fontSize: isMobile ? "0.85rem" : "0.9rem",
                    color: "white",
                    fontWeight: "bold",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                    userSelect: "none",
                  }}
                >
                  {savingNote
                    ? lang === "cn"
                      ? "保存中..."
                      : lang === "en"
                      ? "Saving..."
                      : "保存中..."
                    : lang === "cn"
                    ? "确定"
                    : lang === "en"
                    ? "Save"
                    : "確定"}
                </button>
              </div>
            </div>
          )}

          {/* 题干图片 */}
          {stemImageUrl && (
            <div style={{ marginBottom: "1rem" }}>
              <img
                src={getProxyImageUrl(stemImageUrl)}
                alt="题目图片"
                style={{
                  maxWidth: "100%",
                  maxHeight: isMobile ? 220 : 300,
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  objectFit: "contain",
                  backgroundColor: isDarkMode ? "#1a1a1a" : "#f5f5f5",
                }}
                onLoad={() => {
                  console.log('[PracticePage] 图片加载成功:', stemImageUrl);
                }}
                onError={(e) => {
                  console.error('[PracticePage] 图片加载失败:', {
                    src: e.target.src,
                    originalUrl: stemImageUrl,
                    error: '图片加载失败'
                  });
                  // 如果代理失败，尝试使用原始URL
                  if (e.target.src.includes("/api/v1/imageProxy/proxy")) {
                    console.log('[PracticePage] 尝试使用原始URL:', stemImageUrl);
                    e.target.src = stemImageUrl;
                  } else {
                    console.log('[PracticePage] 隐藏图片');
                    e.target.style.display = "none";
                  }
                }}
              />
            </div>
          )}

          {/* 选项 */}
          <div style={{ marginBottom: "1.5rem" }}>
            {options.map((option, index) => {
              // 使用统一的验证逻辑判断选项是否被选中
              const normalizedLabel = String(option.label).toUpperCase().trim();
              const isSelected = selectedAnswersArray.includes(normalizedLabel);
              
              // 使用统一的验证逻辑判断选项是否为正确答案
              const isCorrectOptionValue = isCorrectOption(option.label, currentQuestion.answer);

              let optionStyle = {
                padding: isMobile ? "12px" : "12px 16px",
                marginBottom: 10,
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.optionBg,
                color: theme.text,
                cursor: showResult ? "default" : "pointer",
                display: "flex",
                alignItems: "flex-start",
                transition: "all 0.3s ease",
                fontSize: isMobile ? "0.95rem" : "1rem",
                lineHeight: 1.5,
                animation: showResult && isCorrectOptionValue ? 'optionCorrect 0.5s ease-out' : 
                          showResult && isSelected && !isCorrectOptionValue ? 'optionWrong 0.5s ease-out' : 'none',
              };

              // 只有提交后才显示正确答案和错误答案的标记
              if (showResult) {
                if (isCorrectOptionValue) {
                  // 正确答案：绿色边框和背景
                  optionStyle.border = `2px solid ${theme.correctBorder}`;
                  optionStyle.backgroundColor = theme.correctBg;
                }
                if (isSelected && !isCorrectOptionValue) {
                  // 选错了：红色边框和背景
                  optionStyle.border = `2px solid ${theme.wrongBorder}`;
                  optionStyle.backgroundColor = theme.wrongBg;
                }
              } else if (isSelected) {
                // 未提交时，只显示选中状态：蓝色边框
                optionStyle.border = `2px solid ${theme.optionSelectedBorder}`;
                optionStyle.backgroundColor = theme.optionSelectedBg;
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
                          ? theme.correctBorder
                          : isSelected
                          ? theme.wrongBorder
                          : isDarkMode ? "#505050" : "#d9d9d9"
                        : isSelected
                        ? theme.optionSelectedBorder
                        : isDarkMode ? "#505050" : "#d9d9d9",
                      color: "white",
                      marginRight: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {option.label}
                  </span>
                  <span style={{ flex: 1, wordBreak: "break-word" }}>{option.value}</span>
                  {showResult && isCorrectOption && (
                    <span style={{ color: theme.correctBorder, fontSize: "18px", marginLeft: "8px" }}>✓</span>
                  )}
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: isMobile ? "sticky" : "static",
              bottom: isMobile ? 0 : "auto",
              background: isMobile ? theme.cardBg : "transparent",
              paddingTop: "0.5rem",
              paddingBottom: isMobile ? "0.5rem" : 0,
              boxShadow: isMobile 
                ? (isDarkMode ? "0 -4px 12px rgba(0,0,0,0.5)" : "0 -4px 12px rgba(0,0,0,0.08)")
                : "none",
              zIndex: 2,
            }}
          >
            {/* 提交按钮 - 只有未提交时显示 */}
            {!showResult && (
              <button
                onClick={handleSubmit}
                disabled={!selectedAnswer || submitting}
                style={{
                  width: "100%",
                  padding: isMobile ? "0.85rem" : "0.75rem",
                  backgroundColor: selectedAnswer && !submitting ? "#ff6b35" : theme.buttonDisabled,
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
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
                  padding: isMobile ? "0.85rem" : "0.75rem",
                  backgroundColor: "#ff6b35",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
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
          </div>

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
                  backgroundColor: isCorrect ? theme.correctBg : theme.wrongBg,
                  border: `1px solid ${isCorrect ? theme.correctBorder : theme.wrongBorder}`,
                  animation: 'resultFadeIn 0.5s ease-out',
                }}
              >
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: isCorrect ? theme.correctBorder : theme.wrongBorder,
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
                <div style={{ color: theme.textSecondary, fontSize: "0.9rem" }}>
                  {lang === "cn" ? "正确答案:" : lang === "en" ? "Correct Answer:" : "正確答案:"}{" "}
                  {correctAnswers.join(", ")}
                </div>
              </div>

              {/* 4. 题目详细解析 - 官方解释和通俗解释 */}
              {(currentQuestion.explanation_raw || currentQuestion.explanation_human) && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: theme.explanationBg,
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    border: `1px solid ${theme.explanationBorder}`,
                    color: theme.text,
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "0.5rem", color: theme.text }}>
                    {lang === "cn" ? "解析:" : lang === "en" ? "Explanation:" : "解析:"}
                  </div>
                  {currentQuestion.explanation_raw && (
                    <div style={{ marginBottom: "0.5rem" }}>
                      <div style={{ fontSize: "0.9rem", color: theme.textSecondary, marginBottom: "0.25rem" }}>
                        {lang === "cn" ? "官方解释:" : lang === "en" ? "Official:" : "官方解釋:"}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", color: theme.text }}>{currentQuestion.explanation_raw}</div>
                    </div>
                  )}
                  {currentQuestion.explanation_human && (
                    <div>
                      <div style={{ fontSize: "0.9rem", color: theme.textSecondary, marginBottom: "0.25rem" }}>
                        {lang === "cn" ? "通俗解释:" : lang === "en" ? "Simple:" : "通俗解釋:"}
                      </div>
                      <div style={{ whiteSpace: "pre-wrap", color: theme.text }}>{currentQuestion.explanation_human}</div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. 题目详细解析 - 关联知识点及来源 */}
              {currentQuestion.knowledge_nodes && currentQuestion.knowledge_nodes.length > 0 && (
                <div
                  style={{
                    padding: "1rem",
                    backgroundColor: theme.knowledgeBg,
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    border: `1px solid ${theme.knowledgeBorder}`,
                    color: theme.text,
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
                          idx < currentQuestion.knowledge_nodes.length - 1 ? `1px solid ${theme.borderLight}` : "none",
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
                            color: theme.textSecondary,
                            marginTop: "0.25rem",
                            marginLeft: "60px",
                          }}
                        >
                          {kn.description}
                        </div>
                      )}
                      {kn.sources && kn.sources.length > 0 && (
                        <div style={{ fontSize: "0.8rem", color: theme.textSecondary, marginTop: "0.25rem", marginLeft: "60px" }}>
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
        <div style={{ textAlign: "center", padding: "2rem", backgroundColor: theme.bg, color: theme.text }}>
          <p>{lang === "cn" ? "加载题目中..." : lang === "en" ? "Loading question..." : "載入題目中..."}</p>
        </div>
      )}
      </div>
    </div>
  );
}

export default PracticePage;



