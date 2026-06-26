import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, TableProperties, SlidersHorizontal,
  Receipt, Wallet, Settings as SettingsIcon, ChevronLeft, ChevronRight,
  Menu, X, LogOut, type LucideIcon,
} from "lucide-react";
import { BudgetIQWordmark } from "./Logo";
import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "../lib/AppContext";
import { useAuth, logout } from "../lib/auth";
import { useYears, useCreateYear } from "../api/hooks";
import { MONTH_NAMES } from "../lib/format";
import { startTour, tourSeenKey } from "../lib/tour";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  tour?: string; // data-tour anchor for the guided tour
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true, tour: "nav-dashboard" },
  { to: "/month", label: "Month", icon: CalendarDays, tour: "nav-month" },
  { to: "/rollup", label: "Annual Rollup", icon: TableProperties },
  { to: "/setup", label: "Budget Setup", icon: SlidersHorizontal, tour: "nav-setup" },
  { to: "/transactions", label: "Transactions", icon: Receipt, tour: "nav-transactions" },
  { to: "/income", label: "Income", icon: Wallet, tour: "nav-income" },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

function YearMonthBar() {
  const { year, setYear, month, setMonth } = useApp();
  const { data: years = [] } = useYears();
  const createYear = useCreateYear();
  const { pathname } = useLocation();
  const showMonth = pathname.startsWith("/month");

  const ensureYear = async (y: number) => {
    if (!years.find((it) => it.year === y)) await createYear.mutateAsync({ year: y });
    setYear(y);
  };

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div className="flex shrink-0 items-center rounded-lg border border-line bg-surface">
        <button className="px-2 py-1.5 text-muted hover:text-ink" onClick={() => ensureYear(year - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-12 text-center text-sm font-semibold sm:min-w-14">{year}</span>
        <button className="px-2 py-1.5 text-muted hover:text-ink" onClick={() => ensureYear(year + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
      {showMonth && (
        <div className="flex shrink-0 items-center rounded-lg border border-line bg-surface">
          <button className="px-2 py-1.5 text-muted hover:text-ink" onClick={() => setMonth(month === 1 ? 12 : month - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-20 text-center text-sm font-semibold sm:min-w-24">{MONTH_NAMES[month - 1]}</span>
          <button className="px-2 py-1.5 text-muted hover:text-ink" onClick={() => setMonth(month === 12 ? 1 : month + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarNav({ onNavigate, withTourAnchors = false }: { onNavigate?: () => void; withTourAnchors?: boolean }) {
  return (
    <>
      <div className="px-5 py-5">
        <BudgetIQWordmark />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon, end, tour }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-tour={withTourAnchors ? tour : undefined}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive ? "bg-blue-50 text-brand" : "text-muted hover:bg-canvas hover:text-ink"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

function UserMenu() {
  const { data: user } = useAuth();
  return (
    <div className="ml-auto flex items-center gap-3">
      {user && <span className="hidden text-xs text-muted sm:inline">{user.email}</span>}
      <button
        onClick={() => logout()}
        className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition hover:bg-canvas hover:text-ink"
        title="Sign out"
      >
        <LogOut size={14} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();
  const { data: user } = useAuth();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [pathname]);

  // Auto-run the guided tour once, on the first dashboard visit after onboarding.
  useEffect(() => {
    if (!user || pathname !== "/") return;
    const key = tourSeenKey(user.id);
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    const t = setTimeout(() => startTour(), 700); // let the layout paint first
    return () => clearTimeout(t);
  }, [user, pathname]);

  return (
    <div className="flex h-full overflow-x-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <SidebarNav withTourAnchors />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <aside
            className="absolute left-0 top-0 flex h-full w-64 max-w-[80%] flex-col border-r border-line bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-3 top-4 text-muted hover:text-ink"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:px-6">
          <button
            className="text-muted hover:text-ink lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <YearMonthBar />
          <UserMenu />
        </header>
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
