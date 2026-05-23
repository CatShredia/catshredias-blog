import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { Container } from "@/components/ui/container";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-full bg-background">
      {session?.user ? (
        <header className="border-b border-border">
          <Container className="flex min-h-14 items-center justify-between">
            <Link href="/admin" className="font-semibold">
              Админка
            </Link>
            <AdminNav />
          </Container>
        </header>
      ) : null}
      {children}
    </div>
  );
}
