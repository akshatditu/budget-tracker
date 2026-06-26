import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./lib/AppContext";
import { useAuth, useAuthExpiryListener } from "./lib/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MonthView from "./pages/MonthView";
import AnnualRollup from "./pages/AnnualRollup";
import BudgetSetup from "./pages/BudgetSetup";
import Transactions from "./pages/Transactions";
import Income from "./pages/Income";
import Settings from "./pages/Settings";

export default function App() {
  useAuthExpiryListener();
  const { data: user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted">Loading…</div>
    );
  }

  if (!user) return <Login />;

  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/month" element={<MonthView />} />
          <Route path="/rollup" element={<AnnualRollup />} />
          <Route path="/setup" element={<BudgetSetup />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/income" element={<Income />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
}
