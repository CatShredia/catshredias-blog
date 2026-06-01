import Link from "next/link";

import { countUnreadNotifications } from "@/lib/notifications";

const links = [
  { href: "/admin/posts", label: "Посты" },
  { href: "/admin/books", label: "Библиотека" },
  { href: "/admin/projects", label: "Проекты" },
  { href: "/admin/portfolio-settings", label: "Портфолио" },
  { href: "/admin/notifications", label: "Уведомления", badge: true },
  { href: "/admin/comments", label: "Комментарии" },
  { href: "/admin/reports", label: "Жалобы" },
];

export async function AdminNav() {
  const unreadNotifications = await countUnreadNotifications();

  return (
    <nav className="flex flex-wrap gap-4 text-sm text-muted">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="hover:text-foreground">
          {link.label}
          {link.badge && unreadNotifications > 0 ? (
            <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-xs text-accent-foreground">
              {unreadNotifications}
            </span>
          ) : null}
        </Link>
      ))}
      <Link href="/" className="hover:text-foreground">
        На сайт
      </Link>
    </nav>
  );
}
