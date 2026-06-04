import type { ReactNode } from "react";

type MarkdownCalloutProps = {
  className?: string;
  children: ReactNode;
};

export function MarkdownCallout({ className, children }: MarkdownCalloutProps) {
  return (
    <div className={className ?? "markdown-alert"}>
      {children}
    </div>
  );
}
