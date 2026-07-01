import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
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
    <div className={`min-w-0 rounded-[var(--radius)] border border-line bg-surface shadow-[var(--shadow)] ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-extrabold tracking-tight text-ink">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
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

export function KpiCard({ label, value, sub, accent = "var(--accent)", icon: Icon }: KpiCardProps) {
  return (
    <div className="min-w-0 rounded-[var(--radiusSm)] border border-line bg-surface p-4 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold uppercase tracking-[.05em] text-dim">{label}</span>
        {Icon && (
          <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)`, color: accent }}>
            <Icon size={15} />
          </span>
        )}
      </div>
      <div className="num mt-1.5 text-[23px] font-extrabold tracking-tight text-ink">{value}</div>
      {sub && <div className="mt-1 text-xs font-medium text-dim">{sub}</div>}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
}

export function ProgressBar({ value, max, color = "var(--accent)" }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const over = max > 0 && value > max;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${ratio * 100}%`, background: over ? "var(--neg)" : color }}
      />
    </div>
  );
}

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  OK: { bg: "color-mix(in srgb, var(--pos) 15%, transparent)", fg: "var(--pos)" },
  Watch: { bg: "color-mix(in srgb, var(--warn) 18%, transparent)", fg: "var(--warn)" },
  Over: { bg: "color-mix(in srgb, var(--neg) 15%, transparent)", fg: "var(--neg)" },
};

export function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || { bg: "var(--surface2)", fg: "var(--dim)" };
  return (
    <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: s.bg, color: s.fg }}>
      {status}
    </span>
  );
}

type ButtonVariant = "primary" | "ghost" | "outline" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className = "", style, ...props }: ButtonProps) {
  const styles: Record<ButtonVariant, string> = {
    primary: "text-white hover:opacity-90",
    ghost: "text-dim hover:bg-surface2",
    outline: "border border-line text-ink hover:bg-surface2",
    danger: "hover:bg-surface2",
  };
  const inline: Record<ButtonVariant, CSSProperties> = {
    primary: { background: "var(--accent)" },
    ghost: {},
    outline: { background: "var(--surface)" },
    danger: { color: "var(--neg)" },
  };
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-[var(--radiusSm)] px-4 py-2 text-[13px] font-bold transition disabled:opacity-50 ${styles[variant]} ${className}`}
      style={{ ...inline[variant], ...style }}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 anim-fade" onClick={onClose}>
      <div className="w-full max-w-md rounded-[var(--radius)] border border-line bg-surface shadow-[var(--shadow)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="text-[15px] font-extrabold tracking-tight">{title}</h3>
          <button onClick={onClose} className="grid h-[30px] w-[30px] place-items-center rounded-full bg-surface2 text-dim hover:text-ink"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}

/** Bottom sheet — slides up from the bottom on mobile, centers as a card on sm+.
 *  Mirrors the BudgetIQ mobile design's item-detail / quick-add sheets. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45 anim-fade" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="scwrap anim-sheet relative max-h-[88%] w-full overflow-y-auto rounded-t-[26px] border border-line bg-surface px-5 pb-8 pt-2 shadow-[var(--shadow)] sm:max-w-md sm:rounded-[var(--radius)] sm:pt-5"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full sm:hidden" style={{ background: "var(--border)" }} />
        {title && (
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-[18px] font-extrabold tracking-tight">{title}</h3>
            <button onClick={onClose} className="grid h-[30px] w-[30px] place-items-center rounded-full bg-surface2 text-dim hover:text-ink"><X size={16} /></button>
          </div>
        )}
        {children}
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

/** Round to 2 decimals so editing doesn't surface float noise (e.g. 35312.98000000001). */
const toDraft = (v: Numeric) => String(Math.round((Number(v) || 0) * 100) / 100);

/** Inline-editable currency cell. Commits on blur / Enter. */
export function EditableNumber({ value, onCommit, className = "", align = "right" }: EditableNumberProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(toDraft(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(toDraft(value)), [value]);
  useEffect(() => { if (editing) ref.current?.select(); }, [editing]);

  const commit = () => {
    setEditing(false);
    const n = Number(draft);
    if (!Number.isNaN(n) && n !== Number(value)) onCommit(n);
    else setDraft(toDraft(value));
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={`num w-full rounded px-2 py-1 text-${align} transition hover:bg-accentsoft ${className}`}
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
        if (e.key === "Escape") { setEditing(false); setDraft(toDraft(value)); }
      }}
      className={`num w-full rounded-[var(--radiusXs)] border px-2 py-1 text-${align} outline-none`}
      style={{ borderColor: "var(--accent)", background: "var(--bg)", color: "var(--text)" }}
    />
  );
}

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-bold text-dim">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full min-w-0 rounded-[var(--radiusXs)] border border-line px-3.5 py-3 text-base font-semibold text-ink outline-none transition focus:border-[var(--accent)] ${props.className || ""}`}
      style={{ background: "var(--bg)", ...props.style }}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full min-w-0 rounded-[var(--radiusXs)] border border-line px-3.5 py-3 text-base font-semibold text-ink outline-none transition focus:border-[var(--accent)] ${props.className || ""}`}
      style={{ background: "var(--bg)", ...props.style }}
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
    <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-line bg-surface px-6 py-12 text-center">
      {Icon && <Icon size={32} className="mb-3 text-faint" />}
      <p className="text-sm font-bold text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs font-medium text-dim">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
