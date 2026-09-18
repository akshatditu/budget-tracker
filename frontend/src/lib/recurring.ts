import { Landmark, ShieldCheck, TrendingUp, Tv, Zap, type LucideIcon } from "lucide-react";
import type { Frequency, Subscription, SubscriptionKind } from "../types/api";

export const FREQUENCIES: { value: Frequency; label: string; perMonth: number }[] = [
  { value: "weekly", label: "Weekly", perMonth: 52 / 12 },
  { value: "monthly", label: "Monthly", perMonth: 1 },
  { value: "quarterly", label: "Quarterly", perMonth: 1 / 3 },
  { value: "semiannual", label: "Half-yearly", perMonth: 1 / 6 },
  { value: "yearly", label: "Yearly", perMonth: 1 / 12 },
];
export const freq = (f: Frequency) => FREQUENCIES.find((x) => x.value === f)!;

export interface KindMeta {
  value: SubscriptionKind;
  label: string;
  icon: LucideIcon;
  color: string;
  defaultFreq: Frequency;
  placeholder: string;
  /** Headline unit on the summary tile — yearly premiums aren't flattened to /mo. */
  unit: "mo" | "yr";
}

/** Types of recurring payment, in display order. Purely presentational — posting is identical. */
export const KINDS: KindMeta[] = [
  { value: "subscription", label: "Subscriptions", icon: Tv, color: "var(--color-wants)", defaultFreq: "monthly", placeholder: "Netflix / Spotify", unit: "mo" },
  { value: "insurance", label: "Insurance", icon: ShieldCheck, color: "var(--violet)", defaultFreq: "yearly", placeholder: "Term plan / Health policy", unit: "yr" },
  { value: "bill", label: "Bills & utilities", icon: Zap, color: "var(--color-bills)", defaultFreq: "monthly", placeholder: "Phone / Wi-Fi / Electricity", unit: "mo" },
  { value: "emi", label: "Loan EMIs", icon: Landmark, color: "var(--warn)", defaultFreq: "monthly", placeholder: "Home loan EMI", unit: "mo" },
  { value: "investment", label: "Investments (SIP)", icon: TrendingUp, color: "var(--color-investments)", defaultFreq: "monthly", placeholder: "Nifty 50 SIP", unit: "mo" },
];
export const kindMeta = (k: SubscriptionKind) => KINDS.find((x) => x.value === k) ?? KINDS[0];

/** Whole days from today (local) until an ISO "yyyy-MM-dd" date. */
export const daysUntil = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date();
  return Math.round((new Date(y, m - 1, d).getTime() - new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()) / 86_400_000);
};

/** Big, infrequent charges (half-yearly / yearly) due within 30 days — worth a heads-up. */
export const renewsSoon = (s: Subscription) =>
  s.active &&
  (s.frequency === "semiannual" || s.frequency === "yearly") &&
  (!s.end_date || s.next_due_date <= s.end_date) &&
  daysUntil(s.next_due_date) <= 30;
