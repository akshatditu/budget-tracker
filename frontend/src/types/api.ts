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

export interface FixedBill {
  name: string;
  amount: number;
}

export interface OnboardingPayload {
  sections: OnboardingSection[];
  employment_type?: "salaried" | "business";
  monthly_income?: number;
  fixed_bills?: FixedBill[];
}

export interface GenerateBudgetPayload extends OnboardingPayload {
  override_mode: "replace" | "forward";
}

// ---- AI budget revision ----
export interface RevisionGeneratePayload {
  /** Free-text "what's changed"; empty/omitted means nothing changed. */
  user_note?: string;
}

export interface RevisionItem {
  subcategory_id: number;
  name: string;
  section: string;
  kind: CategoryKind;
  current_annual: number;
  revised_annual: number;
  /** revised_annual - current_annual (positive = increased). */
  delta: number;
  reason: string | null;
}

export interface BudgetRevisionDraft {
  id: number;
  year: number;
  status: "pending" | "accepted";
  user_note: string | null;
  created_at: string;
  items: RevisionItem[];
  insights: string[];
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
  /** Opt-in envelope rollover: unspent budget carries into next month. */
  rollover: boolean;
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
  rollover?: boolean;
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
  /** Whether envelope rollover is active for this item. */
  rollover: boolean;
  initial: number;
  revised: number;
  spent: number;
  /** Surplus/deficit carried in from prior months (0 unless rollover). */
  rolled_in: number;
  /** revised + rolled_in — the spendable envelope this month. */
  available: number;
  /** available - spent — carries into next month when rollover is on. */
  rolled_out: number;
  remaining: number;
}

export interface MonthSectionTotals {
  initial: number;
  revised: number;
  spent: number;
  rolled_in: number;
  available: number;
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
  /** Days remaining in the month (0 for past months, full length for future). */
  days_left: number;
  /** Spending-only remaining budget paced over the days left in the month. */
  safe_to_spend_today: number;
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
  /** Elapsed-month overspend (sum of max(0, spent - revised)), surfaced explicitly. */
  overspent: number;
  /** Net budget slack after overspend is netted out: set_aside - overspent. */
  available: number;
  current: number;
  remaining: number;
}

export interface RollupTotals {
  initial: number;
  revised: number;
  spent: number;
  set_aside: number;
  overspent: number;
  available: number;
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
  kind: CategoryKind;
  annual_plan: number;
  ytd_budget: number;
  ytd_spent: number;
  variance: number;
  pct_of_ytd_budget: number;
  status: BudgetStatus;
  /** Year-end spend projected from the elapsed-month burn rate. */
  projected_annual: number;
  /** annual_plan - projected_annual (positive = under plan). */
  projected_variance: number;
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
    overspent: number;
    available: number;
    invested: number;
    income: number;
  };
  carry_forward: CarryForwardRow[];
}

// ---- Goals (sinking funds) ----
export interface GoalSubcategoryLink {
  id: number;
  subcategory_id: number | null;
  subcategory_name: string | null;
  /** Computed at read time: min(goal.target, available_pool) / subcat_unspent * 100 */
  auto_weight: number;
}

export interface GoalSubcategoryLinkCreate {
  subcategory_id: number;
}

export interface SubcatUnspent {
  unspent: number;
  claimed: number;
  available: number;
}

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  target_date: string | null;
  archived: boolean;
  /** Weighted subcategory links; empty → falls back to manual contributions. */
  links: GoalSubcategoryLink[];
  /** Weighted sum of subcategory remaining (or manual contributions when no links). */
  saved: number;
  remaining: number;
  pct: number;
  /** Remaining ÷ months left to the target date; null when no target date. */
  monthly_required: number | null;
  /** Saved vs a straight-line schedule; null when no target date. */
  on_track: boolean | null;
}

export interface GoalCreate {
  name: string;
  target_amount: number;
  target_date?: string | null;
}

export interface GoalUpdate {
  id: number;
  name?: string;
  target_amount?: number;
  target_date?: string | null;
  archived?: boolean;
}

export interface GoalContribution {
  id: number;
  goal_id: number;
  amount: number;
  contrib_date: string;
  note: string | null;
}

export interface GoalContributionCreate {
  amount: number;
  contrib_date: string;
  note?: string | null;
}

// ---- Reconciliation ----
export interface BalanceSnapshot {
  id: number;
  as_of_date: string;
  actual_balance: number;
  /** Computed carry-forward balance at that month. */
  expected_balance: number;
  /** actual_balance - expected_balance. */
  drift: number;
  note: string | null;
}

export interface BalanceSnapshotCreate {
  as_of_date: string;
  actual_balance: number;
  note?: string | null;
}

// ---- Dashboard ----
export interface DashboardKpis {
  income: number;
  annual_plan: number;
  spent: number;
  invested: number;
  current: number;
  overspent: number;
  remaining_in_bank: number;
  /** Year-end spend projected from the elapsed-month burn rate. */
  projected_spend: number;
  /** income - projected_spend. */
  projected_remaining_in_bank: number;
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
