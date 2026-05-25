import { getSocialLinks } from "@/lib/site-social";

export function SocialLinks({
  className = "",
  linkClassName = "underline-offset-4 hover:underline hover:text-foreground",
  variant = "row",
}: {
  className?: string;
  linkClassName?: string;
  variant?: "row" | "col";
}) {
  const links = getSocialLinks();
  const listClass =
    variant === "col"
      ? "flex flex-col gap-2"
      : "flex flex-wrap gap-x-4 gap-y-2";

  return (
    <nav aria-label="Социальные сети" className={className}>
      <ul className={listClass}>
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className={linkClassName}
              {...(link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
