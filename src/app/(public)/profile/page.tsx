import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DeleteAccountSection } from "@/components/auth/delete-account-section";
import { ProfileForm } from "@/components/auth/profile-form";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Профиль",
  robots: { index: false },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true, deletedAt: true, role: true },
  });

  if (!dbUser || dbUser.deletedAt) {
    redirect("/login?callbackUrl=/profile");
  }

  return (
    <Container>
      <Section className="pt-10">
        <h1 className="text-2xl font-bold">Профиль</h1>
        <p className="mt-2 text-muted">{session.user.email}</p>
        <div className="mt-8 max-w-md">
          <ProfileForm
            key={`${dbUser?.image ?? ""}-${dbUser?.name ?? ""}`}
            name={dbUser?.name ?? session.user.name ?? ""}
            image={dbUser?.image ?? session.user.image ?? ""}
          />
          {isAdminRole(dbUser.role) ? (
            <div className="mt-8 border-t border-border pt-8">
              <h2 className="text-sm font-medium">Администрирование</h2>
              <ButtonLink href="/admin" variant="secondary" className="mt-3">
                Админка
              </ButtonLink>
            </div>
          ) : (
            <DeleteAccountSection />
          )}
        </div>
      </Section>
    </Container>
  );
}
