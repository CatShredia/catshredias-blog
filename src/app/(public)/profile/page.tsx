import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/auth/profile-form";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { auth } from "@/lib/auth";
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
    select: { name: true, image: true },
  });

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
        </div>
      </Section>
    </Container>
  );
}
