import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface AppContextValue {
  year: number;
  setYear: Dispatch<SetStateAction<number>>;
  month: number;
  setMonth: Dispatch<SetStateAction<number>>;
}

const AppContext = createContext<AppContextValue | null>(null);
const now = new Date();

export function AppProvider({ children }: { children: ReactNode }) {
  const [year, setYear] = useState<number>(() => Number(localStorage.getItem("bt.year")) || now.getFullYear());
  const [month, setMonth] = useState<number>(() => Number(localStorage.getItem("bt.month")) || now.getMonth() + 1);

  useEffect(() => localStorage.setItem("bt.year", String(year)), [year]);
  useEffect(() => localStorage.setItem("bt.month", String(month)), [month]);

  const value = useMemo<AppContextValue>(() => ({ year, setYear, month, setMonth }), [year, month]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
