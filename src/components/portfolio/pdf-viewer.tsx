type PdfViewerProps = {
  url: string;
  title?: string;
};

export function PdfViewer({ url, title = "Резюме PDF" }: PdfViewerProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-medium">{title}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-accent underline-offset-4 hover:underline"
        >
          Открыть в новой вкладке
        </a>
      </div>
      <iframe
        src={url}
        title={title}
        className="h-[min(70vh,600px)] w-full bg-background"
        loading="lazy"
      />
    </div>
  );
}
