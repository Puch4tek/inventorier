import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { getDashboardStats } from "@/server/dashboard/get-dashboard-stats";
import { logoutAction } from "@/app/dashboard/actions";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "../theme-toggle";

export const instant = false;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { counts, recentItems } = await getDashboardStats();

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <header className="app-header">
        <div className="app-header-inner">
          <Link
            href="/dashboard"
            className="text-base font-semibold tracking-[-0.02em]"
          >
            Inventory App
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logoutAction}>
              <button type="submit" className="primary-button px-3 py-2 text-xs sm:px-4 sm:text-sm">
                Wyloguj
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="page-shell">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div>
            <p className="page-kicker">Panel główny</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:mt-2 sm:text-4xl">
              Witaj, {user.name}.
            </h1>
            <p className="page-description">
              To jest centrum zarządzania Twoim magazynem.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:items-stretch">
            <div className="min-w-0 rounded-xl border border-black/[0.06] bg-white px-3 py-2 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:max-w-xs sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
              <p className="text-[#6e6e73]">Zalogowano jako</p>
              <p className="mt-1 truncate font-medium" title={user.email}>
                {user.email}
              </p>
            </div>
            {user.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-xl border border-black/[0.1] bg-white px-4 py-3 text-sm font-semibold transition hover:bg-[#f5f5f7]"
              >
                Panel administratora
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5">
          <Link href="/items">
            <DashboardCard
              title="Przedmioty"
              value={counts.activeItems.toString()}
              description="Aktywne pozycje w ewidencji"
              accent="bg-[#e8f1ff]"
            />
          </Link>
          <Link href="/locations">
            <DashboardCard
              title="Lokalizacje"
              value={counts.locations.toString()}
              description="Miejsca przechowywania"
              accent="bg-[#effaf3]"
            />
          </Link>
          <Link href="/categories">
            <DashboardCard
              title="Kategorie"
              value={counts.categories.toString()}
              description="Sposoby porządkowania"
              accent="bg-[#fff5e6]"
            />
          </Link>
          <DashboardCard
            title="Zarchiwizowane"
            value={counts.archivedItems.toString()}
            description="Przedmioty poza aktywną listą"
            accent="bg-[#f2f2f7]"
          />
        </div>

        <div className="mt-5 grid gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="panel-card rounded-2xl p-4 sm:rounded-3xl sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-medium text-[#6e6e73] sm:text-sm">Stan magazynu</p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:mt-2 sm:text-2xl">
                  {counts.totalQuantity} sztuk w {counts.activeItems} pozycjach
                </h2>
              </div>
              <Link
                href="/items"
                className="text-xs font-semibold text-[#1d1d1f] hover:underline sm:text-sm"
              >
                Zobacz przedmioty →
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:mt-8 sm:gap-4 sm:grid-cols-2">
              <SummaryValue
                label="Łączna ilość"
                value={counts.totalQuantity.toString()}
                description="suma ilości aktywnych przedmiotów"
              />
              <SummaryValue
                label="Bez kategorii"
                value={counts.uncategorizedItems.toString()}
                description="aktywnych przedmiotów do uporządkowania"
              />
            </div>
          </section>

          <section className="panel-card rounded-2xl p-4 sm:rounded-3xl sm:p-8">
            <p className="text-xs font-medium text-[#6e6e73] sm:text-sm">Szybkie akcje</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:mt-2 sm:text-2xl">
              Zarządzaj magazynem
            </h2>
            <div className="mt-4 grid gap-2 sm:mt-6 sm:gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <QuickAction href="/scan" label="Skanuj kod aparatem" />
              <QuickAction href="/items" label="Przeglądaj przedmioty" />
              <QuickAction href="/locations" label="Zarządzaj lokalizacjami" />
              <QuickAction href="/categories" label="Zarządzaj kategoriami" />
            </div>
          </section>
        </div>

        <section className="panel-card mt-5 rounded-2xl p-4 sm:mt-8 sm:rounded-3xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#6e6e73]">Ostatnio dodane</p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] sm:mt-2 sm:text-2xl">
                Najnowsze przedmioty
              </h2>
            </div>
            {recentItems.length > 0 ? (
              <Link href="/items" className="text-xs font-semibold text-[#1d1d1f] hover:underline sm:text-sm">
                Wszystkie →
              </Link>
            ) : null}
          </div>
          {recentItems.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[#f5f5f7] p-5">
              <p className="font-medium">Magazyn jest jeszcze pusty.</p>
              <p className="mt-1 text-sm text-[#6e6e73]">
                Dodaj pierwszy przedmiot, aby zobaczyć go tutaj.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-black/[0.06] sm:mt-6">
              {recentItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="flex flex-col justify-between gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-2 sm:py-4"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-1 text-sm text-[#6e6e73]">
                      {item.location.name} · {item.category?.name ?? "Bez kategorii"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold sm:text-right">
                    {item.quantity} {item.unit}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
      <MobileNav />
    </main>
  );
}

function DashboardCard({
  title,
  value,
  description,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  accent: string;
}) {
  return (
    <article className="group rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)] sm:rounded-3xl sm:p-6">
      <div className={`mb-4 h-1.5 w-8 rounded-full sm:mb-6 sm:h-2 sm:w-12 ${accent}`} />
      <p className="text-xs font-medium text-[#6e6e73] sm:text-sm">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:mt-5 sm:text-4xl">
        {value}
      </p>
      <p className="mt-1 text-xs leading-4 text-[#6e6e73] sm:mt-2 sm:text-sm sm:leading-normal">{description}</p>
    </article>
  );
}

function SummaryValue({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-[#f5f5f7] p-3 sm:rounded-2xl sm:p-5">
      <p className="text-xs font-medium text-[#6e6e73] sm:text-sm">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:mt-3 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-[#6e6e73]">{description}</p>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-black/[0.08] px-3 py-2.5 text-xs font-semibold transition hover:bg-[#f5f5f7] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
    >
      {label}
      <span className="float-right text-[#6e6e73]">→</span>
    </Link>
  );
}
