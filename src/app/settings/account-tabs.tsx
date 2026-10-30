import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function AccountTabs({
  active,
}: {
  active: "profile" | "password" | "email" | "security";
}) {
  const t = await getTranslations("auth.settings");
  const tabs = [
    { id: "profile", label: t("tabs.profile") },
    { id: "password", label: t("tabs.password") },
    { id: "email", label: t("tabs.email") },
    { id: "security", label: t("tabs.security") },
  ] as const;
  return (
    <nav className="mt-8 flex gap-1 overflow-x-auto rounded-2xl border border-app-border bg-app-surface-muted p-1" aria-label={t("ariaLabel")}>
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={`/settings?tab=${tab.id}`}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            active === tab.id
              ? "bg-app-surface text-app-foreground shadow-sm"
              : "text-app-muted hover:bg-app-surface hover:text-app-foreground"
          }`}
          aria-current={active === tab.id ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
