import { Button } from "antd";
import { useGetLocale, useSetLocale } from "@refinedev/core";

export const LanguageSwitcher = () => {
  const getLocale = useGetLocale(); // 注意是函数
  const setLocale = useSetLocale();

  const currentLocale = getLocale();

  const toggleLocale = () => {
    const nextLocale = currentLocale === "zh" ? "en" : "zh";
    setLocale(nextLocale).then(() => {
      window.location.reload(); // 切换语言后刷新页面
    });
  };

  return (
    <Button onClick={toggleLocale} type="link">
      {currentLocale === "zh" ? "中文" : "English"}
    </Button>
  );
};
