import ReactMarkdown from "react-markdown";

export function BioParagraph({ content }: { content: string }) {
  return (
    <p className="leading-relaxed [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:opacity-80">
      <ReactMarkdown
        allowedElements={["a", "text", "strong", "em"]}
        unwrapDisallowed
        components={{
          p: ({ children }) => <>{children}</>,
          a: ({ href, children }) => {
            const external = href?.startsWith("http");
            return (
              <a
                href={href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </p>
  );
}
