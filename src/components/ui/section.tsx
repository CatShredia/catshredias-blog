import { type ReactNode } from "react";

export function Section({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`py-10 sm:py-14 ${className}`}>
      {title ? (
        <h2 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
