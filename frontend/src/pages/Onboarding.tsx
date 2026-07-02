import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useCompleteOnboarding } from "../api/hooks";
import BudgetWizard, { PRESETS, emptySelected } from "../components/BudgetWizard";

export default function Onboarding() {
  const { data: user } = useAuth();
  const complete = useCompleteOnboarding();

  // On success, land on Budget Setup so the user reviews/edits the generated budget.
  useEffect(() => {
    if (complete.isSuccess) window.location.assign("/dashboard/setup");
  }, [complete.isSuccess]);

  const welcome = (
    <>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-brand text-white">
        <Sparkles size={22} />
      </div>
      <h1 className="mt-4 text-xl font-semibold">
        Welcome{user?.display_name ? `, ${user.display_name.split(" ")[0]}` : ""}! 👋
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        Answer a few quick questions and we'll build a starting budget for you automatically —
        you can tweak every number afterwards. Your amounts are encrypted, so only you can read them.
      </p>
    </>
  );

  return (
    <div className="h-full overflow-y-auto bg-canvas">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <BudgetWizard
          sections={PRESETS}
          initial={{ selected: emptySelected(PRESETS), employment: "salaried", income: "", bills: [] }}
          welcome={welcome}
          submitLabel="Build my budget"
          onFinish={(p) => complete.mutate(p)}
          isPending={complete.isPending}
          isError={complete.isError}
        />
      </div>
    </div>
  );
}
