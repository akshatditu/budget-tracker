import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./lib/AppContext";
import { ThemeProvider } from "./lib/theme";
import { useAuth, useAuthExpiryListener } from "./lib/auth";
import type { User } from "./types/api";
import Layout from "./components/Layout";
import AppLoader from "./components/AppLoader";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import MonthView from "./pages/MonthView";
import AnnualRollup from "./pages/AnnualRollup";
import BudgetSetup from "./pages/BudgetSetup";
import Transactions from "./pages/Transactions";
import Income from "./pages/Income";
import NetWorth from "./pages/NetWorth";
import Goals from "./pages/Goals";
import Reconciliation from "./pages/Reconciliation";
import Guide from "./pages/Guide";
import Settings from "./pages/Settings";

// Mounted at /dashboard/*. First-run users build their sections before
// entering the app; everyone else gets the full authenticated shell.
function DashboardApp({ user }: { user: User }) {
  if (!user.onboarded) return <ThemeProvider><Onboarding /></ThemeProvider>;

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
          <Route path="/assets" element={<NetWorth />} />
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

export default function App() {
  useAuthExpiryListener();
  const { data: user, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoader />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/dashboard/*"
        element={user ? <DashboardApp user={user} /> : <Navigate to="/" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
