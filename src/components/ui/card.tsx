import Link from "next/link";
import { type ReactNode } from "react";

export function Card({
  children,
  className = "",
  href,
}: {
  children: ReactNode;
  className?: string;
  href?: string;
}) {
  const classes = `block rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-accent/40 ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return <article className={classes}>{children}</article>;
}
