"use client";

import { useTheme } from "@/components/theme-provider";

type ThemeToggleProps = {
  showLabel?: boolean;
  className?: string;
};

export function ThemeToggle({ showLabel = false, className = "" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const nextLabel = isDark ? "Светлая тема" : "Тёмная тема";

  return (
    <button
      type="button"
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm transition hover:bg-background ${className}`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={nextLabel}
    >
      <span aria-hidden className="text-base leading-none">
        {isDark ? "☀" : "☾"}
      </span>
      {showLabel ? <span>{nextLabel}</span> : null}
    </button>
  );
}
