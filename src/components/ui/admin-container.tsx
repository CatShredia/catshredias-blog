import { type ReactNode } from "react";

/** Широкий контейнер для страниц админки (редактор, таблицы). */
export function AdminContainer({
  children,
  className = "",
  wide = false,
}: {
  children: ReactNode;
  className?: string;
  /** На страницах редактирования — на всю ширину с минимальными полями */
  wide?: boolean;
}) {
  const width = wide
    ? "max-w-[min(100%,1920px)]"
    : "max-w-[min(100%,1400px)]";
  const padding = wide ? "px-3 sm:px-5 lg:px-6" : "px-4 sm:px-6 lg:px-8";

  return (
    <div className={`mx-auto w-full ${width} ${padding} ${className}`}>
      {children}
    </div>
  );
}
