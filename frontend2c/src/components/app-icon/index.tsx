import React from "react";

interface AppIconProps {
  size?: number; 
  color?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  size = 24,
  color = "#1890ff",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      color={color}
    >
      <path d="M12 2L20 6L12 10L4 6L12 2Z" fill="#1890ff" />
      <path d="M4 6V10L12 14L20 10V6" fill="#1890ff" opacity="0.8" />
      <path d="M4 10V14L12 18L20 14V10" fill="#1890ff" opacity="0.6" />
    </svg>
  );
};
