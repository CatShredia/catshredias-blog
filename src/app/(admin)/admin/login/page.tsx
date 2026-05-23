import { Suspense } from "react";

import { AdminLoginForm } from "@/components/admin/login-form";
import { Container } from "@/components/ui/container";

export default function AdminLoginPage() {
  return (
    <Container className="flex min-h-[70vh] flex-col justify-center py-10">
      <h1 className="mb-6 text-center text-2xl font-bold">Вход в админку</h1>
      <Suspense fallback={<p className="text-center text-muted">Загрузка…</p>}>
        <AdminLoginForm />
      </Suspense>
      <p className="mt-6 text-center text-xs text-muted">
        По умолчанию после seed: admin@catshredia.ru / changeme
      </p>
    </Container>
  );
}
