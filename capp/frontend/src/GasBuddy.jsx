// capp/frontend/src/GasBuddy.jsx
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function GasBuddy({ lang = "cn" }) {
  const [postcode, setPostcode] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 加拿大邮编格式校验
  const validateCanadianPostalCode = (code) => {
    if (!code || code.trim() === "") {
      return { valid: false, error: "" };
    }
    const cleanCode = code.replace(/\s+/g, '').toUpperCase();
    const postalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
    if (cleanCode.length !== 6) {
      return { 
        valid: false, 
        error: lang === "cn" ? "邮编必须是6位字符" : lang === "en" ? "Postal code must be 6 characters" : "郵編必須是6位字符"
      };
    }
    if (!postalCodeRegex.test(cleanCode)) {
      return { 
        valid: false, 
        error: lang === "cn" ? "邮编格式不正确，应为 A1A 1A1 格式" : lang === "en" ? "Invalid postal code format, should be A1A 1A1" : "郵編格式不正確，應為 A1A 1A1 格式"
      };
    }
    return { valid: true, error: "" };
  };

  // 格式化邮编（自动添加空格）
  const formatPostalCode = (value) => {
    let cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (cleaned.length > 3) {
      cleaned = cleaned.slice(0, 3) + ' ' + cleaned.slice(3, 6);
    }
    return cleaned;
  };

  // 获取 GasBuddy 数据
  const fetchGasBuddyData = async (postalCode) => {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("未登录");
      }

      const response = await fetch(`${API_URL}/api/c/gasbuddy?postcode=${encodeURIComponent(postalCode)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
      setError(err.message || "获取 GasBuddy 数据失败");
      console.error("GasBuddy fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = (e) => {
    e.preventDefault();
    const validation = validateCanadianPostalCode(postcode);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    const cleanPostcode = postcode.replace(/\s+/g, '');
    fetchGasBuddyData(cleanPostcode);
  };

  // 邮编输入处理
  const handlePostcodeInput = (e) => {
    const formatted = formatPostalCode(e.target.value);
    setPostcode(formatted);
    setError("");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>GasBuddy 加油站数据</h1>

      {/* 搜索表单 */}
      <div style={{ marginBottom: "2rem" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.9rem", color: "#666", fontWeight: "500" }}>
              {lang === "cn" ? "邮编:" : lang === "en" ? "Postal Code:" : "郵編:"}
            </label>
            <input
              type="text"
              value={postcode}
              onChange={handlePostcodeInput}
              placeholder={lang === "cn" ? "例如: V6Y 1J5" : lang === "en" ? "e.g. V6Y 1J5" : "例如: V6Y 1J5"}
              style={{
                padding: "0.5rem",
                fontSize: "1rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                width: "150px",
                textTransform: "uppercase"
              }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
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
                cursor: loading ? "not-allowed" : "pointer",
                height: "fit-content"
              }}
            >
              {lang === "cn" ? "搜索" : lang === "en" ? "Search" : "搜尋"}
            </button>
          </div>
        </form>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{ 
          padding: "1rem", 
          backgroundColor: "#fee", 
          border: "1px solid #fcc",
          borderRadius: "4px",
          marginBottom: "1rem",
          color: "#c00"
        }}>
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
          {/* 位置信息 */}
          {data.location && (
            <div style={{ 
              marginBottom: "2rem", 
              padding: "1rem", 
              backgroundColor: "#f8f9fa", 
              borderRadius: "8px",
              border: "1px solid #dee2e6"
            }}>
              <h2 style={{ marginTop: 0 }}>
                {lang === "cn" ? "位置信息" : lang === "en" ? "Location" : "位置資訊"}
              </h2>
              <p><strong>{lang === "cn" ? "显示名称:" : lang === "en" ? "Display Name:" : "顯示名稱:"}</strong> {data.location.displayName}</p>
              <p><strong>{lang === "cn" ? "国家代码:" : lang === "en" ? "Country Code:" : "國家代碼:"}</strong> {data.location.countryCode}</p>
              <p><strong>{lang === "cn" ? "地区代码:" : lang === "en" ? "Region Code:" : "地區代碼:"}</strong> {data.location.regionCode}</p>
              {data.location.latitude && data.location.longitude && (
                <p>
                  <strong>{lang === "cn" ? "坐标:" : lang === "en" ? "Coordinates:" : "座標:"}</strong> 
                  {data.location.latitude}, {data.location.longitude}
                </p>
              )}
            </div>
          )}

          {/* 趋势信息 */}
          {data.trends && (
            <div style={{ 
              marginBottom: "2rem", 
              padding: "1rem", 
              backgroundColor: "#e7f3ff", 
              borderRadius: "8px",
              border: "1px solid #b3d9ff"
            }}>
              <h2 style={{ marginTop: 0 }}>
                {lang === "cn" ? "价格趋势" : lang === "en" ? "Price Trends" : "價格趨勢"}
              </h2>
              <p><strong>{lang === "cn" ? "地区:" : lang === "en" ? "Area:" : "地區:"}</strong> {data.trends.areaName}</p>
              {data.trends.today && (
                <p><strong>{lang === "cn" ? "今日价格:" : lang === "en" ? "Today:" : "今日價格:"}</strong> ${data.trends.today}</p>
              )}
              {data.trends.todayLow && (
                <p><strong>{lang === "cn" ? "今日最低:" : lang === "en" ? "Today Low:" : "今日最低:"}</strong> ${data.trends.todayLow}</p>
              )}
              {data.trends.trend && (
                <p><strong>{lang === "cn" ? "趋势:" : lang === "en" ? "Trend:" : "趨勢:"}</strong> {data.trends.trend}</p>
              )}
            </div>
          )}

          {/* 加油站列表 */}
          {data.stations && data.stations.length > 0 && (
            <div>
              <h2>
                {lang === "cn" ? `加油站 (${data.stations.length})` : lang === "en" ? `Gas Stations (${data.stations.length})` : `加油站 (${data.stations.length})`}
              </h2>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
                gap: "1rem" 
              }}>
                {data.stations.map((station, idx) => (
                  <div
                    key={station.id || idx}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      padding: "1rem",
                      backgroundColor: "white",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  >
                    <h3 style={{ marginTop: 0, fontSize: "1.1rem" }}>
                      {station.name || (lang === "cn" ? "未命名加油站" : lang === "en" ? "Unnamed Station" : "未命名加油站")}
                    </h3>
                    
                    {/* 地址 */}
                    {station.address && (
                      <div style={{ marginBottom: "0.5rem", color: "#666", fontSize: "0.9rem" }}>
                        {station.address.line1 && <p style={{ margin: "0.25rem 0" }}>{station.address.line1}</p>}
                        {station.address.locality && station.address.region && (
                          <p style={{ margin: "0.25rem 0" }}>
                            {station.address.locality}, {station.address.region} {station.address.postalCode}
                          </p>
                        )}
                      </div>
                    )}

                    {/* 距离 */}
                    {station.distance !== undefined && (
                      <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                        <strong>{lang === "cn" ? "距离:" : lang === "en" ? "Distance:" : "距離:"}</strong> {station.distance.toFixed(2)} km
                      </p>
                    )}

                    {/* 价格 */}
                    {station.prices && station.prices.length > 0 && (
                      <div style={{ marginTop: "0.5rem" }}>
                        {station.prices.map((price, priceIdx) => (
                          <div key={priceIdx} style={{ marginBottom: "0.5rem" }}>
                            {price.cash && price.cash.formattedPrice && (
                              <p style={{ 
                                margin: "0.25rem 0", 
                                color: "#d32f2f", 
                                fontSize: "1.2rem", 
                                fontWeight: "bold" 
                              }}>
                                {lang === "cn" ? "现金:" : lang === "en" ? "Cash:" : "現金:"} {price.cash.formattedPrice}
                              </p>
                            )}
                            {price.credit && price.credit.formattedPrice && (
                              <p style={{ 
                                margin: "0.25rem 0", 
                                color: "#1976d2", 
                                fontSize: "1.1rem" 
                              }}>
                                {lang === "cn" ? "信用卡:" : lang === "en" ? "Credit:" : "信用卡:"} {price.credit.formattedPrice}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 评分 */}
                    {station.starRating && (
                      <p style={{ margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" }}>
                        <strong>{lang === "cn" ? "评分:" : lang === "en" ? "Rating:" : "評分:"}</strong> ⭐ {station.starRating} 
                        {station.ratingsCount && ` (${station.ratingsCount})`}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!data.stations || data.stations.length === 0) && (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>{lang === "cn" ? "该邮编区域没有找到加油站" : lang === "en" ? "No gas stations found for this postal code" : "該郵編區域沒有找到加油站"}</p>
            </div>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
          <p>{lang === "cn" ? "请输入邮编搜索加油站数据" : lang === "en" ? "Please enter a postal code to search for gas stations" : "請輸入郵編搜尋加油站數據"}</p>
        </div>
      )}
    </div>
  );
}

export default GasBuddy;


