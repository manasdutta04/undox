/** Flat neo-brutal decorative marks — decorative only. */

type MotifColor = "yellow" | "green" | "cream";
type MotifKind = "bloom" | "star" | "spark" | "leaf";

const FILLS: Record<MotifColor, string> = {
  yellow: "#ffe566",
  green: "#7cff6b",
  cream: "#fffdf7",
};

export function DecorMotif({
  kind = "bloom",
  className = "",
  variant = "yellow",
  size = 48,
}: {
  kind?: MotifKind;
  className?: string;
  variant?: MotifColor;
  size?: number;
}) {
  const fill = FILLS[variant];
  const cls = `decor-motif decor-${kind} ${className}`.trim();

  if (kind === "star") {
    return (
      <svg
        className={cls}
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M24 4 L28.5 18.5 L44 19 L31.5 28.5 L36 44 L24 35 L12 44 L16.5 28.5 L4 19 L19.5 18.5 Z"
          fill={fill}
          stroke="#000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === "spark") {
    return (
      <svg
        className={cls}
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M24 2 V46 M2 24 H46 M10 10 L38 38 M38 10 L10 38" stroke="#000" strokeWidth="3" strokeLinecap="square" />
        <circle cx="24" cy="24" r="6" fill={fill} stroke="#000" strokeWidth="2.5" />
      </svg>
    );
  }

  if (kind === "leaf") {
    return (
      <svg
        className={cls}
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M24 6 C36 10 42 22 40 34 C28 40 14 36 8 24 C12 14 18 8 24 6 Z"
          fill={fill}
          stroke="#000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M24 10 C24 22 24 30 22 40" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      className={cls}
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

/** @deprecated Prefer DecorMotif — kept for existing call sites. */
export function DecorBloom(props: {
  className?: string;
  variant?: MotifColor;
  size?: number;
}) {
  return <DecorMotif kind="bloom" {...props} />;
}
