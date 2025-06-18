import React from "react";

interface MasterSwordIconProps {
  size?: number;      // SVG 宽高，单位 px
  color?: string;     // 主色调
  strokeWidth?: number; // 线条宽度，固定 px
}

export const AppIcon: React.FC<MasterSwordIconProps> = ({
  size = 64,
  color = "#1890ff",
  strokeWidth = 2,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 圆框 */}
      <circle
        cx="32"
        cy="32"
        r={32 - strokeWidth}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        vectorEffect="non-scaling-stroke"
      />

      {/* 剑刃 */}
      <path
        d="M32 4 L28 40 L36 40 L32 4 Z"
        fill={color}
        stroke={color}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
      {/* 剑身中线 */}
      <line
        x1="32"
        y1="4"
        x2="32"
        y2="40"
        stroke="white"
        strokeWidth={strokeWidth / 2}
        vectorEffect="non-scaling-stroke"
      />
      {/* 剑柄 */}
      <rect
        x="24"
        y="40"
        width="16"
        height="6"
        rx="2"
        ry="2"
        fill={color}
        stroke={color}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
      {/* 剑柄护手 */}
      <path
        d="M20 46 L44 46 L32 54 Z"
        fill={color}
        stroke={color}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
      {/* 剑柄下端 */}
      <rect
        x="28"
        y="54"
        width="8"
        height="6"
        rx="2"
        ry="2"
        fill={color}
        stroke={color}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};
