import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { X, type LucideIcon } from "lucide-react";
import { money, type Numeric } from "../lib/format";

interface CardProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, action, children, className = "" }: CardProps) {
  return (
    <div className={`min-w-0 rounded-xl border border-line bg-surface shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

interface KpiCardProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  accent?: string;
  icon?: LucideIcon;
}

export function KpiCard({ label, value, sub, accent = "var(--color-brand)", icon: Icon }: KpiCardProps) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {Icon && (
          <span className="rounded-lg p-1.5" style={{ background: `${accent}1a`, color: accent }}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="mt-2 text-xl font-semibold text-ink sm:text-2xl">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
}

export function ProgressBar({ value, max, color = "var(--color-brand)" }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const over = max > 0 && value > max;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${ratio * 100}%`, background: over ? "#ef4444" : color }}
      />
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  OK: "bg-emerald-100 text-emerald-700",
  Watch: "bg-amber-100 text-amber-700",
  Over: "bg-red-100 text-red-700",
};

export function StatusChip({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

type ButtonVariant = "primary" | "ghost" | "outline" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-brand text-white hover:opacity-90",
    ghost: "text-muted hover:bg-canvas",
    outline: "border border-line text-ink hover:bg-canvas",
    danger: "text-red-600 hover:bg-red-50",
  };
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-surface shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-ink"><X size={18} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

interface EditableNumberProps {
  value: Numeric;
  onCommit: (value: number) => void;
  className?: string;
  align?: "left" | "right" | "center";
}

/** Inline-editable currency cell. Commits on blur / Enter. */
export function EditableNumber({ value, onCommit, className = "", align = "right" }: EditableNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? 0));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(String(value ?? 0)), [value]);
  useEffect(() => { if (editing) ref.current?.select(); }, [editing]);

  const commit = () => {
    setEditing(false);
    const n = Number(draft);
    if (!Number.isNaN(n) && n !== Number(value)) onCommit(n);
    else setDraft(String(value ?? 0));
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={`w-full rounded px-2 py-1 text-${align} hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200 ${className}`}
        title="Click to edit"
      >
        {money(value)}
      </button>
    );
  }
  return (
    <input
      ref={ref}
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { setEditing(false); setDraft(String(value ?? 0)); }
      }}
      className={`w-full rounded border border-brand px-2 py-1 text-${align} outline-none`}
    />
  );
}

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full min-w-0 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand ${props.className || ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full min-w-0 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand ${props.className || ""}`}
    />
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      {Icon && <Icon size={32} className="mb-3 text-muted" />}
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
