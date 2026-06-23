import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AppContext = createContext(null);
const now = new Date();

export function AppProvider({ children }) {
  const [year, setYear] = useState(() => Number(localStorage.getItem("bt.year")) || now.getFullYear());
  const [month, setMonth] = useState(() => Number(localStorage.getItem("bt.month")) || now.getMonth() + 1);

  useEffect(() => localStorage.setItem("bt.year", String(year)), [year]);
  useEffect(() => localStorage.setItem("bt.month", String(month)), [month]);

  const value = useMemo(() => ({ year, setYear, month, setMonth }), [year, month]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
