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

app.get("/api/c/flyer_details", (req, res) => {
  // mock 数据
  const data = [
    { id: 1, title: "Flyer A", desc: "This is flyer A" },
    { id: 2, title: "Flyer B", desc: "This is flyer B" },
    { id: 3, title: "Flyer C", desc: "This is flyer C" },
    { id: 4, title: "Flyer D", desc: "This is flyer D" },
    { id: 5, title: "Flyer E", desc: "This is flyer E" },
    { id: 6, title: "Flyer F", desc: "This is flyer F" },
    { id: 7, title: "Flyer G", desc: "This is flyer G" },
    { id: 8, title: "Flyer H", desc: "This is flyer H" },
    { id: 9, title: "Flyer I", desc: "This is flyer I" },
    { id: 10, title: "Flyer J", desc: "This is flyer J" },
    { id: 11, title: "Flyer K", desc: "This is flyer K" },
    { id: 12, title: "Flyer L", desc: "This is flyer L" },
    { id: 13, title: "Flyer M", desc: "This is flyer M" },
    { id: 14, title: "Flyer N", desc: "This is flyer N" },
    { id: 15, title: "Flyer O", desc: "This is flyer O" },
  ];
  res.json({ code: 0, message: "ok", data });
});

app.listen(PORT, () => {
  console.log(`c-backend listening on port ${PORT}`);
});
