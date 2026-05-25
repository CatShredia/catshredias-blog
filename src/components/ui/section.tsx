import { type ReactNode } from "react";

export function Section({
  title,
  children,
  className = "",
  compact = false,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const padding = compact ? "py-4 sm:py-6" : "py-10 sm:py-14";
  const titleMargin = compact ? "mb-3" : "mb-6";

  return (
    <section className={`${padding} ${className}`}>
      {title ? (
        <h2
          className={`${titleMargin} text-2xl font-semibold tracking-tight sm:text-3xl`}
        >
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
