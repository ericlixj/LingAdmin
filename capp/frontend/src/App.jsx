// capp/frontend/src/App.jsx
import { useEffect, useState, useRef, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const PAGE_SIZE = 3; // 每页数量

function App() {
  const [error, setError] = useState("");
  const [flyers, setFlyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const observerTarget = useRef(null);

  // 获取 flyer_details 数据
  const fetchFlyers = useCallback(async (query = "", page = 0, append = false) => {
    try {
      if (page === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      if (query) {
        params.append('q', query);
      }
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE;
      params.append('_start', start.toString());
      params.append('_end', end.toString());

      const response = await fetch(`${API_URL}/api/c/flyer_details?${params}`);
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
  }, []);

  // 加载更多数据
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchFlyers(searchQuery, nextPage, true);
    }
  }, [currentPage, searchQuery, loadingMore, hasMore, loading, fetchFlyers]);

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

  // 初始加载
  useEffect(() => {
    fetchFlyers();
  }, [fetchFlyers]);

  // 搜索处理
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
    setHasMore(true);
    fetchFlyers(searchQuery, 0, false);
  };

  // 清空搜索
  const handleClear = () => {
    setSearchQuery("");
    setCurrentPage(0);
    setHasMore(true);
    fetchFlyers("", 0, false);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      
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

      {/* 搜索框 */}
      <div style={{ marginBottom: "2rem" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索商品名称..."
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
            搜索
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
            清空
          </button>
        </form>
      </div>

      {/* Flyer Details 列表 */}
      <div>
        <h2>{total > 0 && `(${flyers.length} / ${total} 项)`}</h2>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>加载中...</p>
          </div>
        ) : flyers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>没有找到 flyer details。</p>
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
                    {item.title || item.cn_name || item.name || "无标题"}
                  </h3>
                  {item.brand && (
                    <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                      <b>品牌:</b> {item.brand}
                    </p>
                  )}
                  {item.price !== null && item.price !== undefined && (
                    <p style={{ margin: "0.25rem 0", color: "#d32f2f", fontSize: "1.1rem", fontWeight: "bold" }}>
                      ${item.price}
                    </p>
                  )}
                  {item.merchant && (
                    <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.85rem" }}>
                      <b>商家:</b> {item.merchant}
                    </p>
                  )}
                  {item.valid_from && item.valid_to && (
                    <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.85rem" }}>
                      <b>有效期:</b> {new Date(item.valid_from).toLocaleDateString()} - {new Date(item.valid_to).toLocaleDateString()}
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
                <p>加载更多...</p>
              </div>
            )}

            {/* 没有更多数据提示 */}
            {!hasMore && flyers.length > 0 && (
              <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                <p>已加载全部数据</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
