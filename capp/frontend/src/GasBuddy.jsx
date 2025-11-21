// capp/frontend/src/GasBuddy.jsx
import { useEffect, useState } from "react";
import PostcodeManager from "./PostcodeManager";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function GasBuddy({ lang = "cn" }) {
  const [selectedPostcode, setSelectedPostcode] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPostcodeManager, setShowPostcodeManager] = useState(false);
  const [userPostcodes, setUserPostcodes] = useState([]);
  const [maxDistance, setMaxDistance] = useState(5);

  // 加载用户 postcode 列表
  const fetchUserPostcodes = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        return;
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
        setUserPostcodes(result.data);
        // 如果有 postcode，默认选择第一个
        if (result.data.length > 0 && !selectedPostcode) {
          setSelectedPostcode(result.data[0].postcode);
        }
      }
    } catch (err) {
      console.error("Fetch user postcodes error:", err);
    }
  };

  useEffect(() => {
    fetchUserPostcodes();
  }, []);

  // 当选择 postcode 或距离变化时，自动查询
  useEffect(() => {
    if (selectedPostcode) {
      fetchGasData(selectedPostcode);
    }
  }, [selectedPostcode, maxDistance]);

  // 获取加油站数据
  const fetchGasData = async (postcode) => {
    if (!postcode) {
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      const cleanPostcode = postcode.replace(/\s+/g, '');
      const response = await fetch(
        `${API_URL}/api/c/gas?postcode=${encodeURIComponent(cleanPostcode)}&maxDistance=${maxDistance}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 0) {
        setData(result.data);
      } else {
        throw new Error(result.message || "获取数据失败");
      }
    } catch (err) {
      setError(err.message || "获取加油站数据失败");
      console.error("Gas fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 格式化 postcode（显示时添加空格）
  const formatPostcodeDisplay = (postcode) => {
    if (!postcode) return "";
    const clean = postcode.replace(/\s+/g, '');
    if (clean.length === 6) {
      return `${clean.slice(0, 3)} ${clean.slice(3)}`;
    }
    return postcode;
  };

  // 如果显示 postcode 管理页面
  if (showPostcodeManager) {
    return (
      <div>
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>
            {lang === "cn" ? "Postcode 管理" : lang === "en" ? "Postcode Management" : "Postcode 管理"}
          </h2>
          <button
            onClick={() => {
              setShowPostcodeManager(false);
              fetchUserPostcodes(); // 刷新列表
            }}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {lang === "cn" ? "← 返回" : lang === "en" ? "← Back" : "← 返回"}
          </button>
        </div>
        <PostcodeManager lang={lang} />
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 控制面板 */}
      <div style={{ marginBottom: "2rem", padding: "1.5rem", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap", marginBottom: "1rem" }}>
          {/* Postcode 选择 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.9rem", color: "#666", fontWeight: "500" }}>
              {lang === "cn" ? "选择 Postcode:" : lang === "en" ? "Select Postcode:" : "選擇 Postcode:"}
            </label>
            <select
              value={selectedPostcode}
              onChange={(e) => setSelectedPostcode(e.target.value)}
              style={{
                padding: "0.5rem",
                fontSize: "1rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                minWidth: "150px",
              }}
            >
              <option value="">
                {lang === "cn" ? "-- 请选择 --" : lang === "en" ? "-- Please select --" : "-- 請選擇 --"}
              </option>
              {userPostcodes.map((pc) => (
                <option key={pc.id} value={pc.postcode}>
                  {formatPostcodeDisplay(pc.postcode)} {pc.label ? `(${pc.label})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 距离选择 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.9rem", color: "#666", fontWeight: "500" }}>
              {lang === "cn" ? "最大距离 (公里):" : lang === "en" ? "Max Distance (km):" : "最大距離 (公里):"}
            </label>
            <input
              type="number"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseFloat(e.target.value) || 5)}
              min="1"
              max="50"
              step="1"
              style={{
                padding: "0.5rem",
                fontSize: "1rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "100px",
              }}
            />
          </div>

          {/* Postcode 管理按钮 */}
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={() => setShowPostcodeManager(true)}
              style={{
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                height: "fit-content",
              }}
            >
              {lang === "cn" ? "管理 Postcode" : lang === "en" ? "Manage Postcodes" : "管理 Postcode"}
            </button>
          </div>
        </div>

        {/* 说明 */}
        <div style={{ fontSize: "0.85rem", color: "#666" }}>
          {lang === "cn"
            ? "默认显示5公里内的加油站，按价格从低到高排序"
            : lang === "en"
            ? "Default shows gas stations within 5km, sorted by price from low to high"
            : "默認顯示5公里內的加油站，按價格從低到高排序"}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
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
          {error}
        </div>
      )}

      {/* 加载中 */}
      {loading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>{lang === "cn" ? "加载中..." : lang === "en" ? "Loading..." : "載入中..."}</p>
        </div>
      )}

      {/* 数据展示 */}
      {data && !loading && (
        <div>
          {/* 统计信息 */}
          <div style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#e7f3ff", borderRadius: "8px", border: "1px solid #b3d9ff" }}>
            <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold" }}>
              {lang === "cn"
                ? `找到 ${data.total} 个加油站（${maxDistance}公里内）`
                : lang === "en"
                ? `Found ${data.total} gas stations (within ${maxDistance}km)`
                : `找到 ${data.total} 個加油站（${maxDistance}公里內）`}
            </p>
          </div>

          {/* 加油站列表 */}
          {data.stations && data.stations.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1rem",
              }}
            >
              {data.stations.map((station, idx) => (
                <div
                  key={station.id || idx}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    padding: "1rem",
                    backgroundColor: "white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <h3 style={{ marginTop: 0, fontSize: "1.2rem", color: "#333" }}>
                    {station.name || (lang === "cn" ? "未命名加油站" : lang === "en" ? "Unnamed Station" : "未命名加油站")}
                  </h3>

                  {/* 价格 - 突出显示 */}
                  {station.price !== null && station.formatted_price ? (
                    <div style={{ margin: "1rem 0", padding: "0.75rem", backgroundColor: "#fff3cd", borderRadius: "4px", border: "2px solid #ffc107" }}>
                      <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold", color: "#d32f2f" }}>
                        {station.formatted_price}
                      </p>
                    </div>
                  ) : (
                    <div style={{ margin: "1rem 0", padding: "0.75rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
                        {lang === "cn" ? "暂无价格信息" : lang === "en" ? "No price information" : "暫無價格資訊"}
                      </p>
                    </div>
                  )}

                  {/* 地址 */}
                  {station.address && (
                    <div style={{ marginBottom: "0.5rem", color: "#666", fontSize: "0.9rem" }}>
                      <p style={{ margin: "0.25rem 0" }}>
                        <strong>{lang === "cn" ? "地址:" : lang === "en" ? "Address:" : "地址:"}</strong> {station.address}
                      </p>
                    </div>
                  )}

                  {/* 距离 */}
                  {station.distance !== null && station.distance !== undefined && (
                    <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                      <strong>{lang === "cn" ? "距离:" : lang === "en" ? "Distance:" : "距離:"}</strong>{" "}
                      {station.distance.toFixed(2)} km
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>
                {lang === "cn"
                  ? "该 postcode 区域没有找到加油站"
                  : lang === "en"
                  ? "No gas stations found for this postcode"
                  : "該 postcode 區域沒有找到加油站"}
              </p>
            </div>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
          <p>
            {lang === "cn"
              ? "请先添加并选择一个 postcode"
              : lang === "en"
              ? "Please add and select a postcode first"
              : "請先添加並選擇一個 postcode"}
          </p>
        </div>
      )}
    </div>
  );
}

export default GasBuddy;
