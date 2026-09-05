/**
 * 手绘风线稿装饰（Anthropic 式单线涂鸦）
 * stroke 使用 currentColor，通过 className 控制颜色与尺寸
 */

const strokeProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

/** 手绘相机 */
export function CameraDoodle({ className = "" }) {
  return (
    <svg viewBox="0 0 120 80" className={className} {...strokeProps}>
      {/* 机身 */}
      <path d="M14 26c8-2 84-3 92-1 3 1 4 4 4 8l-1 30c0 4-2 6-6 6-30 2-58 2-86 0-4 0-6-3-6-7l1-29c0-4 1-6 2-7z" />
      {/* 顶部取景器 */}
      <path d="M44 25c1-5 3-8 8-8h14c5 0 7 3 8 8" />
      {/* 快门 */}
      <path d="M96 22c4-1 7 0 8 3" />
      {/* 镜头 */}
      <circle cx="60" cy="46" r="14" />
      <circle cx="60" cy="46" r="8" />
      {/* 高光点 */}
      <path d="M55 41c1-1 3-2 5-2" />
      {/* 侧面装饰线 */}
      <path d="M24 46c3-1 6 0 7 2M24 52c3 1 6 0 7-2" />
    </svg>
  );
}

/** 波浪分隔线 */
export function SquiggleDoodle({ className = "" }) {
  return (
    <svg viewBox="0 0 220 24" className={className} {...strokeProps}>
      <path d="M4 14c10-9 20-9 30 0s20 9 30 0 20-9 30 0 20 9 30 0 20-9 30 0 20 9 30 0 20-9 32 0" />
    </svg>
  );
}

/** 手绘星点 */
export function StarDoodle({ className = "" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} {...strokeProps}>
      <path d="M20 5c1 6 3 10 4 11s5 3 11 4c-6 1-10 3-11 4s-3 5-4 11c-1-6-3-10-4-11s-5-3-11-4c6-1 10-3 11-4s3-5 4-11z" />
    </svg>
  );
}

/** 手绘山与太阳 */
export function MountainDoodle({ className = "" }) {
  return (
    <svg viewBox="0 0 120 70" className={className} {...strokeProps}>
      {/* 太阳 */}
      <path d="M88 18c4 0 7 3 7 7s-3 7-7 7-7-3-7-7c0-3 2-6 5-7" />
      {/* 光线 */}
      <path d="M88 8v4M99 12l-3 3M103 25h-4M76 12l3 3" />
      {/* 远山 */}
      <path d="M8 60l22-26 16 18 12-12 24 20" />
      {/* 近景 */}
      <path d="M50 60l14-14 16 12" />
      {/* 地平线 */}
      <path d="M6 60c36 2 74 2 108 0" />
    </svg>
  );
}
