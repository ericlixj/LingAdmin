// capp/backend/index.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/c/health", (req, res) => {
  res.json({ code: 0, message: "ok", data: { service: "c-backend" } });
});

app.get("/api/c/hello", (req, res) => {
  res.json({
    code: 0,
    message: "ok",
    data: {
      greeting: "Hello from 2C backend (capp11111111111111111)",
      timestamp: new Date().toISOString()
    }
  });
});

app.listen(PORT, () => {
  console.log(`c-backend listening on port ${PORT}`);
});
