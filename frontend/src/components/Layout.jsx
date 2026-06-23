import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, TableProperties, SlidersHorizontal,
  Receipt, Wallet, Settings as SettingsIcon, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useApp } from "../lib/AppContext";
import { useYears, useCreateYear } from "../api/hooks";
import { MONTH_NAMES } from "../lib/format";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/month", label: "Month", icon: CalendarDays },
  { to: "/rollup", label: "Annual Rollup", icon: TableProperties },
  { to: "/setup", label: "Budget Setup", icon: SlidersHorizontal },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/income", label: "Income", icon: Wallet },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

function YearMonthBar() {
  const { year, setYear, month, setMonth } = useApp();
  const { data: years = [] } = useYears();
  const createYear = useCreateYear();
  const { pathname } = useLocation();
  const showMonth = pathname.startsWith("/month");

  const ensureYear = async (y) => {
    if (!years.find((it) => it.year === y)) await createYear.mutateAsync({ year: y });
    setYear(y);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg border border-line bg-surface">
        <button className="px-2 py-1.5 text-muted hover:text-ink" onClick={() => ensureYear(year - 1)}>
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-14 text-center text-sm font-semibold">{year}</span>
        <button className="px-2 py-1.5 text-muted hover:text-ink" onClick={() => ensureYear(year + 1)}>
          <ChevronRight size={16} />
        </button>
      </div>
      {showMonth && (
        <div className="flex items-center rounded-lg border border-line bg-surface">
          <button className="px-2 py-1.5 text-muted hover:text-ink" onClick={() => setMonth(month === 1 ? 12 : month - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-24 text-center text-sm font-semibold">{MONTH_NAMES[month - 1]}</span>
          <button className="px-2 py-1.5 text-muted hover:text-ink" onClick={() => setMonth(month === 12 ? 1 : month + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <div className="flex h-full">
      <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-surface">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">₹</div>
          <span className="font-semibold">Budget Tracker</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-indigo-50 text-brand" : "text-muted hover:bg-canvas hover:text-ink"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
          <YearMonthBar />
          <span className="text-xs text-muted">Personal finance, connected.</span>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
