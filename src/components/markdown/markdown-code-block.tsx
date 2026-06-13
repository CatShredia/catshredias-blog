"use client";

import {
  Children,
  isValidElement,
  useCallback,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";

function getTextFromChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(getTextFromChildren).join("");
  }

  if (isValidElement(children)) {
    const props = children.props as { children?: ReactNode };
    return getTextFromChildren(props.children);
  }

  return "";
}

export function MarkdownCodeBlock({
  children,
  ...props
}: ComponentProps<"pre">) {
  const [copied, setCopied] = useState(false);
  const codeText = getTextFromChildren(children);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [codeText]);

  return (
    <div className="markdown-code-block not-prose">
      <button
        type="button"
        className="markdown-code-block-copy"
        onClick={handleCopy}
        aria-label={copied ? "Скопировано" : "Копировать код"}
      >
        {copied ? "Скопировано" : "Копировать"}
      </button>
      <pre {...props}>{children}</pre>
    </div>
  );
}
