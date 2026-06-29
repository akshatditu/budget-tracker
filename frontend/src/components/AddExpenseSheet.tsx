import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useApp } from "../lib/AppContext";
import { useCategories, useSubcategories, useTransactionMutations } from "../api/hooks";
import { sectionColor, MONTH_NAMES } from "../lib/format";
import { Sheet } from "./ui";

/**
 * The mobile design's two-step quick-add expense flow:
 *   1. pick a group (category)  2. pick an item (subcategory) + amount + note.
 * Records against the first of the currently-selected month/year.
 */
export default function AddExpenseSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { year, month } = useApp();
  const { data: categories = [] } = useCategories();
  const { data: subs = [] } = useSubcategories();
  const { create } = useTransactionMutations(year);

  const [catId, setCatId] = useState<number | null>(null);
  const [subId, setSubId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const items = useMemo(() => subs.filter((s) => s.category_id === catId && !s.archived), [subs, catId]);

  const reset = () => { setCatId(null); setSubId(null); setAmount(""); setNote(""); };
  const close = () => { reset(); onClose(); };

  const commit = () => {
    if (!subId || !amount) return;
    create.mutate(
      { subcategory_id: subId, txn_date: `${year}-${String(month).padStart(2, "0")}-01`, amount: Number(amount), note: note || null },
      { onSuccess: close },
    );
  };

  const catName = categories.find((c) => c.id === catId)?.name ?? "";

  return (
    <Sheet open={open} onClose={close} title="Add expense">
      {catId === null ? (
        <>
          <div className="my-2.5 text-xs font-bold text-dim">Which group?</div>
          <div className="flex flex-col gap-2.5">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCatId(c.id)}
                className="flex items-center justify-between rounded-[var(--radiusSm)] border border-line bg-surface px-4 py-3.5 text-sm font-bold transition hover:bg-surface2"
              >
                <span className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: sectionColor(c.name) }} />
                  {c.name}
                </span>
                <span className="text-faint">›</span>
              </button>
            ))}
            {categories.length === 0 && <p className="py-4 text-center text-xs text-dim">No sections yet — add some in Budget Setup.</p>}
          </div>
        </>
      ) : (
        <>
          <button onClick={() => { setCatId(null); setSubId(null); }} className="mb-2 mt-2 flex items-center gap-1.5 text-[12.5px] font-bold text-accent2">
            <ChevronLeft size={14} /> {catName}
          </button>
          <div className="mb-2.5 text-xs font-bold text-dim">Pick a category</div>
          <div className="flex flex-wrap gap-2">
            {items.map((s) => {
              const on = s.id === subId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSubId(s.id)}
                  className="flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-bold transition"
                  style={on
                    ? { borderColor: "var(--accent)", background: "var(--accentSoft)", color: "var(--accent2)" }
                    : { borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
                >
                  <span className="h-[7px] w-[7px] rounded-[2px]" style={{ background: sectionColor(catName) }} />
                  {s.name}
                </button>
              );
            })}
            {items.length === 0 && <p className="py-2 text-xs text-dim">No items in {catName}.</p>}
          </div>

          {subId !== null && (
            <>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="numeric"
                placeholder="Amount ₹"
                className="num mt-4 w-full rounded-[var(--radiusXs)] border border-line px-3.5 py-3.5 text-[15px] font-bold text-ink outline-none focus:border-[var(--accent)]"
                style={{ background: "var(--bg)" }}
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (optional)"
                className="mt-2.5 w-full rounded-[var(--radiusXs)] border border-line px-3.5 py-3.5 text-sm text-ink outline-none focus:border-[var(--accent)]"
                style={{ background: "var(--bg)" }}
              />
              <button
                onClick={commit}
                disabled={!amount || create.isPending}
                className="mt-3.5 w-full rounded-[var(--radiusSm)] py-4 text-[15px] font-extrabold text-white transition disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {create.isPending ? "Adding…" : `Add to ${MONTH_NAMES[month - 1]}`}
              </button>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
