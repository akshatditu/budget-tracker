import { BudgetIQIcon } from "./Logo";

/**
 * Full-screen brand loader: the BudgetIQ mark pulsing inside a sweeping
 * gradient ring. Mirrors the static pre-hydration fallback in `index.html`
 * so the logo animation reads as one continuous state from first paint
 * through auth resolving — no "Loading…" text flash in between.
 */
export default function AppLoader() {
  return (
    <div className="grid h-full place-items-center">
      <div className="relative h-14 w-14">
        <div className="bt-loader-ring absolute -inset-[10px] rounded-[20px]" />
        <BudgetIQIcon size={56} className="bt-loader-mark" />
      </div>
    </div>
  );
}
