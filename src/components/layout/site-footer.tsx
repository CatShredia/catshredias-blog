import { Container } from "@/components/ui/container";
import { siteProfile } from "@/data/mock/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border py-8">
      <Container className="flex flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {siteProfile.name}</p>
        <p>
          <a
            href={siteProfile.social.github}
            className="underline-offset-4 hover:underline"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </p>
      </Container>
    </footer>
  );
}
