import type { Metadata } from "next";

import { ContactForm } from "@/components/contacts/contact-form";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { siteProfile } from "@/data/mock/site";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Форма обратной связи и ссылки",
};

export default function ContactsPage() {
  return (
    <Container>
      <Section className="pt-10">
        <h1 className="text-3xl font-bold tracking-tight">Контакты</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Напишите сообщение или выберите удобный канал связи.
        </p>
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <ContactForm />
          <aside className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold">Ссылки</h2>
            <ul className="space-y-2 text-muted">
              <li>
                <a
                  href={`mailto:${siteProfile.social.email}`}
                  className="hover:text-foreground"
                >
                  {siteProfile.social.email}
                </a>
              </li>
              <li>
                <a
                  href={siteProfile.social.telegram}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="hover:text-foreground"
                >
                  Telegram
                </a>
              </li>
              <li>
                <a
                  href={siteProfile.social.github}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </aside>
        </div>
      </Section>
    </Container>
  );
}
