import Link from "next/link";
import { ReportStatus } from "@prisma/client";

import { resolveReportAction } from "@/app/(admin)/admin/comments/actions";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { formatDateRu } from "@/lib/dates";
import { blogPostPath } from "@/lib/slug";
import { listReports } from "@/lib/queries/comments";

const filters = [
  { label: "На рассмотрении", value: ReportStatus.PENDING },
  { label: "Рассмотрено", value: ReportStatus.REVIEWED },
  { label: "Отклонено", value: ReportStatus.DISMISSED },
  { label: "Все", value: "all" },
] as const;

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status =
    params.status && params.status in ReportStatus
      ? (params.status as ReportStatus)
      : ReportStatus.PENDING;

  const reports = await listReports(
    params.status === "all" ? undefined : status,
  );

  return (
    <Container className="py-10">
      <Link href="/admin/comments" className="text-sm text-muted hover:text-foreground">
        ← Комментарии
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Жалобы на комментарии</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.label}
            href={
              filter.value === "all"
                ? "/admin/reports?status=all"
                : `/admin/reports?status=${filter.value}`
            }
            className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-card"
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <ul className="mt-8 space-y-4">
        {reports.length === 0 ? (
          <li className="text-muted">Жалоб нет.</li>
        ) : (
          reports.map((report) => (
            <li key={report.id} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted">
                {formatDateRu(report.createdAt)} · от{" "}
                {report.reporter?.name ?? report.reporter?.email ?? "аноним"}
              </p>
              <p className="mt-2 text-sm font-medium">Причина жалобы</p>
              <p className="text-sm text-muted">{report.reason}</p>
              <div className="mt-3 rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted">Комментарий</p>
                <p className="mt-1 text-sm">{report.comment.content}</p>
                <p className="mt-1 text-xs">
                  {report.comment.authorName} ·{" "}
                  <Link
                    href={blogPostPath(report.comment.post.slug)}
                    className="text-accent underline"
                  >
                    {report.comment.post.title}
                  </Link>
                </p>
              </div>
              {report.status === ReportStatus.PENDING ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={resolveReportAction}>
                    <input type="hidden" name="id" value={report.id} />
                    <input type="hidden" name="status" value={ReportStatus.REVIEWED} />
                    <Button type="submit">Рассмотрено</Button>
                  </form>
                  <form action={resolveReportAction}>
                    <input type="hidden" name="id" value={report.id} />
                    <input type="hidden" name="status" value={ReportStatus.DISMISSED} />
                    <input type="hidden" name="note" value="Жалоба отклонена" />
                    <Button type="submit" variant="secondary">
                      Отклонить жалобу
                    </Button>
                  </form>
                  <form action={resolveReportAction}>
                    <input type="hidden" name="id" value={report.id} />
                    <input type="hidden" name="commentId" value={report.commentId} />
                    <input type="hidden" name="hide" value="1" />
                    <input type="hidden" name="status" value={ReportStatus.REVIEWED} />
                    <input type="hidden" name="note" value="Комментарий скрыт" />
                    <Button type="submit" variant="ghost">
                      Рассмотрено + скрыть комментарий
                    </Button>
                  </form>
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted">Статус: {report.status}</p>
              )}
            </li>
          ))
        )}
      </ul>
    </Container>
  );
}
