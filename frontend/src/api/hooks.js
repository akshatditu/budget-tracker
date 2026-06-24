import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

const get = (url, params) => api.get(url, { params }).then((r) => r.data);

// ---- user / settings ----
export const useMe = () => useQuery({ queryKey: ["me"], queryFn: () => get("/me") });
export const useUpdateMe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.patch("/me", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
};

// ---- years ----
export const useYears = () => useQuery({ queryKey: ["years"], queryFn: () => get("/years") });
export const useCreateYear = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post("/years", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["years"] }),
  });
};

// ---- catalog ----
export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: () => get("/categories") });
export const useSubcategories = (includeArchived = false) =>
  useQuery({
    queryKey: ["subcategories", includeArchived],
    queryFn: () => get("/subcategories", { include_archived: includeArchived }),
  });

const invalidateAll = (qc, year) => {
  ["categories", "subcategories"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  qc.invalidateQueries({ queryKey: ["year", year] });
};

export const useCatalogMutations = (year) => {
  const qc = useQueryClient();
  const done = () => invalidateAll(qc, year);
  return {
    createCategory: useMutation({ mutationFn: (b) => api.post("/categories", b), onSuccess: done }),
    updateCategory: useMutation({ mutationFn: ({ id, ...b }) => api.patch(`/categories/${id}`, b), onSuccess: done }),
    deleteCategory: useMutation({ mutationFn: (id) => api.delete(`/categories/${id}`), onSuccess: done }),
    createSubcategory: useMutation({ mutationFn: (b) => api.post("/subcategories", b), onSuccess: done }),
    updateSubcategory: useMutation({ mutationFn: ({ id, ...b }) => api.patch(`/subcategories/${id}`, b), onSuccess: done }),
    deleteSubcategory: useMutation({ mutationFn: (id) => api.delete(`/subcategories/${id}`), onSuccess: done }),
  };
};

// ---- budgets ----
export const useAnnualBudget = (year) =>
  useQuery({ queryKey: ["annual-budget", year], queryFn: () => get(`/years/${year}/annual-budget`), enabled: !!year });

export const useBudgetMutations = (year) => {
  const qc = useQueryClient();
  const done = () => {
    qc.invalidateQueries({ queryKey: ["annual-budget", year] });
    qc.invalidateQueries({ queryKey: ["month", year] });
    qc.invalidateQueries({ queryKey: ["rollup", year] });
    qc.invalidateQueries({ queryKey: ["dashboard", year] });
  };
  return {
    setAnnual: useMutation({
      mutationFn: ({ subcategory_id, initial_amount }) =>
        api.put(`/years/${year}/annual-budget/${subcategory_id}`, { initial_amount }),
      onSuccess: done,
    }),
    setAnnualRevised: useMutation({
      mutationFn: ({ subcategory_id, revised_amount }) =>
        api.patch(`/years/${year}/annual-budget/${subcategory_id}/revised`, { revised_amount }),
      onSuccess: done,
    }),
    patchMonthly: useMutation({
      mutationFn: ({ month, subcategory_id, revised_amount }) =>
        api.patch(`/years/${year}/months/${month}/budget/${subcategory_id}`, { revised_amount }),
      onSuccess: done,
    }),
  };
};

// ---- month view ----
export const useMonth = (year, month) =>
  useQuery({
    queryKey: ["month", year, month],
    queryFn: () => get(`/years/${year}/months/${month}`),
    enabled: !!year && !!month,
  });

// ---- transactions ----
export const useTransactions = (year, params = {}) =>
  useQuery({
    queryKey: ["transactions", year, params],
    queryFn: () => get(`/years/${year}/transactions`, params),
    enabled: !!year,
  });

export const useTransactionMutations = (year) => {
  const qc = useQueryClient();
  const done = () => {
    ["transactions", "month", "rollup", "dashboard"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k, year] })
    );
  };
  return {
    create: useMutation({ mutationFn: (b) => api.post(`/years/${year}/transactions`, b), onSuccess: done }),
    update: useMutation({ mutationFn: ({ id, ...b }) => api.patch(`/years/${year}/transactions/${id}`, b), onSuccess: done }),
    remove: useMutation({ mutationFn: (id) => api.delete(`/years/${year}/transactions/${id}`), onSuccess: done }),
  };
};

// ---- incomes ----
export const useIncomes = (year, month) =>
  useQuery({
    queryKey: ["incomes", year, month ?? "all"],
    queryFn: () => get(`/years/${year}/incomes`, month ? { month } : {}),
    enabled: !!year,
  });

export const useIncomeMutations = (year) => {
  const qc = useQueryClient();
  const done = () => {
    ["incomes", "month", "rollup", "dashboard"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k, year] })
    );
  };
  return {
    create: useMutation({ mutationFn: (b) => api.post(`/years/${year}/incomes`, b), onSuccess: done }),
    update: useMutation({ mutationFn: ({ id, ...b }) => api.patch(`/years/${year}/incomes/${id}`, b), onSuccess: done }),
    remove: useMutation({ mutationFn: (id) => api.delete(`/years/${year}/incomes/${id}`), onSuccess: done }),
  };
};

// ---- monthly settings ----
export const useMonthSettingMutation = (year) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, ...b }) => api.patch(`/years/${year}/months/${month}/settings`, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["month", year] });
      qc.invalidateQueries({ queryKey: ["rollup", year] });
    },
  });
};

// ---- rollup / dashboard ----
export const useRollup = (year) =>
  useQuery({ queryKey: ["rollup", year], queryFn: () => get(`/years/${year}/rollup`), enabled: !!year });
export const useDashboard = (year) =>
  useQuery({ queryKey: ["dashboard", year], queryFn: () => get(`/years/${year}/dashboard`), enabled: !!year });
