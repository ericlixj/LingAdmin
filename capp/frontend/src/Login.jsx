import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        // 登录
        const response = await fetch(`${API_URL}/api/c/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.code === 0) {
          localStorage.setItem("access_token", data.data.access_token);
          localStorage.setItem("refresh_token", data.data.refresh_token);
          onLogin(data.data);
        } else {
          setError(data.message || "登录失败");
        }
      } else {
        // 注册
        const response = await fetch(`${API_URL}/api/c/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, full_name: fullName }),
        });

        const data = await response.json();

        if (data.code === 0) {
          setSuccess("注册成功！请检查您的邮箱并点击验证链接激活账户。");
          setEmail("");
          setPassword("");
          setFullName("");
        } else {
          setError(data.message || "注册失败");
        }
      }
    } catch (error) {
      setError("网络错误: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          {isLogin ? "登录" : "注册"}
        </h2>

        {error && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#fee",
              color: "#c33",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#efe",
              color: "#3c3",
              borderRadius: "4px",
              marginBottom: "1rem",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "0.5rem",
                  fontWeight: "500",
                }}
              >
                姓名
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem",
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
            >
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: loading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "1rem",
            }}
          >
            {loading ? "处理中..." : isLogin ? "登录" : "注册"}
          </button>
        </form>

        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#007bff",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {isLogin ? "还没有账户？注册" : "已有账户？登录"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

