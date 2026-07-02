import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, TableProperties, SlidersHorizontal,
  Receipt, Wallet, Target, Scale, BookOpen, Settings as SettingsIcon, ChevronLeft, ChevronRight,
  X, LogOut, Moon, Sun, Plus, Home, BarChart3, MoreHorizontal, type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "../lib/AppContext";
import { useTheme } from "../lib/theme";
import AddExpenseSheet from "./AddExpenseSheet";
import { useAuth, logout } from "../lib/auth";
import { useYears, useCreateYear } from "../api/hooks";
import { MONTH_NAMES, MONTH_SHORT } from "../lib/format";
import { startTour, tourSeenKey } from "../lib/tour";
import { BudgetIQIcon } from "./Logo";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  tour?: string; // data-tour anchor for the guided tour
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true, tour: "nav-dashboard" },
  { to: "/dashboard/month", label: "Month", icon: CalendarDays, tour: "nav-month" },
  { to: "/dashboard/rollup", label: "Annual Rollup", icon: TableProperties },
  { to: "/dashboard/setup", label: "Budget Setup", icon: SlidersHorizontal, tour: "nav-setup" },
  { to: "/dashboard/transactions", label: "Transactions", icon: Receipt, tour: "nav-transactions" },
  { to: "/dashboard/income", label: "Income", icon: Wallet, tour: "nav-income" },
  { to: "/dashboard/goals", label: "Goals", icon: Target },
  { to: "/dashboard/reconcile", label: "Reconcile", icon: Scale },
  { to: "/dashboard/guide", label: "Guide", icon: BookOpen },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

/** BudgetIQ mark + gradient wordmark, matching the brand design. */
function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <BudgetIQIcon size={36} className="shrink-0" />
      <span
        className="text-[19px] font-extrabold tracking-tight"
        style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
      >
        Budget
        <span className="bg-gradient-to-br from-[#0f9d8f] to-[#7c3aed] bg-clip-text text-transparent">
          IQ
        </span>
      </span>
    </div>
  );
}

/** Light/dark toggle (sidebar footer). */
function ThemeControls() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-between gap-2 rounded-full border border-line bg-surface2 px-3.5 py-2 text-[12px] font-bold text-ink"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

function YearMonthBar({ mobile = false }: { mobile?: boolean }) {
  const { year, setYear, month, setMonth } = useApp();
  const { data: years = [] } = useYears();
  const createYear = useCreateYear();
  const { pathname } = useLocation();
  // The month nav only belongs on the Month view, where it's actionable.
  const showMonth = pathname.startsWith("/dashboard/month");

  // Fall back to the most recent existing year if the stored one is gone.
  useEffect(() => {
    if (years.length > 0 && !years.find((it) => it.year === year)) {
      setYear(years[0].year);
    }
  }, [years, year, setYear]);

  const ensureYear = async (y: number) => {
    if (!years.find((it) => it.year === y)) await createYear.mutateAsync({ year: y });
    setYear(y);
  };

  const pill = "flex shrink-0 items-center rounded-full border border-line bg-surface2";
  const arrow = "px-2 py-1.5 text-dim transition hover:text-ink";

  const yearPill = (
    <div className={pill}>
      <button className={arrow} onClick={() => ensureYear(year - 1)}><ChevronLeft size={15} /></button>
      <span className="num min-w-9 text-center text-sm font-bold">{year}</span>
      <button className={arrow} onClick={() => ensureYear(year + 1)}><ChevronRight size={15} /></button>
    </div>
  );
  const monthPill = showMonth && (
    <div className={pill}>
      <button className={arrow} onClick={() => setMonth(month === 1 ? 12 : month - 1)}><ChevronLeft size={15} /></button>
      <span className="min-w-12 text-center text-sm font-bold">{mobile ? MONTH_SHORT[month - 1] : MONTH_NAMES[month - 1]}</span>
      <button className={arrow} onClick={() => setMonth(month === 12 ? 1 : month + 1)}><ChevronRight size={15} /></button>
    </div>
  );

  return (
    <div className="flex min-w-0 items-center gap-2">
      {mobile ? <>{monthPill}{yearPill}</> : <>{yearPill}{monthPill}</>}
    </div>
  );
}

/** Per-screen title shown in the mobile header (the body's own h1 is hidden on mobile). */
const SCREEN_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/rollup": "Reports",
  "/dashboard/setup": "Budget Setup",
  "/dashboard/transactions": "Transactions",
  "/dashboard/income": "Income",
  "/dashboard/goals": "Goals",
  "/dashboard/reconcile": "Reconcile",
  "/dashboard/guide": "Guide",
  "/dashboard/settings": "Settings",
};

/** Mobile header brand eyebrow + the current screen's title (the Month view shows the month). */
function MobileHeading() {
  const { month } = useApp();
  const { pathname } = useLocation();
  const title = pathname.startsWith("/dashboard/month") ? MONTH_NAMES[month - 1] : SCREEN_TITLES[pathname] ?? "Overview";
  return (
    <div className="min-w-0">
      <div className="truncate text-[11px] font-bold leading-none tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        Budget
        <span className="bg-gradient-to-br from-[#0f9d8f] to-[#7c3aed] bg-clip-text font-extrabold text-transparent">
          IQ
        </span>
      </div>
      <h1 className="truncate text-[17px] font-extrabold leading-tight tracking-tight">{title}</h1>
    </div>
  );
}

function SidebarNav({ onNavigate, withTourAnchors = false }: { onNavigate?: () => void; withTourAnchors?: boolean }) {
  return (
    <nav className="flex flex-col gap-[3px] px-3">
      {NAV.map(({ to, label, icon: Icon, end, tour }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          data-tour={withTourAnchors ? tour : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-[var(--radiusSm)] px-3 py-[11px] text-sm font-bold transition ${
              isActive ? "" : "text-dim hover:bg-surface2 hover:text-ink"
            }`
          }
          style={({ isActive }) =>
            isActive ? { background: "var(--accentSoft)", color: "var(--accent2)" } : undefined
          }
        >
          <Icon size={17} className="w-5 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserRow() {
  const { data: user } = useAuth();
  const initial = (user?.email?.[0] || "A").toUpperCase();
  return (
    <div className="flex items-center gap-2.5 px-1.5 py-1">
      <div
        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-xs font-extrabold"
        style={{ background: "var(--accentSoft)", color: "var(--accent2)" }}
      >
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11.5px] font-bold">{user?.email || "Signed in"}</div>
        <button onClick={() => logout()} className="flex items-center gap-1 text-[10.5px] font-semibold text-faint hover:text-ink">
          <LogOut size={11} /> Sign out
        </button>
      </div>
    </div>
  );
}

/** Bottom tab bar (mobile). The center ＋ opens the quick-add expense sheet. */
function BottomNav({ onMore, onAdd }: { onMore: () => void; onAdd: () => void }) {
  const { pathname } = useLocation();
  const tab = (active: boolean) =>
    active ? "var(--accent)" : "var(--faint)";
  const Item = ({ to, icon: Icon, label }: { to: string; icon: LucideIcon; label: string }) => (
    <NavLink to={to} end={to === "/dashboard"} className="flex flex-1 flex-col items-center gap-[3px]" style={({ isActive }) => ({ color: tab(isActive) })}>
      <Icon size={19} />
      <span className="text-[10px] font-bold">{label}</span>
    </NavLink>
  );
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-around border-t border-line bg-surface px-3 pb-[max(14px,env(safe-area-inset-bottom))] pt-2 lg:hidden"
      style={{ boxShadow: "0 -6px 24px rgba(0,0,0,.06)" }}
    >
      <Item to="/dashboard" icon={Home} label="Home" />
      <Item to="/dashboard/month" icon={CalendarDays} label="Month" />
      <button onClick={onAdd} className="flex flex-1 justify-center">
        <span
          className="-mt-5 grid h-[54px] w-[54px] place-items-center rounded-[18px] text-white"
          style={{ background: "var(--accent)", boxShadow: "0 8px 20px color-mix(in srgb, var(--accent) 45%, transparent)" }}
        >
          <Plus size={26} />
        </span>
      </button>
      <Item to="/dashboard/rollup" icon={BarChart3} label="Reports" />
      <button
        onClick={onMore}
        className="flex flex-1 flex-col items-center gap-[3px]"
        style={{ color: ["/dashboard/setup", "/dashboard/income", "/dashboard/goals", "/dashboard/reconcile", "/dashboard/guide", "/dashboard/settings"].includes(pathname) ? "var(--accent)" : "var(--faint)" }}
      >
        <MoreHorizontal size={19} />
        <span className="text-[10px] font-bold">More</span>
      </button>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { pathname } = useLocation();
  const { data: user } = useAuth();

  useEffect(() => setDrawerOpen(false), [pathname]);

  // Auto-run the guided tour once, on the first dashboard visit after onboarding.
  useEffect(() => {
    if (!user || pathname !== "/dashboard") return;
    const key = tourSeenKey(user.id);
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    const t = setTimeout(() => startTour(), 700);
    return () => clearTimeout(t);
  }, [user, pathname]);

  return (
    <div className="flex h-full overflow-x-hidden" style={{ background: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden w-[252px] shrink-0 flex-col border-r border-line bg-surface px-3.5 py-5 lg:flex">
        <div className="px-2.5 pb-5">
          <BrandMark />
        </div>
        <SidebarNav withTourAnchors />
        <div className="flex-1" />
        <div className="flex flex-col gap-2.5 border-t border-line px-1.5 pt-3">
          <ThemeControls />
          <UserRow />
        </div>
      </aside>

      {/* Mobile "More" drawer (full nav) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40 anim-fade" />
          <aside
            className="absolute right-0 top-0 flex h-full w-72 max-w-[82%] flex-col border-l border-line bg-surface py-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pb-4">
              <BrandMark />
              <button className="text-dim hover:text-ink" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
            <div className="flex-1" />
            <div className="flex flex-col gap-2.5 border-t border-line px-4 pt-3">
              <ThemeControls />
              <UserRow />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 sm:px-7 lg:h-16 lg:py-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <BudgetIQIcon size={34} className="shrink-0" />
              <MobileHeading />
            </div>
            <div className="hidden lg:block"><YearMonthBar /></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="lg:hidden"><YearMonthBar mobile /></div>
            <button
              onClick={() => setAddOpen(true)}
              className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold text-white lg:flex"
              style={{ background: "var(--accent)" }}
            >
              <Plus size={15} /> Add expense
            </button>
          </div>
        </header>
        <main className="scwrap min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 pb-28 sm:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      <BottomNav onMore={() => setDrawerOpen(true)} onAdd={() => setAddOpen(true)} />
      <AddExpenseSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
