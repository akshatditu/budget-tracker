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

export const money = (n) => inr.format(Math.round(Number(n) || 0));
export const moneyCompact = (n) => inrCompact.format(Number(n) || 0);
export const pct = (n) => `${Math.round((Number(n) || 0) * 100)}%`;

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const SECTION_COLORS = {
  Bills: "var(--color-bills)",
  Needs: "var(--color-needs)",
  Wants: "var(--color-wants)",
  Investments: "var(--color-investments)",
};

export const sectionColor = (name) => SECTION_COLORS[name] || "var(--color-brand)";
