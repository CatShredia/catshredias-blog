import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { AdminContainer } from "@/components/ui/admin-container";

export function AdminFooter() {
  return (
    <footer className="mt-auto border-t border-border py-4">
      <AdminContainer className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          ← На сайт
        </Link>
        <ThemeToggle showLabel />
      </AdminContainer>
    </footer>
  );
}
