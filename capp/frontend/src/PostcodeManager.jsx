// capp/frontend/src/PostcodeManager.jsx
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function PostcodeManager({ lang = "cn" }) {
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
      postcode: postcode.postcode,
      label: postcode.label || "",
    });
    setShowForm(true);
  };

  // 删除
  const handleDelete = async (id) => {
    if (!confirm(lang === "cn" ? "确定要删除吗？" : lang === "en" ? "Are you sure?" : "確定要刪除嗎？")) {
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
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ margin: 0 }}>
          {lang === "cn" ? "Postcode 管理" : lang === "en" ? "Postcode Management" : "Postcode 管理"}
        </h1>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ postcode: "", label: "" });
            }}
            style={{
              padding: "0.5rem 1.5rem",
              fontSize: "1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {lang === "cn" ? "+ 添加" : lang === "en" ? "+ Add" : "+ 添加"}
          </button>
        )}
      </div>

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

      {showForm && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            marginBottom: "2rem",
            border: "1px solid #dee2e6",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            {editingId
              ? lang === "cn"
                ? "编辑 Postcode"
                : lang === "en"
                ? "Edit Postcode"
                : "編輯 Postcode"
              : lang === "cn"
              ? "添加 Postcode"
              : lang === "en"
              ? "Add Postcode"
              : "添加 Postcode"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                {lang === "cn" ? "Postcode:" : lang === "en" ? "Postcode:" : "Postcode:"}
              </label>
              <input
                type="text"
                value={formData.postcode}
                onChange={(e) => {
                  const formatted = formatPostalCode(e.target.value);
                  setFormData({ ...formData, postcode: formatted });
                }}
                placeholder={lang === "cn" ? "例如: V6Y 1J5" : lang === "en" ? "e.g. V6Y 1J5" : "例如: V6Y 1J5"}
                required
                maxLength={7}
                style={{
                  padding: "0.5rem",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  width: "200px",
                  textTransform: "uppercase",
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                {lang === "cn" ? "标识 (Label):" : lang === "en" ? "Label:" : "標識 (Label):"}
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder={lang === "cn" ? "例如: 家、公司、学校" : lang === "en" ? "e.g. Home, Office, School" : "例如: 家、公司、學校"}
                maxLength={32}
                style={{
                  padding: "0.5rem",
                  fontSize: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  width: "200px",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="submit"
                style={{
                  padding: "0.5rem 1.5rem",
                  fontSize: "1rem",
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
                  padding: "0.5rem 1.5rem",
                  fontSize: "1rem",
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
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>{lang === "cn" ? "加载中..." : lang === "en" ? "Loading..." : "載入中..."}</p>
        </div>
      ) : postcodes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>{lang === "cn" ? "还没有添加 postcode" : lang === "en" ? "No postcodes added yet" : "還沒有添加 postcode"}</p>
        </div>
      ) : (
        <div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "white",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                  {lang === "cn" ? "Postcode" : lang === "en" ? "Postcode" : "Postcode"}
                </th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                  {lang === "cn" ? "标识" : lang === "en" ? "Label" : "標識"}
                </th>
                <th style={{ padding: "1rem", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>
                  {lang === "cn" ? "创建时间" : lang === "en" ? "Created" : "創建時間"}
                </th>
                <th style={{ padding: "1rem", textAlign: "right", borderBottom: "2px solid #dee2e6" }}>
                  {lang === "cn" ? "操作" : lang === "en" ? "Actions" : "操作"}
                </th>
              </tr>
            </thead>
            <tbody>
              {postcodes.map((pc) => (
                <tr key={pc.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                  <td style={{ padding: "1rem" }}>
                    {pc.postcode.length === 6
                      ? `${pc.postcode.slice(0, 3)} ${pc.postcode.slice(3)}`
                      : pc.postcode}
                  </td>
                  <td style={{ padding: "1rem" }}>{pc.label || "-"}</td>
                  <td style={{ padding: "1rem", color: "#666", fontSize: "0.9rem" }}>
                    {new Date(pc.create_time).toLocaleString()}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button
                      onClick={() => handleEdit(pc)}
                      style={{
                        padding: "0.25rem 0.75rem",
                        fontSize: "0.9rem",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginRight: "0.5rem",
                      }}
                    >
                      {lang === "cn" ? "编辑" : lang === "en" ? "Edit" : "編輯"}
                    </button>
                    <button
                      onClick={() => handleDelete(pc.id)}
                      style={{
                        padding: "0.25rem 0.75rem",
                        fontSize: "0.9rem",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      {lang === "cn" ? "删除" : lang === "en" ? "Delete" : "刪除"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PostcodeManager;


