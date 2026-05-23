import Link from "next/link";

import { AuthNav } from "@/components/layout/auth-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Container } from "@/components/ui/container";

const nav = [
  { href: "/", label: "Главная" },
  { href: "/blog", label: "Блог" },
  { href: "/library", label: "Библиотека" },
  { href: "/portfolio", label: "Портфолио" },
  { href: "/contacts", label: "Контакты" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Catshredia
        </Link>
        <nav aria-label="Основная навигация" className="hidden sm:block">
          <ul className="flex items-center gap-6">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted transition hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthNav />
        </div>
      </Container>
      <Container className="pb-3 sm:hidden">
        <ul className="flex flex-wrap gap-3">
          {nav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="text-sm text-muted">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </header>
  );
}
