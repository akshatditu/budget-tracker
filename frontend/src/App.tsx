import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./lib/AppContext";
import { ThemeProvider } from "./lib/theme";
import { useAuth, useAuthExpiryListener } from "./lib/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import MonthView from "./pages/MonthView";
import AnnualRollup from "./pages/AnnualRollup";
import BudgetSetup from "./pages/BudgetSetup";
import Transactions from "./pages/Transactions";
import Income from "./pages/Income";
import Goals from "./pages/Goals";
import Reconciliation from "./pages/Reconciliation";
import Guide from "./pages/Guide";
import Settings from "./pages/Settings";

export default function App() {
  useAuthExpiryListener();
  const { data: user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center text-sm text-muted">Loading…</div>
    );
  }

  // Signed-out visitors see the marketing landing page; /login keeps the bare
  // Google sign-in card reachable. Both route into the same OAuth flow.
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    );
  }

  // First-run users build their sections before entering the app.
  if (!user.onboarded) return <Onboarding />;

  return (
    <ThemeProvider>
      <AppProvider>
        <Layout>
          <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/month" element={<MonthView />} />
          <Route path="/rollup" element={<AnnualRollup />} />
          <Route path="/setup" element={<BudgetSetup />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/income" element={<Income />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/reconcile" element={<Reconciliation />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </AppProvider>
    </ThemeProvider>
  );
}
