import Link from "next/link";

const tabs = [
  { id: "users", label: "Użytkownicy", href: "/admin" },
  { id: "email", label: "E-mail", href: "/admin/email" },
] as const;

export function AdminTabs({ active }: { active: "users" | "email" }) {
  return (
    <nav className="mt-8 flex gap-1 overflow-x-auto rounded-2xl border border-app-border bg-app-surface-muted p-1" aria-label="Administracja">
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
