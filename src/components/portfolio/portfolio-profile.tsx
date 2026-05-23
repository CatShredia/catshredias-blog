import { PdfViewer } from "@/components/portfolio/pdf-viewer";
import { LookingForWorkStatus } from "@/components/site/looking-for-work-status";
import { ButtonLink } from "@/components/ui/button";

export function PortfolioProfile({
  hhUrl,
  resumePdf,
  lookingForWork,
}: {
  hhUrl: string | null;
  resumePdf: string | null;
  lookingForWork: boolean;
}) {
  return (
    <section className="mb-10 rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">О себе</h2>
      <div className="mt-4">
        <LookingForWorkStatus lookingForWork={lookingForWork} />
      </div>
      <p className="mt-2 text-sm text-muted">
        Резюме и профиль на HeadHunter.
      </p>
      {hhUrl ? (
        <div className="mt-4">
          <ButtonLink href={hhUrl} variant="secondary">
            Профиль на hh.ru
          </ButtonLink>
        </div>
      ) : null}
      {resumePdf ? (
        <div className="mt-6">
          <PdfViewer url={resumePdf} title="Резюме" />
        </div>
      ) : null}
    </section>
  );
}
