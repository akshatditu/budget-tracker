// Shared API contract types — mirror the FastAPI Pydantic schemas and the
// composite view payloads built in app/services/{rollup,carryforward}.py.

/** Category sections are either consumption ("spending") or retained wealth ("investment"). */
export type CategoryKind = "spending" | "investment";

/** Plan-vs-actual budget health, derived server-side from YTD spend ratio. */
export type BudgetStatus = "OK" | "Watch" | "Over";

// ---- Users / settings ----
export interface User {
  id: number;
  email: string;
  display_name: string;
  currency: string;
  /** False until the first-run onboarding wizard is completed. */
  onboarded: boolean;
}

// ---- Onboarding ----
export interface OnboardingSection {
  name: string;
  kind: CategoryKind;
  items: string[];
}

export interface OnboardingPayload {
  sections: OnboardingSection[];
}

export interface UserUpdate {
  display_name?: string;
  currency?: string;
}

// ---- Years ----
export interface Year {
  id: number;
  year: number;
}

export interface YearCreate {
  year: number;
  copy_structure_from?: number | null;
}

// ---- Categories / subcategories ----
export interface Category {
  id: number;
  name: string;
  sort_order: number;
  kind: CategoryKind;
}

export interface CategoryCreate {
  name: string;
  sort_order?: number;
  kind?: CategoryKind;
}

export interface CategoryUpdate {
  id: number;
  name?: string;
  sort_order?: number;
  kind?: CategoryKind;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
  archived: boolean;
}

export interface SubcategoryCreate {
  category_id: number;
  name: string;
  sort_order?: number;
}

export interface SubcategoryUpdate {
  id: number;
  name?: string;
  category_id?: number;
  sort_order?: number;
  archived?: boolean;
}

// ---- Annual budget (GET /years/{year}/annual-budget) ----
export interface AnnualBudgetRow {
  subcategory_id: number;
  category_id: number;
  name: string;
  initial_annual: number;
  revised_annual: number;
  ytd_revised: number;
}

export interface AnnualBudgetSet {
  subcategory_id: number;
  initial_amount: number;
}

export interface AnnualBudgetSetResult {
  subcategory_id: number;
  initial_annual: number;
  per_month: number;
}

export interface AnnualRevisedPatch {
  subcategory_id: number;
  revised_amount: number;
}

export interface AnnualRevisedResult {
  subcategory_id: number;
  revised_amount: number;
}

export interface MonthlyBudgetPatch {
  month: number;
  subcategory_id: number;
  revised_amount: number;
}

export interface MonthlyBudgetResult {
  subcategory_id: number;
  month: number;
  revised_amount: number;
}

// ---- Transactions ----
export interface Transaction {
  id: number;
  subcategory_id: number;
  txn_date: string;
  amount: number;
  note: string | null;
}

export interface TransactionCreate {
  subcategory_id: number;
  txn_date: string;
  amount: number;
  note?: string | null;
}

export interface TransactionUpdate {
  id: number;
  subcategory_id?: number;
  txn_date?: string;
  amount?: number;
  note?: string | null;
}

// A `type` alias (not interface) so it carries an implicit index signature and
// stays assignable to the axios query-params record.
export type TransactionFilter = {
  month?: number;
  subcategory_id?: number;
};

// ---- Income ----
export interface Income {
  id: number;
  month: number;
  source: string;
  amount: number;
  income_date: string | null;
  note: string | null;
}

export interface IncomeCreate {
  month: number;
  source: string;
  amount: number;
  income_date?: string | null;
  note?: string | null;
}

export interface IncomeUpdate {
  id: number;
  month?: number;
  source?: string;
  amount?: number;
  income_date?: string | null;
  note?: string | null;
}

// ---- Monthly settings ----
export interface MonthlySettingPatch {
  month: number;
  spend_limit?: number | null;
  opening_carry_forward?: number | null;
  notes?: string | null;
}

export interface MonthlySettingResult {
  month: number;
  spend_limit: number | null;
  opening_carry_forward: number | null;
  notes: string | null;
}

// ---- Carry forward ----
export interface CarryForwardRow {
  month: number;
  month_name?: string;
  carry_in: number;
  income: number;
  spent: number;
  invested: number;
  net: number;
  carry_out: number;
}

// ---- Month view ----
export interface MonthItem {
  subcategory_id: number;
  name: string;
  initial: number;
  revised: number;
  spent: number;
  remaining: number;
}

export interface MonthSectionTotals {
  initial: number;
  revised: number;
  spent: number;
  remaining: number;
}

export interface MonthSection {
  category_id: number;
  name: string;
  kind: CategoryKind;
  items: MonthItem[];
  totals: MonthSectionTotals;
}

export interface MonthSummary {
  income: number;
  budget_total: number;
  spent: number;
  invested: number;
  section_totals: Record<string, number>;
  remaining_in_bank: number;
  carry_forward: CarryForwardRow;
  spend_limit: number | null;
  notes: string | null;
}

export interface MonthView {
  year: number;
  month: number;
  month_name: string;
  sections: MonthSection[];
  summary: MonthSummary;
}

// ---- Annual rollup ----
export interface RollupItem {
  subcategory_id: number;
  name: string;
  initial: number;
  revised: number;
  spent: number;
  set_aside: number;
  current: number;
  remaining: number;
}

export interface RollupTotals {
  initial: number;
  revised: number;
  spent: number;
  set_aside: number;
  current: number;
  remaining: number;
}

export interface RollupSection {
  category_id: number;
  name: string;
  kind: CategoryKind;
  items: RollupItem[];
  totals: RollupTotals;
}

export interface PlanVsActualRow {
  section: string;
  annual_plan: number;
  ytd_budget: number;
  ytd_spent: number;
  variance: number;
  pct_of_ytd_budget: number;
  status: BudgetStatus;
}

export interface Rollup {
  year: number;
  month_names: string[];
  sections: RollupSection[];
  spend_grid: Record<string, number[]>;
  budget_grid: Record<string, number[]>;
  income_by_month: number[];
  plan_vs_actual: PlanVsActualRow[];
  totals: {
    annual_plan: number;
    spent: number;
    current: number;
    invested: number;
    income: number;
  };
  carry_forward: CarryForwardRow[];
}

// ---- Dashboard ----
export interface DashboardKpis {
  income: number;
  annual_plan: number;
  spent: number;
  invested: number;
  current: number;
  remaining_in_bank: number;
  elapsed_months: number;
}

export interface SectionSplit {
  name: string;
  kind: CategoryKind;
  spent: number;
  revised: number;
  current: number;
}

export interface MonthlyTrendPoint {
  month: string;
  budget: number;
  spent: number;
  invested: number;
  income: number;
}

export interface Dashboard {
  year: number;
  kpis: DashboardKpis;
  section_split: SectionSplit[];
  monthly_trend: MonthlyTrendPoint[];
  plan_vs_actual: PlanVsActualRow[];
}
