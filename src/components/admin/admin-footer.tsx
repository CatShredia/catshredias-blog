import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Container } from "@/components/ui/container";

export function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-border py-4">
      <Container className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          ← На сайт
        </Link>
        <ThemeToggle showLabel />
      </Container>
    </footer>
  );
}
