import Link from "next/link";

const links = [
  { href: "/admin/posts", label: "Посты" },
  { href: "/admin/books", label: "Библиотека" },
  { href: "/admin/projects", label: "Проекты" },
  { href: "/admin/portfolio-settings", label: "Портфолио" },
  { href: "/admin/comments", label: "Комментарии" },
  { href: "/admin/reports", label: "Жалобы" },
];

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-4 text-sm text-muted">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="hover:text-foreground">
          {link.label}
        </Link>
      ))}
      <Link href="/" className="hover:text-foreground">
        На сайт
      </Link>
    </nav>
  );
}
