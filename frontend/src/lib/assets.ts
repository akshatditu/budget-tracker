/** Predefined asset categories for the net-worth view, plus a stable color per
 *  category for the breakdown donut. Colors are fixed hex (not theme vars) so the
 *  slices stay distinct and consistent across all four palettes. */
export const ASSET_CATEGORIES = [
  "Stocks",
  "US Stocks",
  "Mutual funds",
  "Bonds",
  "Fixed deposits (FD)",
  "PPF",
  "EPF",
  "NPS",
  "Gold",
  "Bank Balance",
  "Cash / savings",
] as const;

const ASSET_COLORS: Record<string, string> = {
  Stocks: "#4f7cff",
  "US Stocks": "#6c5ce7",
  "Mutual funds": "#12b0d8",
  Bonds: "#10b7a6",
  "Fixed deposits (FD)": "#22c07a",
  PPF: "#9b6dff",
  EPF: "#7b8794",
  NPS: "#e368a6",
  Gold: "#efa63c",
  "Bank Balance": "#0d9488",
  "Cash / savings": "#ff7a66",
};

export const assetColor = (category: string): string => ASSET_COLORS[category] || "#98a2b3";
