import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type {
  AnnualBudgetRow,
  AnnualBudgetSet,
  AnnualBudgetSetResult,
  AnnualRevisedPatch,
  AnnualRevisedResult,
  Category,
  CategoryCreate,
  CategoryUpdate,
  Dashboard,
  Income,
  IncomeCreate,
  IncomeUpdate,
  MonthlyBudgetPatch,
  MonthlyBudgetResult,
  MonthlySettingPatch,
  MonthlySettingResult,
  MonthView,
  OnboardingPayload,
  Rollup,
  Subcategory,
  SubcategoryCreate,
  SubcategoryUpdate,
  Transaction,
  TransactionCreate,
  TransactionFilter,
  TransactionUpdate,
  User,
  UserUpdate,
  Year,
  YearCreate,
} from "../types/api";

type QueryParams = Record<string, string | number | boolean | undefined>;

const get = <T>(url: string, params?: QueryParams): Promise<T> =>
  api.get<T>(url, { params }).then((r) => r.data);

// ---- user / settings ----
export const useMe = () => useQuery({ queryKey: ["me"], queryFn: () => get<User>("/me") });
export const useUpdateMe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UserUpdate) => api.patch<User>("/me", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
};

// ---- onboarding ----
export const useCompleteOnboarding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OnboardingPayload) => api.post<User>("/onboarding", body).then((r) => r.data),
    onSuccess: () => {
      // Refetch auth (flips `onboarded` true) and the freshly-created catalog.
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      ["categories", "subcategories"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
};

// ---- years ----
export const useYears = () => useQuery({ queryKey: ["years"], queryFn: () => get<Year[]>("/years") });
export const useCreateYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: YearCreate) => api.post<Year>("/years", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["years"] }),
  });
};

// ---- catalog ----
export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: () => get<Category[]>("/categories") });
export const useSubcategories = (includeArchived = false) =>
  useQuery({
    queryKey: ["subcategories", includeArchived],
    queryFn: () => get<Subcategory[]>("/subcategories", { include_archived: includeArchived }),
  });

const invalidateAll = (qc: QueryClient, year: number) => {
  ["categories", "subcategories"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  qc.invalidateQueries({ queryKey: ["year", year] });
};

export const useCatalogMutations = (year: number) => {
  const qc = useQueryClient();
  const done = () => invalidateAll(qc, year);
  return {
    createCategory: useMutation({
      mutationFn: (b: CategoryCreate) => api.post<Category>("/categories", b),
      onSuccess: done,
    }),
    updateCategory: useMutation({
      mutationFn: ({ id, ...b }: CategoryUpdate) => api.patch<Category>(`/categories/${id}`, b),
      onSuccess: done,
    }),
    deleteCategory: useMutation({
      mutationFn: (id: number) => api.delete<void>(`/categories/${id}`),
      onSuccess: done,
    }),
    createSubcategory: useMutation({
      mutationFn: (b: SubcategoryCreate) => api.post<Subcategory>("/subcategories", b),
      onSuccess: done,
    }),
    updateSubcategory: useMutation({
      mutationFn: ({ id, ...b }: SubcategoryUpdate) => api.patch<Subcategory>(`/subcategories/${id}`, b),
      onSuccess: done,
    }),
    deleteSubcategory: useMutation({
      mutationFn: (id: number) => api.delete<void>(`/subcategories/${id}`),
      onSuccess: done,
    }),
  };
};

// ---- budgets ----
export const useAnnualBudget = (year: number) =>
  useQuery({
    queryKey: ["annual-budget", year],
    queryFn: () => get<AnnualBudgetRow[]>(`/years/${year}/annual-budget`),
    enabled: !!year,
  });

export const useBudgetMutations = (year: number) => {
  const qc = useQueryClient();
  const done = () => {
    qc.invalidateQueries({ queryKey: ["annual-budget", year] });
    qc.invalidateQueries({ queryKey: ["month", year] });
    qc.invalidateQueries({ queryKey: ["rollup", year] });
    qc.invalidateQueries({ queryKey: ["dashboard", year] });
  };
  return {
    setAnnual: useMutation({
      mutationFn: ({ subcategory_id, initial_amount }: AnnualBudgetSet) =>
        api.put<AnnualBudgetSetResult>(`/years/${year}/annual-budget/${subcategory_id}`, { initial_amount }),
      onSuccess: done,
    }),
    setAnnualRevised: useMutation({
      mutationFn: ({ subcategory_id, revised_amount }: AnnualRevisedPatch) =>
        api.patch<AnnualRevisedResult>(`/years/${year}/annual-budget/${subcategory_id}/revised`, { revised_amount }),
      onSuccess: done,
    }),
    patchMonthly: useMutation({
      mutationFn: ({ month, subcategory_id, revised_amount }: MonthlyBudgetPatch) =>
        api.patch<MonthlyBudgetResult>(`/years/${year}/months/${month}/budget/${subcategory_id}`, { revised_amount }),
      onSuccess: done,
    }),
  };
};

// ---- month view ----
export const useMonth = (year: number, month: number) =>
  useQuery({
    queryKey: ["month", year, month],
    queryFn: () => get<MonthView>(`/years/${year}/months/${month}`),
    enabled: !!year && !!month,
  });

// ---- transactions ----
export const useTransactions = (year: number, params: TransactionFilter = {}) =>
  useQuery({
    queryKey: ["transactions", year, params],
    queryFn: () => get<Transaction[]>(`/years/${year}/transactions`, params),
    enabled: !!year,
  });

export const useTransactionMutations = (year: number) => {
  const qc = useQueryClient();
  const done = () => {
    ["transactions", "month", "rollup", "dashboard"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k, year] })
    );
  };
  return {
    create: useMutation({
      mutationFn: (b: TransactionCreate) => api.post<Transaction>(`/years/${year}/transactions`, b),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, ...b }: TransactionUpdate) => api.patch<Transaction>(`/years/${year}/transactions/${id}`, b),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.delete<void>(`/years/${year}/transactions/${id}`),
      onSuccess: done,
    }),
  };
};

// ---- incomes ----
export const useIncomes = (year: number, month?: number) =>
  useQuery({
    queryKey: ["incomes", year, month ?? "all"],
    queryFn: () => get<Income[]>(`/years/${year}/incomes`, month ? { month } : {}),
    enabled: !!year,
  });

export const useIncomeMutations = (year: number) => {
  const qc = useQueryClient();
  const done = () => {
    ["incomes", "month", "rollup", "dashboard"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k, year] })
    );
  };
  return {
    create: useMutation({
      mutationFn: (b: IncomeCreate) => api.post<Income>(`/years/${year}/incomes`, b),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, ...b }: IncomeUpdate) => api.patch<Income>(`/years/${year}/incomes/${id}`, b),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: number) => api.delete<void>(`/years/${year}/incomes/${id}`),
      onSuccess: done,
    }),
  };
};

// ---- monthly settings ----
export const useMonthSettingMutation = (year: number) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, ...b }: MonthlySettingPatch) =>
      api.patch<MonthlySettingResult>(`/years/${year}/months/${month}/settings`, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["month", year] });
      qc.invalidateQueries({ queryKey: ["rollup", year] });
    },
  });
};

// ---- rollup / dashboard ----
export const useRollup = (year: number) =>
  useQuery({ queryKey: ["rollup", year], queryFn: () => get<Rollup>(`/years/${year}/rollup`), enabled: !!year });
export const useDashboard = (year: number) =>
  useQuery({ queryKey: ["dashboard", year], queryFn: () => get<Dashboard>(`/years/${year}/dashboard`), enabled: !!year });
