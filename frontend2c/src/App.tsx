// src/App.tsx
import React from "react";
import { Refine, I18nProvider, useTranslate } from "@refinedev/core";
import i18nProvider from "./i18n/i18nProvider";
import { ItemList } from "./pages/item";

function App() {
  return (
    <Refine
      routerProvider={undefined} // 不使用 react-router
      i18nProvider={i18nProvider} // ✅ 绑定自定义语言
      resources={[{ name: "items", list: ItemList }]} 
      options={{ syncWithLocation: true }}
    >
      <ItemList /> {/* 直接渲染你的列表页面 */}
    </Refine>
  );
}

export default App;
