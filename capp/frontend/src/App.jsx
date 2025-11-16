// capp/frontend/src/App.jsx
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [random, setRandom] = useState(Math.random());
  const [flyers, setFlyers] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/c/hello`)
      .then((res) => {
        if (!res.ok) throw new Error(`hello api: ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError("hello: " + String(err)));
    setRandom(Math.random());

    // 获取 flyer_details 数据
    fetch(`${API_URL}/api/c/flyer_details`)
      .then((res) => {
        // 打印调试信息，帮助排查404
        if (!res.ok) {
          console.error("flyer_details fetch failed", res.status, res.url);
          throw new Error(`flyer_details api: ${res.status}`);
        }
        return res.json();
      })
      .then((res) => setFlyers(res.data || []))
      .catch((err) => {
        setFlyers([]);
        setError((prev) => prev + " flyer_details: " + String(err));
      });
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>LingAdmin 2C Demo (capp)</h1>
      <p>Backend API: <code>{API_URL}/api/c/hello</code></p>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {data ? (
        <div style={{ marginTop: "1rem" }}>
          <p><b>Greeting:</b> {data.data.greeting}</p>
          <p>
            <b>Timestamp:</b> {data.data.timestamp}
          </p>
          <p>
            <b>Random111:</b> {random}
          </p>
          <div style={{ marginTop: "2rem" }}>
            <h2>Flyer Details</h2>
            {flyers.length === 0 ? (
              <p>No flyer details found.</p>
            ) : (
              <ul>
                {flyers.map((item, idx) => (
                  <li key={item.id || idx}>
                    {JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : !error ? (
        <p>Loading...</p>
      ) : null}
    </div>
  );
}

export default App;
