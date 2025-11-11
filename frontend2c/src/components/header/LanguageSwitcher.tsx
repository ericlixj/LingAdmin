import { Select } from "antd";

export const LanguageSwitcher = () => {
  const currentLang = localStorage.getItem("userLang") || "zh";

  const handleChange = (val: "zh" | "en") => {
    localStorage.setItem("userLang", val);

    // 页面刷新
    window.location.reload();
  };

  return (
    <Select value={currentLang} onChange={handleChange} style={{ width: 120 }}>
      <Select.Option value="zh">中文1</Select.Option>
      <Select.Option value="en">English</Select.Option>
    </Select>
  );
};
