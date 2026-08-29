/** Flat neo-brutal bloom mark — decorative only. */
export function DecorBloom({
  className = "",
  variant = "yellow",
  size = 48,
}: {
  className?: string;
  variant?: "yellow" | "green" | "cream";
  size?: number;
}) {
  const fill = variant === "green" ? "#7cff6b" : variant === "cream" ? "#fffdf7" : "#ffe566";

  return (
    <svg
      className={`decor-bloom ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="10" r="8" fill={fill} stroke="#000" strokeWidth="2.5" />
      <circle cx="24" cy="38" r="8" fill={fill} stroke="#000" strokeWidth="2.5" />
      <circle cx="10" cy="24" r="8" fill={fill} stroke="#000" strokeWidth="2.5" />
      <circle cx="38" cy="24" r="8" fill={fill} stroke="#000" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="5.5" fill={fill} stroke="#000" strokeWidth="2.5" />
      <circle cx="24" cy="24" r="2.5" fill="#000" />
    </svg>
  );
}
