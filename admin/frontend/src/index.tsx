import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // react-query 包，@refinedev/core 依赖

import App from "./App";

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

// 新建一个 QueryClient 实例
const queryClient = new QueryClient();

root.render(
  <React.StrictMode>
    {/* 在这里包裹 QueryClientProvider 并传入 queryClient */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
