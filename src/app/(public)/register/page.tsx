import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Регистрация",
  robots: { index: false },
};

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl?.startsWith("/")
    ? params.callbackUrl
    : "/";

  return (
    <Container>
      <Section className="pt-10">
        <h1 className="text-center text-2xl font-bold">Регистрация</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Создайте аккаунт для комментариев в блоге.
        </p>
        <div className="mt-8">
          <RegisterForm callbackUrl={callbackUrl} />
        </div>
      </Section>
    </Container>
  );
}
