import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Light/dark palette switch. */
export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const readStored = <T extends string>(key: string, fallback: T, valid: readonly T[]): T => {
  const v = localStorage.getItem(key) as T | null;
  return v && valid.includes(v) ? v : fallback;
};

/**
 * Wraps the authenticated app in `.app[data-theme][data-dir="calm"]` so the design
 * tokens in index.css resolve, and exposes the light/dark toggle used by the
 * sidebar, More, and Settings screens. The selection persists to localStorage.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => readStored("bt.theme", "light", ["light", "dark"]));

  useEffect(() => localStorage.setItem("bt.theme", theme), [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
      setTheme,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className="app flex h-full flex-col" data-theme={theme} data-dir="calm">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
