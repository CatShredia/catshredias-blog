import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Вход",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Container>
      <Section className="pt-10">
        <h1 className="text-center text-2xl font-bold">Вход</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Войдите, чтобы оставлять комментарии от своего имени.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-center text-muted">Загрузка…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </Section>
    </Container>
  );
}
