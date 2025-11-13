// capp/frontend/src/App.jsx
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/c/hello`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>LingAdmin 2C Demo (capp)</h1>
      <p>Backend API: <code>{API_URL}/api/c/hello</code></p>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {data ? (
        <div style={{ marginTop: "1rem" }}>
          <p><b>Greeting:</b> {data.data.greeting}</p>
          <p><b>Timestamp:</b> {data.data.timestamp}</p>
        </div>
      ) : !error ? (
        <p>Loading...</p>
      ) : null}
    </div>
  );
}

export default App;
