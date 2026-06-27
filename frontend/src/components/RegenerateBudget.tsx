import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useApp } from "../lib/AppContext";
import { useAnnualBudget, useCategories, useSubcategories, useIncomes, useRegenerateBudget } from "../api/hooks";
import { sectionColor } from "../lib/format";
import { Button } from "./ui";
import BudgetWizard, { PRESETS, type PresetSection, type WizardInitial } from "./BudgetWizard";

const BILLS = "Bills";

/** "Build my budget with AI" — opens the wizard pre-filled with the user's current catalog
 *  so they can re-run the AI allocator on the selected year. Used on Dashboard + Budget Setup. */
export default function RegenerateBudget({ className = "" }: { className?: string }) {
  const { year } = useApp();
  const [open, setOpen] = useState(false);
  const { data: categories = [] } = useCategories();
  const { data: subs = [] } = useSubcategories();
  const { data: budget = [] } = useAnnualBudget(year);
  const { data: incomes = [] } = useIncomes(year, new Date().getMonth() + 1);
  const regen = useRegenerateBudget(year);

  // Build wizard sections from the user's real catalog, pre-selecting their existing items.
  const { sections, initial } = useMemo(() => {
    const monthlyBySub: Record<number, number> = Object.fromEntries(
      budget.map((b) => [b.subcategory_id, b.initial_annual / 12])
    );
    const sections: PresetSection[] = categories.map((c) => {
      const preset = PRESETS.find((p) => p.name.toLowerCase() === c.name.toLowerCase());
      return {
        name: c.name,
        kind: c.kind,
        blurb: preset?.blurb ?? "Pick the items to include.",
        accent: sectionColor(c.name),
        options: preset?.options ?? [],
      };
    });
    const selected: Record<string, string[]> = Object.fromEntries(
      categories.map((c) => [c.name, subs.filter((s) => s.category_id === c.id).map((s) => s.name)])
    );
    // Pre-fill fixed bills from current Bills items that already have an amount.
    const billsCat = categories.find((c) => c.name.toLowerCase() === BILLS.toLowerCase());
    const bills = billsCat
      ? subs
          .filter((s) => s.category_id === billsCat.id)
          .map((s) => ({ name: s.name, amount: Math.round(monthlyBySub[s.id] ?? 0) }))
          .filter((b) => b.amount > 0)
      : [];
    const income = incomes[0]?.amount ? String(Math.round(incomes[0].amount)) : "";
    const employment = (incomes[0]?.source === "Business" ? "business" : "salaried") as "salaried" | "business";
    return { sections, initial: { selected, employment, income, bills } as WizardInitial };
  }, [categories, subs, budget, incomes]);

  return (
    <>
      <Button variant="outline" className={className} onClick={() => setOpen(true)}>
        <Sparkles size={16} /> Build with AI
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <BudgetWizard
              sections={sections}
              initial={initial}
              showOverride
              submitLabel="Rebuild budget"
              onClose={() => setOpen(false)}
              onFinish={(p) =>
                regen.mutate(
                  { ...p, override_mode: p.override_mode ?? "forward" },
                  { onSuccess: () => setOpen(false) }
                )
              }
              isPending={regen.isPending}
              isError={regen.isError}
            />
          </div>
        </div>
      )}
    </>
  );
}
