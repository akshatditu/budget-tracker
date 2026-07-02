/** Values that may arrive from the API as number or numeric string. */
export type Numeric = number | string | null | undefined;

/** Recharts formatter callbacks receive a single value or an array of values. */
export type ChartValue = number | string | Array<number | string>;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const money = (n: Numeric): string => inr.format(Math.round(Number(n) || 0));

/** Web (lg+, matching the desktop table layout) has room for full numbers; only
 *  mobile needs the compact form. SSR-safe default to wide. */
const isWide = (): boolean =>
  typeof window === "undefined" || window.innerWidth >= 1024;

/** Compact Indian currency on mobile (₹45.6K · ₹1.9L · ₹2.4Cr), full on web.
 *  The en-IN Intl compact renders thousands as "T", which we don't want — so
 *  format by hand. */
export const moneyCompact = (n: Numeric): string => {
  if (isWide()) return money(n);
  const v = Number(n) || 0;
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const unit = (x: number, suffix: string) =>
    `${sign}₹${(Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, "")}${suffix}`;
  if (abs >= 1e7) return unit(abs / 1e7, "Cr");
  if (abs >= 1e5) return unit(abs / 1e5, "L");
  if (abs >= 1e3) return unit(abs / 1e3, "K");
  return `${sign}₹${Math.round(abs)}`;
};
export const pct = (n: Numeric): string => `${Math.round((Number(n) || 0) * 100)}%`;

/** Currency formatter for recharts tooltips (handles the array-value case). */
export const moneyChart = (v: ChartValue): string => money(Array.isArray(v) ? v[0] : v);

export const MONTH_NAMES: string[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTH_SHORT: string[] = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const SECTION_COLORS: Record<string, string> = {
  Bills: "var(--color-bills)",
  Needs: "var(--color-needs)",
  Wants: "var(--color-wants)",
  Investments: "var(--color-investments)",
};

export const sectionColor = (name: string): string => SECTION_COLORS[name] || "var(--color-brand)";

/** Default ISO date ("yyyy-MM-dd") for a new transaction in the given month:
 *  today when it falls in that month, else the 1st — keeping it inside the
 *  budget year the API requires and honoring the drawer's "Add to <month>". */
export const defaultTxnDate = (year: number, month: number): string => {
  const now = new Date();
  const day = now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};
