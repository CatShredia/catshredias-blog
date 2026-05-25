import { BioParagraph } from "@/components/site/bio-paragraph";
import { LookingForWorkStatus } from "@/components/site/looking-for-work-status";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { siteProfile } from "@/data/mock/site";
import { getSiteSettings } from "@/lib/queries/site-settings";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSiteSettings();

  return (
    <Container>
      <Section className="pt-12 sm:pt-20">
        <p className="mb-2 text-sm font-medium text-accent">{siteProfile.role}</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          {siteProfile.name}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{siteProfile.tagline}</p>
        <div className="mt-6">
          <LookingForWorkStatus lookingForWork={settings.lookingForWork} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/blog">Читать блог</ButtonLink>
          <ButtonLink href="/contacts" variant="secondary">
            Связаться
          </ButtonLink>
        </div>
      </Section>

      <Section title="Обо мне">
        <div className="max-w-3xl space-y-4 text-muted">
          {siteProfile.bio.map((paragraph) => (
            <BioParagraph key={paragraph} content={paragraph} />
          ))}
        </div>
      </Section>
    </Container>
  );
}
