/**
 * BudgetIQ brand assets — icon + wordmark.
 */

interface IconProps {
  size?: number;
  className?: string;
}

/** The cart-with-charts icon. Always rendered on a dark background. */
export function BudgetIQIcon({ size = 36, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cart body */}
      <path
        d="M3 6h4.5l4.5 16.5H28l3.5-12.5H10.5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wheels */}
      <circle cx="14.5" cy="28" r="2.2" fill="white" />
      <circle cx="25" cy="28" r="2.2" fill="white" />
      {/* Bar 1 – blue */}
      <rect x="13.5" y="16.5" width="3" height="5.5" rx="0.7" fill="#60A5FA" />
      {/* Bar 2 – teal */}
      <rect x="18.5" y="13.5" width="3" height="8.5" rx="0.7" fill="#2DD4BF" />
      {/* Bar 3 – green */}
      <rect x="23.5" y="15" width="3" height="7" rx="0.7" fill="#4ADE80" />
      {/* Trend line */}
      <polyline
        points="15,15.5 20,11 25,12.5 30,7"
        stroke="#4ADE80"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Trend dot */}
      <circle cx="30" cy="7" r="2.2" fill="#4ADE80" />
    </svg>
  );
}

/** The dark-square icon badge (for sidebar, login card, favicon, etc.). */
export function BudgetIQBadge({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="9" fill="#0F172A" />
      <BudgetIQIcon size={40} />
    </svg>
  );
}

/**
 * Full wordmark: badge + "Budget**IQ**" text.
 * Pass `collapsed` to render only the badge (used on narrow viewports).
 */
export function BudgetIQWordmark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid shrink-0 place-items-center rounded-xl bg-[#0F172A]" style={{ width: 36, height: 36 }}>
        <BudgetIQIcon size={28} />
      </div>
      {!collapsed && (
        <span className="text-base font-bold tracking-tight">
          Budget<span className="text-brand">IQ</span>
        </span>
      )}
    </div>
  );
}
