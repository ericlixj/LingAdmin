// capp/frontend/src/App.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import Login from "./Login";
import GasBuddy from "./GasBuddy";
import StudySystem from "./StudySystem";
import PointsDisplay from "./PointsDisplay";
import PointsHistory from "./PointsHistory";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const PAGE_SIZE = 10; // 每页数量
const ZIP_CODE_STORAGE_KEY = "flyer_zip_code"; // localStorage 中保存邮编的 key

function App() {
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false); // 用户设置弹窗
  
  // 检测移动端
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 480;
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
  // 从 localStorage 读取保存的邮编
  const getStoredZipCode = () => {
    try {
      const stored = localStorage.getItem(ZIP_CODE_STORAGE_KEY);
      return stored || "";
    } catch (error) {
      console.error("Failed to read zip code from localStorage:", error);
      return "";
    }
  };

  // 保存邮编到 localStorage
  const saveZipCodeToStorage = (code) => {
    try {
      if (code) {
        localStorage.setItem(ZIP_CODE_STORAGE_KEY, code);
      } else {
        localStorage.removeItem(ZIP_CODE_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save zip code to localStorage:", error);
    }
  };

  const [error, setError] = useState("");
  const [flyers, setFlyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [zipCode, setZipCode] = useState(() => getStoredZipCode()); // 邮编状态，从 localStorage 初始化
  const [zipCodeError, setZipCodeError] = useState(""); // 邮编格式错误信息
  const [lang, setLang] = useState("cn"); // 语言状态：cn/en/hk
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const observerTarget = useRef(null);
  const [pageView, setPageView] = useState(null); // null: 主页, "flyers": flyer页面, "gas": gas页面

  // 调试：监控 showPointsHistory 状态变化
  useEffect(() => {
    console.log('[DEBUG] showPointsHistory changed:', showPointsHistory);
  }, [showPointsHistory]);
  
  // 调试：监控 showUserSettings 状态变化
  useEffect(() => {
    console.log('[DEBUG] showUserSettings changed:', showUserSettings);
  }, [showUserSettings]);
  
  // 当页面切换时，关闭积分明细弹窗（只在非首页时关闭）
  // 注意：这个 useEffect 可能会在首页时也触发，所以需要更精确的判断
  // useEffect(() => {
  //   if (pageView !== null && showPointsHistory) {
  //     console.log('[DEBUG] Page view changed to non-home, closing points history');
  //     setShowPointsHistory(false);
  //   }
  // }, [pageView]);

  // 语言选项
  const langOptions = [
    { value: "cn", label: "中文" },
    { value: "en", label: "English" },
    { value: "hk", label: "繁體中文" }
  ];

  // 加拿大邮编格式校验
  // 格式：A1A 1A1 或 A1A1A1（字母数字字母 + 空格 + 数字字母数字）
  // 正则：^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$
  const validateCanadianPostalCode = (code, currentLang = lang) => {
    // 邮编可以为空（为空时返回空结果）
    if (!code || code.trim() === "") {
      return { valid: true, error: "" };
    }
    // 去掉空格进行校验
    const cleanCode = code.replace(/\s+/g, '').toUpperCase();
    // 加拿大邮编格式：6位字符，字母数字字母数字字母数字
    const postalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
    if (cleanCode.length !== 6) {
      return { 
        valid: false, 
        error: currentLang === "cn" ? "邮编必须是6位字符" : currentLang === "en" ? "Postal code must be 6 characters" : "郵編必須是6位字符"
      };
    }
    if (!postalCodeRegex.test(cleanCode)) {
      return { 
        valid: false, 
        error: currentLang === "cn" ? "邮编格式不正确，应为 A1A 1A1 格式" : currentLang === "en" ? "Invalid postal code format, should be A1A 1A1" : "郵編格式不正確，應為 A1A 1A1 格式"
      };
    }
    return { valid: true, error: "" };
  };

  // 格式化邮编（自动添加空格）
  const formatPostalCode = (value) => {
    // 只保留字母和数字
    let cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    // 如果长度超过3，在第3位后添加空格
    if (cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
    }
    return cleaned;
  };

  // 检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/c/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.code === 0) {
          setIsAuthenticated(true);
          setUser(data.data.user);
        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // 处理登录成功
  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData.user);
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsAuthenticated(false);
    setUser(null);
  };

  // 检查邮箱验证（URL参数）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // 验证邮箱
      fetch(`${API_URL}/api/c/auth/verify-email?token=${token}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.code === 0) {
            alert("邮箱验证成功！请登录。");
            window.history.replaceState({}, "", window.location.pathname);
          } else {
            alert("验证失败: " + data.message);
          }
        })
        .catch((error) => {
          console.error("Verification error:", error);
          alert("验证失败，请重试");
        });
    }
  }, []);

  // 获取 flyer_details 数据
  const fetchFlyers = useCallback(async (query = "", page = 0, append = false, language = lang, postalCode = zipCode) => {
    try {
      if (page === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      const params = new URLSearchParams();
      if (query) {
        params.append('q', query);
      }
      params.append('lang', language); // 添加语言参数
      if (postalCode) {
        params.append('zip_code', postalCode); // 添加邮编参数
      }
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      params.append('_start', start.toString());
      params.append('_end', end.toString());

      const response = await fetch(`${API_URL}/api/c/flyer_details?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`flyer_details api: ${response.status}`);
      }
      const result = await response.json();
      const newData = result.data || [];
      
      if (append) {
        // 追加数据
        setFlyers(prev => [...prev, ...newData]);
      } else {
        // 替换数据（首次加载或搜索）
        setFlyers(newData);
      }
      
      setTotal(result.total || 0);
      setHasMore(newData.length === PAGE_SIZE && (start + newData.length) < (result.total || 0));
      setError("");
    } catch (err) {
      if (!append) {
        setFlyers([]);
      }
      setError("搜索失败: " + String(err));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [lang, zipCode]);

  // 加载更多数据
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchFlyers(searchQuery, nextPage, true, lang, zipCode);
    }
  }, [currentPage, searchQuery, loadingMore, hasMore, loading, fetchFlyers, lang, zipCode]);

  // 滚动监听 - 使用 Intersection Observer
  useEffect(() => {
    // 只有在有数据且不加载中时才设置 Observer
    if (loading || !hasMore || loadingMore) {
      return;
    }

    const currentTarget = observerTarget.current;
    if (!currentTarget) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // 提前 100px 开始加载
      }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loading, hasMore, loadingMore, loadMore, flyers.length]); // 添加 flyers.length 确保数据更新后重新设置

  // 初始加载：使用保存的邮编（只在组件首次挂载和 lang 变化时）
  useEffect(() => {
    // 使用 state 中的 zipCode（已经从 localStorage 初始化）
    const validation = validateCanadianPostalCode(zipCode, lang);
    if (validation.valid) {
      // 邮编为空或格式正确都可以查询（为空时返回空结果）
      fetchFlyers("", 0, false, lang, zipCode || "");
    } else {
      setZipCodeError(validation.error);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFlyers, lang]); // 不依赖 zipCode，避免循环

  // 语言切换处理
  const handleLangChange = (newLang) => {
    setLang(newLang);
    setCurrentPage(0);
    setHasMore(true);
    // 校验邮编格式并更新错误信息为新的语言
    const validation = validateCanadianPostalCode(zipCode, newLang);
    setZipCodeError(validation.error);
    // 如果邮编格式无效，不进行搜索
    if (!validation.valid) {
      return;
    }
    // 语言切换时重新搜索（邮编为空也可以查询，返回空结果）
    fetchFlyers(searchQuery, 0, false, newLang, zipCode || "");
  };

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault();
    
    // 校验邮编格式（空值也允许，会返回空结果）
    const validation = validateCanadianPostalCode(zipCode);
    if (!validation.valid) {
      setZipCodeError(validation.error);
      return;
    }
    
    setZipCodeError("");
    setCurrentPage(0);
    setHasMore(true);
    // 邮编为空也可以查询（返回空结果）
    fetchFlyers(searchQuery, 0, false, lang, zipCode || "");
  };

  // 邮编输入处理
  const handleZipCodeInput = (e) => {
    const inputValue = e.target.value;
    // 格式化邮编（自动添加空格）
    const formatted = formatPostalCode(inputValue);
    setZipCode(formatted);
    
    // 保存到 localStorage
    saveZipCodeToStorage(formatted);
    
    // 实时校验格式
    const validation = validateCanadianPostalCode(formatted, lang);
    if (!validation.valid) {
      setZipCodeError(validation.error);
    } else {
      setZipCodeError("");
    }
  };

  // 清空邮编（同时清除 localStorage）
  const handleClearZipCode = () => {
    setZipCode("");
    setZipCodeError("");
    saveZipCodeToStorage("");
    // 邮编为空时也可以查询（返回空结果），不显示错误
  };

  // 清空搜索（只清空搜索关键词，不清空邮编）
  const handleClear = () => {
    setSearchQuery("");
    setCurrentPage(0);
    setHasMore(true);
    // 使用当前邮编重新搜索（邮编为空也可以，返回空结果）
    const validation = validateCanadianPostalCode(zipCode, lang);
    if (validation.valid) {
      fetchFlyers("", 0, false, lang, zipCode || "");
    }
  };

  // 如果正在检查认证，显示加载中
  if (checkingAuth) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p>加载中...</p>
      </div>
    );
  }

  // 如果未认证，显示登录页面
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // 原有的 App 内容，添加登出按钮和功能选择
  // 如果未选择页面，显示主页（功能选择）
  if (pageView === null) {
    return (
      <>
      <div style={{ 
        padding: isMobile ? "1rem" : "2rem", 
        fontFamily: "system-ui, sans-serif", 
        maxWidth: "1200px", 
        margin: "0 auto" 
      }}>
        {/* 头部：标题和登出按钮 */}
        <div style={{ marginBottom: isMobile ? "1rem" : "2rem" }}>
          {/* 第一行：标题、用户名、登出按钮 */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "0.5rem",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}>
            <h1 style={{ 
              margin: 0,
              fontSize: window.innerWidth <= 480 ? "1.1rem" : "1.5rem",
              fontWeight: "600",
            }}>
              {lang === "cn" ? "首页" : lang === "en" ? "Home" : "首頁"}
            </h1>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: isMobile ? "0.5rem" : "1rem",
              flexWrap: "wrap",
            }}>
              {/* 积分显示 */}
              {isAuthenticated && user && (
                <PointsDisplay 
                  userId={user.id} 
                  onClick={(e) => {
                    console.log('[DEBUG] PointsDisplay onClick triggered in App.jsx (home page)');
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[DEBUG] Current showPointsHistory before:', showPointsHistory);
                    if (!showPointsHistory) {
                      setShowPointsHistory(true);
                      console.log('[DEBUG] After setShowPointsHistory(true)');
                    } else {
                      console.log('[DEBUG] showPointsHistory is already true, closing it');
                      setShowPointsHistory(false);
                    }
                  }}
                />
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[DEBUG] User settings button clicked');
                  setShowUserSettings(true);
                  console.log('[DEBUG] showUserSettings should be true now');
                }}
                style={{
                  padding: isMobile ? "0.4rem" : "0.5rem",
                  backgroundColor: "transparent",
                  color: "#666",
                  border: "1px solid #ddd",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: isMobile ? "1.2rem" : "1.3rem",
                  width: isMobile ? "32px" : "36px",
                  height: isMobile ? "32px" : "36px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f0f0f0";
                  e.target.style.borderColor = "#999";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.borderColor = "#ddd";
                }}
                title={lang === "cn" ? "用户设置" : lang === "en" ? "User Settings" : "用戶設置"}
              >
                ⚙️
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: isMobile ? "0.4rem 0.8rem" : "0.5rem 1rem",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: isMobile ? "0.85rem" : "1rem",
                  whiteSpace: "nowrap",
                }}
              >
                {lang === "cn" ? "登出" : lang === "en" ? "Logout" : "登出"}
              </button>
            </div>
          </div>
        </div>

        {/* 功能选择区域 */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          gap: "3rem", 
          justifyContent: "center", 
          alignItems: "center",
          marginTop: "2rem",
          maxWidth: "800px",
          marginLeft: "auto",
          marginRight: "auto"
        }}>
          {/* 资讯获取 */}
          <div style={{
            width: "100%",
            padding: "2rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}>
            <h2 style={{
              margin: "0 0 1.5rem 0",
              fontSize: isMobile ? "1.3rem" : "1.8rem",
              fontWeight: "600",
              color: "#333",
              textAlign: "center"
            }}>
              {lang === "cn" ? "资讯获取" : lang === "en" ? "Information" : "資訊獲取"}
            </h2>
            <div style={{
              display: "flex",
              gap: "1.5rem",
              justifyContent: "center",
              flexWrap: "wrap"
            }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPageView("flyers");
                }}
                style={{
                  padding: isMobile ? "1.2rem 2rem" : "1.5rem 3rem",
                  fontSize: isMobile ? "1.1rem" : "1.3rem",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.2s",
                  minWidth: isMobile ? "120px" : "150px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#0056b3";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#007bff";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                }}
              >
                {lang === "cn" ? "传单" : lang === "en" ? "Flyers" : "傳單"}
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPageView("gas");
                }}
                style={{
                  padding: isMobile ? "1.2rem 2rem" : "1.5rem 3rem",
                  fontSize: isMobile ? "1.1rem" : "1.3rem",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.2s",
                  minWidth: isMobile ? "120px" : "150px",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#218838";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#28a745";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                }}
              >
                {lang === "cn" ? "油价" : lang === "en" ? "Gas Prices" : "油價"}
              </button>
            </div>
          </div>

          {/* 学习系统 */}
          <div style={{
            width: "100%",
            padding: "2rem",
            backgroundColor: "#fff3cd",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPageView("study");
              }}
              style={{
                width: "100%",
                padding: isMobile ? "1.5rem 2rem" : "2rem 3rem",
                fontSize: isMobile ? "1.3rem" : "1.5rem",
                backgroundColor: "#ff6b35",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#e55a2b";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#ff6b35";
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
              }}
            >
              {lang === "cn" ? "学习系统" : lang === "en" ? "Study System" : "學習系統"}
            </button>
          </div>
        </div>
      </div>
      
      {/* 积分明细弹窗 */}
      {showPointsHistory && (
        <PointsHistory onClose={() => {
          console.log('[DEBUG] Closing PointsHistory');
          setShowPointsHistory(false);
        }} />
      )}

      {/* 用户设置弹窗 */}
      {showUserSettings && (
        <>
          {console.log('[DEBUG] Rendering User Settings modal')}
          <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: isMobile ? "1rem" : "2rem",
          }}
          onClick={() => setShowUserSettings(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: isMobile ? "1.5rem" : "2rem",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题和关闭按钮 */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "1.5rem"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>
                {lang === "cn" ? "用户设置" : lang === "en" ? "User Settings" : "用戶設置"}
              </h2>
              <button
                onClick={() => setShowUserSettings(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#666",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f0f0f0";
                  e.target.style.color = "#333";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#666";
                }}
              >
                ×
              </button>
            </div>

            {/* 用户信息 */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontSize: "0.9rem", 
                color: "#666",
                fontWeight: "500"
              }}>
                {lang === "cn" ? "邮箱" : lang === "en" ? "Email" : "郵箱"}
              </label>
              <div style={{
                padding: "0.75rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "6px",
                color: "#666",
                fontSize: "0.9rem"
              }}>
                {user?.email}
              </div>
            </div>

            {/* 邮编管理 */}
            <UserPostcodeManager lang={lang} />

            {/* 关闭按钮 */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                onClick={() => setShowUserSettings(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#5a6268";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#6c757d";
                }}
              >
                {lang === "cn" ? "关闭" : lang === "en" ? "Close" : "關閉"}
              </button>
            </div>
          </div>
        </div>
        </>
      )}
      </>
    );
  }

  // 如果选择了页面，显示对应内容
  return (
    <div style={{ 
      padding: isMobile ? "1rem" : "2rem", 
      fontFamily: "system-ui, sans-serif", 
      maxWidth: "1200px", 
      margin: "0 auto" 
    }}>
      {/* 头部：标题、返回按钮和登出按钮 */}
      <div style={{ marginBottom: isMobile ? "1rem" : "2rem" }}>
        {/* 第一行：返回按钮、标题、用户名、登出按钮 */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "0.5rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.5rem" : "1rem", flex: 1, minWidth: 0, flexWrap: "nowrap" }}>
            <button
              onClick={() => setPageView(null)}
              style={{
                padding: isMobile ? "0.4rem 0.8rem" : "0.5rem 1rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: isMobile ? "0.85rem" : "1rem",
                whiteSpace: "nowrap",
              }}
            >
              {lang === "cn" ? "← 返回" : lang === "en" ? "← Back" : "← 返回"}
            </button>
            <h1 style={{ 
              margin: 0,
              fontSize: isMobile ? "1.1rem" : "1.5rem",
              fontWeight: "600",
            }}>
              {pageView === "flyers"
                ? lang === "cn"
                  ? "传单详情"
                  : lang === "en"
                  ? "Flyer Details"
                  : "傳單詳情"
                : pageView === "gas"
                ? lang === "cn"
                  ? "加油站查询"
                  : lang === "en"
                  ? "Gas Stations"
                  : "加油站查詢"
                : lang === "cn"
                ? "学习系统"
                : lang === "en"
                ? "Study System"
                : "學習系統"}
            </h1>
          </div>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: isMobile ? "0.5rem" : "1rem",
            flexWrap: "wrap",
          }}>
            {/* 积分显示 */}
            {isAuthenticated && user && (
              <div onClick={(e) => e.stopPropagation()}>
                <PointsDisplay 
                  userId={user.id} 
                  onClick={(e) => {
                    console.log('[DEBUG] PointsDisplay onClick triggered in App.jsx (other page)');
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPointsHistory(true);
                  }}
                />
              </div>
            )}
            <button
              onClick={() => setShowUserSettings(true)}
              style={{
                padding: isMobile ? "0.4rem" : "0.5rem",
                backgroundColor: "transparent",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: isMobile ? "1.2rem" : "1.3rem",
                width: isMobile ? "32px" : "36px",
                height: isMobile ? "32px" : "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#f0f0f0";
                e.target.style.borderColor = "#999";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "transparent";
                e.target.style.borderColor = "#ddd";
              }}
              title={lang === "cn" ? "用户设置" : lang === "en" ? "User Settings" : "用戶設置"}
            >
              ⚙️
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: isMobile ? "0.4rem 0.8rem" : "0.5rem 1rem",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: isMobile ? "0.85rem" : "1rem",
                whiteSpace: "nowrap",
              }}
            >
              {lang === "cn" ? "登出" : lang === "en" ? "Logout" : "登出"}
            </button>
          </div>
          </div>
        </div>

      {/* 根据当前页面显示内容 */}
      {pageView === "gas" ? (
        <GasBuddy lang={lang} />
      ) : pageView === "study" ? (
        <StudySystem lang={lang} user={user} />
      ) : (
        <>
      
      {error && (
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#fee", 
          border: "1px solid #fcc",
          borderRadius: "4px",
          marginBottom: "1rem",
          color: "#c00"
        }}>
          错误: {error}
        </div>
      )}

      {/* 搜索框和语言切换 */}
      <div style={{ marginBottom: "2rem" }}>
        {/* 语言切换和邮编 */}
        <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          {/* 语言切换 */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.9rem", color: "#666", fontWeight: "500" }}>
              {lang === "cn" ? "语言:" : lang === "en" ? "Language:" : "語言:"}
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {langOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleLangChange(option.value)}
                  disabled={loading}
                  style={{
                    padding: "0.5rem 1rem",
                    fontSize: "0.9rem",
                    backgroundColor: lang === option.value ? "#007bff" : "#f0f0f0",
                    color: lang === option.value ? "white" : "#333",
                    border: `1px solid ${lang === option.value ? "#007bff" : "#ddd"}`,
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: lang === option.value ? "bold" : "normal",
                    transition: "all 0.2s"
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 邮编输入 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.9rem", color: "#666", fontWeight: "500" }}>
                {lang === "cn" ? "邮编:" : lang === "en" ? "Postal Code:" : "郵編:"}
              </label>
              <input
                type="text"
                value={zipCode}
                onChange={handleZipCodeInput}
                placeholder={lang === "cn" ? "例如: K1A 0A6" : lang === "en" ? "e.g. K1A 0A6" : "例如: K1A 0A6"}
                style={{
                  padding: "0.5rem",
                  fontSize: "0.9rem",
                  border: zipCodeError ? "1px solid #dc3545" : "1px solid #ddd",
                  borderRadius: "4px",
                  width: "120px",
                  textTransform: "uppercase"
                }}
              />
              {zipCode && (
                <button
                  type="button"
                  onClick={handleClearZipCode}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.8rem",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                  title={lang === "cn" ? "清除邮编" : lang === "en" ? "Clear postal code" : "清除郵編"}
                >
                  ×
                </button>
              )}
              {zipCode && !zipCodeError && (
                <span style={{ fontSize: "0.85rem", color: "#666" }}>
                  ({lang === "cn" ? "FSA: " : lang === "en" ? "FSA: " : "FSA: "}{zipCode.replace(/\s+/g, '').length >= 3 ? zipCode.replace(/\s+/g, '').slice(0, 3) : zipCode.replace(/\s+/g, '')})
                </span>
              )}
            </div>
            {zipCodeError && (
              <span style={{ fontSize: "0.75rem", color: "#dc3545", marginLeft: "60px" }}>
                {zipCodeError}
              </span>
            )}
          </div>
        </div>

        {/* 搜索框 */}
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === "cn" ? "搜索商品名称..." : lang === "en" ? "Search product name..." : "搜尋商品名稱..."}
            style={{
              flex: 1,
              padding: "0.5rem",
              fontSize: "1rem",
              border: "1px solid #ddd",
              borderRadius: "4px"
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.5rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {lang === "cn" ? "搜索" : lang === "en" ? "Search" : "搜尋"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            style={{
              padding: "0.5rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: loading ? "#ccc" : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {lang === "cn" ? "清空" : lang === "en" ? "Clear" : "清除"}
          </button>
        </form>
      </div>

      {/* Flyer Details 列表 */}
      <div>
        <h2>{total > 0 && `(${flyers.length} / ${total} 项)`}</h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>{lang === "cn" ? "加载中..." : lang === "en" ? "Loading..." : "載入中..."}</p>
          </div>
        ) : flyers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>{lang === "cn" ? "没有找到 flyer details。" : lang === "en" ? "No flyer details found." : "沒有找到 flyer details。"}</p>
          </div>
        ) : (
          <>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
              gap: "1rem" 
            }}>
              {flyers.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "1rem",
                    backgroundColor: "white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                >
                  {item.cutout_image_url && (
                    <img
                      src={item.cutout_image_url}
                      alt={item.title || item.name}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "contain",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        marginBottom: "0.5rem"
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}
                  <h3 style={{ margin: "0.5rem 0", fontSize: "1.1rem" }}>
                    {item.title || item.cn_name || item.name || (lang === "cn" ? "无标题" : lang === "en" ? "No title" : "無標題")}
                  </h3>
                  {item.brand && (
                    <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                      <b>{lang === "cn" ? "品牌:" : lang === "en" ? "Brand:" : "品牌:"}</b> {item.brand}
                    </p>
                  )}
                  {item.price !== null && item.price !== undefined && (
                    <p style={{ margin: "0.25rem 0", color: "#d32f2f", fontSize: "1.1rem", fontWeight: "bold" }}>
                      ${item.price}
                    </p>
                  )}
                  {item.merchant && (
                    <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.85rem" }}>
                      <b>{lang === "cn" ? "商家:" : lang === "en" ? "Merchant:" : "商家:"}</b> {item.merchant}
                    </p>
                  )}
                  {item.valid_from && item.valid_to && (
                    <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.85rem" }}>
                      <b>{lang === "cn" ? "有效期:" : lang === "en" ? "Valid:" : "有效期:"}</b> {new Date(item.valid_from).toLocaleDateString()} - {new Date(item.valid_to).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* 滚动触发元素 - 只在有更多数据时显示 */}
            {hasMore && (
              <div 
                ref={observerTarget} 
                style={{ 
                  height: "20px", 
                  marginTop: "2rem",
                  minHeight: "20px" // 确保有足够高度
                }} 
              />
            )}

            {/* 加载更多指示器 */}
            {loadingMore && (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p>{lang === "cn" ? "加载更多..." : lang === "en" ? "Loading more..." : "載入更多..."}</p>
              </div>
            )}

            {/* 没有更多数据提示 */}
            {!hasMore && flyers.length > 0 && (
              <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                <p>{lang === "cn" ? "已加载全部数据" : lang === "en" ? "All data loaded" : "已載入全部資料"}</p>
              </div>
            )}
          </>
        )}
      </div>
        </>
      )}
      
      {/* 积分明细弹窗 */}
      {showPointsHistory && (
        <PointsHistory onClose={() => {
          console.log('[DEBUG] Closing PointsHistory');
          setShowPointsHistory(false);
        }} />
      )}

      {/* 用户设置弹窗 */}
      {showUserSettings && (
        <>
          {console.log('[DEBUG] Rendering User Settings modal')}
          <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: isMobile ? "1rem" : "2rem",
          }}
          onClick={() => setShowUserSettings(false)}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: isMobile ? "1.5rem" : "2rem",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题和关闭按钮 */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "1.5rem"
            }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>
                {lang === "cn" ? "用户设置" : lang === "en" ? "User Settings" : "用戶設置"}
              </h2>
              <button
                onClick={() => setShowUserSettings(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#666",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "4px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f0f0f0";
                  e.target.style.color = "#333";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#666";
                }}
              >
                ×
              </button>
            </div>

            {/* 用户信息 */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "0.5rem", 
                fontSize: "0.9rem", 
                color: "#666",
                fontWeight: "500"
              }}>
                {lang === "cn" ? "邮箱" : lang === "en" ? "Email" : "郵箱"}
              </label>
              <div style={{
                padding: "0.75rem",
                backgroundColor: "#f8f9fa",
                borderRadius: "6px",
                color: "#666",
                fontSize: "0.9rem"
              }}>
                {user?.email}
              </div>
            </div>

            {/* 邮编管理 */}
            <UserPostcodeManager lang={lang} />

            {/* 关闭按钮 */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                onClick={() => setShowUserSettings(false)}
                style={{
                  padding: "0.75rem 1.5rem",
                  fontSize: "1rem",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#5a6268";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#6c757d";
                }}
              >
                {lang === "cn" ? "关闭" : lang === "en" ? "Close" : "關閉"}
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

// 用户邮编管理组件（内联在用户设置弹窗中）
function UserPostcodeManager({ lang }) {
  const [postcodes, setPostcodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ postcode: "", label: "" });
  const [showForm, setShowForm] = useState(false);

  // 加载 postcode 列表
  const fetchPostcodes = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      const response = await fetch(`${API_URL}/api/c/postcode`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      if (result.code === 0) {
        setPostcodes(result.data);
      } else {
        throw new Error(result.message || "获取数据失败");
      }
    } catch (err) {
      setError(err.message || "获取 postcode 列表失败");
      console.error("Postcode fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostcodes();
  }, []);

  // 格式化 postcode（自动添加空格）
  const formatPostalCode = (value) => {
    let cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
    }
    return cleaned;
  };

  // 处理表单提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      const url = editingId
        ? `${API_URL}/api/c/postcode/${editingId}`
        : `${API_URL}/api/c/postcode`;
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postcode: formData.postcode.replace(/\s+/g, ''),
          label: formData.label,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "操作失败");
      }

      const result = await response.json();
      if (result.code === 0) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ postcode: "", label: "" });
        fetchPostcodes();
      } else {
        throw new Error(result.message || "操作失败");
      }
    } catch (err) {
      setError(err.message || "操作失败");
      console.error("Postcode submit error:", err);
    }
  };

  // 开始编辑
  const handleEdit = (postcode) => {
    setEditingId(postcode.id);
    setFormData({
      postcode: postcode.postcode.length === 6 
        ? `${postcode.postcode.slice(0, 3)} ${postcode.postcode.slice(3)}`
        : postcode.postcode,
      label: postcode.label || "",
    });
    setShowForm(true);
  };

  // 删除
  const handleDelete = async (id) => {
    const confirmMsg = lang === "cn" ? "确定要删除吗？" : lang === "en" ? "Are you sure?" : "確定要刪除嗎？";
    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      setError("");
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      const response = await fetch(`${API_URL}/api/c/postcode/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "删除失败");
      }

      const result = await response.json();
      if (result.code === 0) {
        fetchPostcodes();
      } else {
        throw new Error(result.message || "删除失败");
      }
    } catch (err) {
      setError(err.message || "删除失败");
      console.error("Postcode delete error:", err);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ postcode: "", label: "" });
    setError("");
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "0.75rem"
      }}>
        <label style={{ 
          fontSize: "0.9rem", 
          color: "#666",
          fontWeight: "500"
        }}>
          {lang === "cn" ? "邮编管理" : lang === "en" ? "Postal Code Management" : "郵編管理"}
        </label>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ postcode: "", label: "" });
            }}
            style={{
              padding: "0.4rem 0.8rem",
              fontSize: "0.85rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#0056b3";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#007bff";
            }}
          >
            {lang === "cn" ? "+ 添加" : lang === "en" ? "+ Add" : "+ 添加"}
          </button>
        )}
      </div>

      {error && (
        <div style={{ 
          padding: "0.5rem",
          backgroundColor: "#fee",
          border: "1px solid #fcc",
          borderRadius: "4px",
          marginBottom: "0.75rem",
          color: "#c00",
          fontSize: "0.85rem"
        }}>
          {error}
        </div>
      )}

      {showForm && (
        <div style={{
          padding: "1rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "6px",
          marginBottom: "0.75rem",
          border: "1px solid #dee2e6",
        }}>
          <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem", fontWeight: "600" }}>
            {editingId
              ? (lang === "cn" ? "编辑邮编" : lang === "en" ? "Edit Postal Code" : "編輯郵編")
              : (lang === "cn" ? "添加邮编" : lang === "en" ? "Add Postal Code" : "添加郵編")}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: "500" }}>
                {lang === "cn" ? "邮编:" : lang === "en" ? "Postal Code:" : "郵編:"}
              </label>
              <input
                type="text"
                value={formData.postcode}
                onChange={(e) => {
                  const formatted = formatPostalCode(e.target.value);
                  setFormData({ ...formData, postcode: formatted });
                }}
                placeholder={lang === "cn" ? "例如: K1A 0A6" : lang === "en" ? "e.g. K1A 0A6" : "例如: K1A 0A6"}
                required
                maxLength={7}
                style={{
                  padding: "0.5rem",
                  fontSize: "0.9rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  width: "100%",
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: "500" }}>
                {lang === "cn" ? "标识 (可选):" : lang === "en" ? "Label (optional):" : "標識 (可選):"}
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder={lang === "cn" ? "例如: 家、公司" : lang === "en" ? "e.g. Home, Office" : "例如: 家、公司"}
                maxLength={32}
                style={{
                  padding: "0.5rem",
                  fontSize: "0.9rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  width: "100%",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="submit"
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.9rem",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {lang === "cn" ? "保存" : lang === "en" ? "Save" : "保存"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.9rem",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {lang === "cn" ? "取消" : lang === "en" ? "Cancel" : "取消"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "1rem", fontSize: "0.85rem", color: "#666" }}>
          {lang === "cn" ? "加载中..." : lang === "en" ? "Loading..." : "載入中..."}
        </div>
      ) : postcodes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "1rem", fontSize: "0.85rem", color: "#666" }}>
          {lang === "cn" ? "还没有添加邮编" : lang === "en" ? "No postcodes added yet" : "還沒有添加郵編"}
        </div>
      ) : (
        <div style={{
          maxHeight: "300px",
          overflowY: "auto",
          border: "1px solid #dee2e6",
          borderRadius: "6px",
        }}>
          {postcodes.map((pc) => (
            <div
              key={pc.id}
              style={{
                padding: "0.75rem",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "500", marginBottom: "0.25rem" }}>
                  {pc.postcode.length === 6
                    ? `${pc.postcode.slice(0, 3)} ${pc.postcode.slice(3)}`
                    : pc.postcode}
                </div>
                {pc.label && (
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>
                    {pc.label}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleEdit(pc)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.8rem",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {lang === "cn" ? "编辑" : lang === "en" ? "Edit" : "編輯"}
                </button>
                <button
                  onClick={() => handleDelete(pc.id)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.8rem",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {lang === "cn" ? "删除" : lang === "en" ? "Delete" : "刪除"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
