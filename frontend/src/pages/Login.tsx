import { BudgetIQIcon } from "../components/Logo";

// In dev the login link must hit the backend port directly so the OAuth state
// cookie is set and read on the same origin (localhost:8000 both ways).
// In production the frontend and backend share the same origin so "/" works.
const loginHref = import.meta.env.DEV
  ? "http://localhost:8000/api/auth/login"
  : "/api/auth/login";

export default function Login() {
  return (
    <div className="grid h-full place-items-center bg-canvas p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#0F172A]">
          <BudgetIQIcon size={38} />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight">
          Budget<span className="text-brand">IQ</span>
        </h1>
        <p className="mt-1 text-xs font-medium uppercase tracking-widest text-muted">
          Track&nbsp;·&nbsp;Analyze&nbsp;·&nbsp;Optimize
        </p>

        <a
          href={loginHref}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-canvas"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
          </svg>
          Sign in with Google
        </a>
      </div>
    </div>
  );
}
