"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm transition hover:bg-background"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={
        resolvedTheme === "dark"
          ? "Включить светлую тему"
          : "Включить тёмную тему"
      }
    >
      {resolvedTheme === "dark" ? "☀" : "☾"}
    </button>
  );
}
