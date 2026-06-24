/** Values that may arrive from the API as number or numeric string. */
export type Numeric = number | string | null | undefined;

/** Recharts formatter callbacks receive a single value or an array of values. */
export type ChartValue = number | string | Array<number | string>;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const money = (n: Numeric): string => inr.format(Math.round(Number(n) || 0));
export const moneyCompact = (n: Numeric): string => inrCompact.format(Number(n) || 0);
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
