/**
 * BudgetIQ brand assets — icon + wordmark.
 * Faithful to the brand design doc: a self-contained gradient mark
 * (#0f9d8f → #7c3aed) with rising bars in a brighter teal→violet gradient,
 * and a Bricolage Grotesque wordmark whose "IQ" is gradient-filled.
 */
import { useId } from "react";

interface IconProps {
  size?: number;
  className?: string;
}

/** The gradient bar-chart mark. Self-contained — includes its own rounded background. */
export function BudgetIQIcon({ size = 36, className }: IconProps) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="56" x2="56" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f9d8f" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="56" x2="56" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0dd9c8" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect width="56" height="56" rx="16" fill={`url(#${id}-a)`} />
      {/* rising bars */}
      <rect x="10" y="32" width="8" height="14" rx="2.5" fill={`url(#${id}-b)`} opacity=".65" />
      <rect x="22" y="24" width="8" height="22" rx="2.5" fill={`url(#${id}-b)`} opacity=".8" />
      <rect x="34" y="14" width="8" height="32" rx="2.5" fill="#fff" />
      {/* trend line + dots */}
      <circle cx="38" cy="11" r="3.5" fill="#fff" />
      <circle cx="26" cy="21" r="2.5" fill="rgba(255,255,255,.7)" />
      <circle cx="14" cy="29" r="2" fill="rgba(255,255,255,.5)" />
      <polyline
        points="14,29 26,21 38,11"
        stroke="rgba(255,255,255,.6)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Alias kept for callers that want the standalone mark as a "badge". */
export function BudgetIQBadge({ size = 36 }: { size?: number }) {
  return <BudgetIQIcon size={size} />;
}

/**
 * Just the "BudgetIQ" wordmark text in Bricolage Grotesque, with the "IQ" gradient-filled.
 * `light` swaps "Budget" to a near-white for dark backgrounds.
 */
export function BudgetIQText({
  className,
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <span
      className={`font-bold tracking-tight ${className ?? ""}`}
      style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
    >
      <span style={{ color: light ? "#eef1f6" : "#14161f" }}>Budget</span>
      <span className="bg-gradient-to-br from-[#0f9d8f] to-[#7c3aed] bg-clip-text font-extrabold text-transparent">
        IQ
      </span>
    </span>
  );
}

/**
 * Full wordmark: mark + "BudgetIQ" text.
 * Pass `collapsed` to render only the mark (used on narrow viewports).
 */
export function BudgetIQWordmark({
  collapsed = false,
  light = false,
}: {
  collapsed?: boolean;
  light?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <BudgetIQIcon size={36} className="shrink-0" />
      {!collapsed && <BudgetIQText className="text-lg" light={light} />}
    </div>
  );
}
