import { AppHeader } from "@/components/app-header";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { listCategories } from "@/server/categories/list-categories";
import { listLocations } from "@/server/locations/list-locations";
import { listItems } from "@/server/items/list-items";
import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { canManageWarehouseData } from "@/server/warehouses/permissions";
import { ItemCreateModal } from "./item-create-modal";
import { ItemFilters } from "./item-filters";
import { MobileNav } from "@/app/dashboard/mobile-nav";

export const instant = false;

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const getParam = (name: string) => {
    const value = params[name];
    return Array.isArray(value) ? value[0] : value;
  };
  const locationIdValue = getParam("locationId");
  const categoryIdValue = getParam("categoryId");
  const locationId = locationIdValue ? Number(locationIdValue) : undefined;
  const categoryId =
    categoryIdValue === "none"
      ? null
      : categoryIdValue
        ? Number(categoryIdValue)
        : undefined;
  const sortByValue = getParam("sortBy");
  const sortDirectionValue = getParam("sortDirection");
  const sortBy =
    sortByValue === "quantity" || sortByValue === "updatedAt"
      ? sortByValue
      : "name";
  const sortDirection = sortDirectionValue === "desc" ? "desc" : "asc";
  const archived = getParam("archived") === "archived";
  const validLocationId =
    locationId !== undefined && Number.isInteger(locationId) && locationId > 0
      ? locationId
      : undefined;

  const [items, locations, categories, current] = await Promise.all([
    listItems({
      search: getParam("search"),
      locationId: validLocationId,
      categoryId,
      archived,
      sortBy,
      sortDirection,
    }),
    listLocations(),
    listCategories(),
    requireCurrentWarehouse(),
  ]);
  const canManage = canManageWarehouseData(current);

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader />

      <section className="page-shell">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-5">
          <div>
            <p className="page-kicker">Magazyn</p>
            <h1 className="page-title">
              Przedmioty
            </h1>
            <p className="page-description hidden sm:block">
              {archived
                ? "Przeglądaj przedmioty znajdujące się w archiwum."
                : "Przeglądaj wszystkie aktywne przedmioty."}
            </p>
          </div>
          {canManage ? (
            <ItemCreateModal
              locations={locations.map(({ id, name }) => ({ id, name }))}
              categories={categories}
            />
          ) : null}
        </div>

        <ItemFilters
          locations={locations.map(({ id, name }) => ({ id, name }))}
          categories={categories}
        />

        {items.length === 0 ? (
          <section className="panel-card mt-5 p-6 text-center">
            <h2 className="text-l font-semibold">Brak przedmiotów</h2>
            <p className="mt-2 text-sm text-app-muted">
              {canManage ? "Dodaj pierwszy przedmiot, aby pojawił się na liście." : "W tym magazynie nie ma przedmiotów."}
            </p>
          </section>
        ) : (
          <section className="panel-card mt-5 overflow-hidden transition hover:bg-app-surface-subtle sm:mt-10">
            <div className="divide-y divide-app-border">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="block px-4 py-3 transition sm:px-8 sm:py-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{item.name}</h2>
                      <p className="mt-1 truncate text-xs text-app-muted sm:text-sm">
                        {item.location.name} · {item.category?.name ?? "Bez kategorii"}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold sm:text-base">
                      {item.quantity} {item.unit}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>
      <MobileNav />
    </main>
  );
}
