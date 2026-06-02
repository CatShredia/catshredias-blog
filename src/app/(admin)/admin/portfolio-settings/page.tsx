import { PortfolioSettingsForm } from "@/components/admin/portfolio-settings-form";
import { AdminContainer } from "@/components/ui/admin-container";
import { getSiteSettings } from "@/lib/queries/site-settings";

export default async function PortfolioSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <AdminContainer className="py-6">
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
    </AdminContainer>
  );
}
