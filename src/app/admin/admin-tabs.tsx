import Link from "next/link";
import { useTranslations } from "next-intl";

export function AdminTabs({ active }: { active: "users" | "email" }) {
  const t = useTranslations("admin.tabs");
  const tabs = [
    { id: "users", label: t("users"), href: "/admin" },
    { id: "email", label: t("email"), href: "/admin/email" },
  ] as const;

  return (
    <nav className="mt-8 flex gap-1 overflow-x-auto rounded-2xl border border-app-border bg-app-surface-muted p-1" aria-label={t("ariaLabel")}>
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={active === tab.id ? "page" : undefined}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            active === tab.id
              ? "bg-app-surface text-app-foreground shadow-sm"
              : "text-app-muted hover:bg-app-surface hover:text-app-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
