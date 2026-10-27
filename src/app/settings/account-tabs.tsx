import Link from "next/link";

const tabs = [
  { id: "profile", label: "Profil" },
  { id: "password", label: "Hasło" },
  { id: "email", label: "E-mail" },
  { id: "security", label: "Bezpieczeństwo" },
] as const;

export function AccountTabs({
  active,
}: {
  active: (typeof tabs)[number]["id"];
}) {
  return (
    <nav className="mt-8 flex gap-1 overflow-x-auto rounded-2xl border border-app-border bg-app-surface-muted p-1" aria-label="Ustawienia konta">
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
