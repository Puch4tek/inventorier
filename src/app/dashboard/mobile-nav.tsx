"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const items = [
  {
    href: "/dashboard",
    label: "dashboard",
    icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  },
  {
    href: "/items",
    label: "items",
    icon: "M20 8h-3V4H7v4H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zM9 6h6v2H9V6zm11 12H4v-8h16v8z",
  },
  {
    href: "/locations",
    label: "locations",
    icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z",
  },
  {
    href: "/categories",
    label: "categories",
    icon: "M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM4 4h7v6H4V4zm0 8h7v8H4v-8zm9 8v-6h7v6h-7zm0-8V4h7v8h-7z",
  },
  {
    href: "/scan",
    label: "scanner",
    icon: "M9 5v2h6V5h2v2h2v2h-2v6h2v2h-2v2h-2v-2H9v2H7v-2H5v-2h2V9H5V7h2V5h2zm0 4v6h6V9H9z",
  },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations("organization.nav");

  return (
    <nav
      aria-label={t("ariaLabel")}
      className="mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-app-border bg-app-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-card backdrop-blur-md sm:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-1 text-[11px] font-medium transition ${
                active
                  ? "text-foreground"
                  : "text-app-subtle hover:text-app-foreground"
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-2xl leading-none ${
                  active ? "bg-app-surface-subtle" : ""
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-6 w-6 fill-current"
                >
                  <path d={item.icon} />
                </svg>
              </span>
              <span className="max-w-full truncate">{t(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
