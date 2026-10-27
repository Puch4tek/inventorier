import { getButtonClassName } from "@/components/button";
import { AppHeader } from "@/components/app-header";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { getDashboardStats } from "@/server/dashboard/get-dashboard-stats";
import {
  getCurrentWarehouse,
  listAccessibleWarehouses,
} from "@/server/warehouses/current-warehouse";
import { MobileNav } from "./mobile-nav";

export const instant = false;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [currentWarehouse, warehouses] = await Promise.all([
    getCurrentWarehouse(),
    listAccessibleWarehouses(),
  ]);

  if (!currentWarehouse) {
    return (
      <EmptyWorkspaceDashboard
        user={user}
        hasAccessibleWarehouses={warehouses.length > 0}
      />
    );
  }

  const { counts, quantities, recentItems } = await getDashboardStats();

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader />

      <section className="page-shell">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-6">
          <div>
            <p className="page-kicker">Panel główny</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] sm:mt-2 sm:text-4xl">
              Witaj, {user.name}.
            </h1>
            <p className="page-description hidden sm:block">
              To jest centrum zarządzania Twoim magazynem.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:items-stretch">
            <div className="min-w-0 rounded-xl border border-app-border bg-app-surface px-3 py-2 text-xs shadow-card sm:max-w-xs sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
              <p className="text-app-muted">Zalogowano jako</p>
              <p className="mt-1 truncate font-medium" title={user.email}>
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid auto-rows-fr grid-cols-2 gap-2 sm:mt-12 sm:auto-rows-auto sm:gap-5">
          <Link href="/items" className="min-w-0">
            <DashboardCard
              title="Przedmioty"
              value={counts.activeItems.toString()}
              description="Aktywne pozycje w ewidencji"
              accent="bg-app-info-surface"
            />
          </Link>
          <Link href="/locations" className="min-w-0">
            <DashboardCard
              title="Lokalizacje"
              value={counts.locations.toString()}
              description="Miejsca przechowywania"
              accent="bg-app-success-surface"
            />
          </Link>
          <Link href="/categories" className="min-w-0">
            <DashboardCard
              title="Kategorie"
              value={counts.categories.toString()}
              description="Sposoby porządkowania"
              accent="bg-app-warning-surface"
            />
          </Link>
          <DashboardCard
            title="Zarchiwizowane"
            value={counts.archivedItems.toString()}
            description="Przedmioty poza aktywną listą"
            accent="bg-app-surface-muted"
          />
        </div>

        <div className="mt-3 grid gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="panel-card rounded-2xl p-4 sm:rounded-3xl sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-medium text-app-muted sm:text-sm">Stan magazynu</p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] sm:mt-2 sm:text-2xl">
                  {counts.activeItems} aktywnych pozycji
                </h2>
              </div>
              <Link
                href="/items"
                className="text-xs font-semibold text-app-foreground hover:underline sm:text-sm"
              >
                Zobacz przedmioty →
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-4">
              {quantities.map(({ unit, quantity }) => (
                <SummaryValue
                  key={unit}
                  label={`Łączna ilość (${unit})`}
                  value={quantity.toString()}
                  description="suma ilości aktywnych przedmiotów"
                />
              ))}
              <SummaryValue
                label="Bez kategorii"
                value={counts.uncategorizedItems.toString()}
                description="aktywnych przedmiotów do uporządkowania"
              />
            </div>
          </section>

          <section className="panel-card rounded-2xl p-4 sm:rounded-3xl sm:p-8">
            <p className="text-xs font-medium text-app-muted sm:text-sm">Szybkie akcje</p>
            <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] sm:mt-2 sm:text-2xl">
              Zarządzaj magazynem
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <QuickAction href="/scan" label="Skanuj kod aparatem" />
              <QuickAction href="/items" label="Przeglądaj przedmioty" />
              <QuickAction href="/locations" label="Zarządzaj lokalizacjami" />
              <QuickAction href="/categories" label="Zarządzaj kategoriami" />
            </div>
          </section>
        </div>

        <section className="panel-card mt-3 rounded-2xl p-4 sm:mt-8 sm:rounded-3xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-app-muted sm:text-sm">Ostatnio dodane</p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.03em] sm:mt-2 sm:text-2xl">
                Najnowsze przedmioty
              </h2>
            </div>
            {recentItems.length > 0 ? (
              <Link href="/items" className="text-xs font-semibold text-app-foreground hover:underline sm:text-sm">
                Wszystkie →
              </Link>
            ) : null}
          </div>
          {recentItems.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-app-surface-muted p-5">
              <p className="font-medium">Magazyn jest jeszcze pusty.</p>
              <p className="mt-1 truncate text-xs text-app-muted sm:text-sm">
                Dodaj pierwszy przedmiot, aby zobaczyć go tutaj.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-app-border sm:mt-6">
              {recentItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="flex flex-col justify-between gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-2 sm:py-4"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-1 text-sm text-app-muted">
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

async function EmptyWorkspaceDashboard({
  user,
  hasAccessibleWarehouses,
}: {
  user: { name: string; email: string; role: string };
  hasAccessibleWarehouses: boolean;
}) {
  const isAdmin = user.role === "ADMIN";
  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader />
      <section className="page-shell">
        <div className="mx-auto max-w-2xl">
          <p className="page-kicker">Panel główny</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Witaj, {user.name}.
          </h1>
          <section className="panel-card mt-8 rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-semibold">
              {hasAccessibleWarehouses
                ? "Wybierz magazyn"
                : isAdmin
                  ? "Utwórz pierwszy magazyn"
                  : "Brak dostępu do magazynu"}
            </h2>
            <p className="mt-3 leading-6 text-app-muted">
              {hasAccessibleWarehouses
                ? "Wybierz magazyn z listy w nagłówku, aby rozpocząć pracę."
                : isAdmin
                  ? "Ta instancja nie ma jeszcze magazynu. Utwórz pierwszy, aby rozpocząć pracę."
                  : "Nie przypisano Cię jeszcze do żadnego magazynu. Poproś administratora lub menedżera magazynu o dostęp."}
            </p>
            {!hasAccessibleWarehouses && isAdmin ? (
              <Link
                href="/settings/warehouses"
                className={getButtonClassName("primary", "mt-6 px-5 py-3 text-sm")}
              >
                Utwórz magazyn
              </Link>
            ) : null}
          </section>
        </div>
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
    <article className="group h-full min-w-0 rounded-2xl border border-app-border bg-app-surface p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover sm:rounded-3xl sm:p-6">
      <div className={`mb-4 h-1.5 w-8 rounded-full sm:mb-6 sm:h-2 sm:w-12 ${accent}`} />
      <p className="text-xs font-medium text-app-muted sm:text-sm">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:mt-5 sm:text-4xl">
        {value}
      </p>
      <p className="mt-1 text-xs leading-4 text-app-muted sm:mt-2 sm:text-sm sm:leading-normal">{description}</p>
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
    <div className="rounded-xl bg-app-surface-muted p-3 sm:rounded-2xl sm:p-5">
      <p className="text-xs font-medium text-app-muted sm:text-sm">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:mt-3 sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-app-muted">{description}</p>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-app-border px-3 py-2.5 text-xs font-semibold transition hover:bg-app-surface-muted sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
    >
      {label}
      <span className="float-right text-app-muted">→</span>
    </Link>
  );
}
