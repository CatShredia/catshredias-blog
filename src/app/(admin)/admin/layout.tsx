import Link from "next/link";

import { AdminFooter } from "@/components/admin/admin-footer";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminContainer } from "@/components/ui/admin-container";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex min-h-full flex-col bg-background">
      {session?.user ? (
        <header className="border-b border-border">
          <AdminContainer className="flex min-h-14 items-center justify-between">
            <Link href="/admin" className="font-semibold">
              Админка
            </Link>
            <AdminNav />
          </AdminContainer>
        </header>
      ) : null}
      <div className="flex-1">{children}</div>
      <AdminFooter />
    </div>
  );
}
