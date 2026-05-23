import { PortfolioSettingsForm } from "@/components/admin/portfolio-settings-form";
import { Container } from "@/components/ui/container";
import { getSiteSettings } from "@/lib/queries/site-settings";

export default async function PortfolioSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold">Портфолио — страница /portfolio</h1>
      <p className="mt-2 text-sm text-muted">
        Ссылка на hh.ru и PDF-резюме отображаются на публичной странице портфолио.
      </p>
      <div className="mt-8">
        <PortfolioSettingsForm
          hhUrl={settings.hhUrl ?? ""}
          resumePdf={settings.resumePdf ?? ""}
          lookingForWork={settings.lookingForWork}
        />
      </div>
    </Container>
  );
}
