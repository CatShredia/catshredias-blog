import Link from "next/link";

const links = [
  { href: "/admin", label: "Главная" },
  { href: "/admin/posts", label: "Посты" },
  { href: "/admin/projects", label: "Проекты" },
  { href: "/admin/comments", label: "Комментарии" },
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
