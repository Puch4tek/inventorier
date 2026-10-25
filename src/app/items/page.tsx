import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { logoutAction } from "@/app/dashboard/actions";
import { listCategories } from "@/server/categories/list-categories";
import { listLocations } from "@/server/locations/list-locations";
import { listItems } from "@/server/items/list-items";
import { ItemCreateModal } from "./item-create-modal";
import { ItemFilters } from "./item-filters";
import { MobileNav } from "@/app/dashboard/mobile-nav";
import { ThemeToggle } from "@/app/theme-toggle";

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

  const [items, locations, categories] = await Promise.all([
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
  ]);

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/dashboard" className="font-semibold tracking-[-0.02em]">
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
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="page-kicker">Magazyn</p>
            <h1 className="page-title">
              Przedmioty
            </h1>
            <p className="page-description">
              {archived
                ? "Przeglądaj przedmioty znajdujące się w archiwum."
                : "Przeglądaj wszystkie aktywne przedmioty."}
            </p>
          </div>
          <ItemCreateModal
            locations={locations.map(({ id, name }) => ({ id, name }))}
            categories={categories}
          />
        </div>

        <ItemFilters
          locations={locations.map(({ id, name }) => ({ id, name }))}
          categories={categories}
        />

        {items.length === 0 ? (
          <section className="panel-card mt-10 p-8 text-center">
            <h2 className="text-xl font-semibold">Brak przedmiotów</h2>
            <p className="mt-2 text-sm text-[#6e6e73]">
              Dodaj pierwszy przedmiot, aby pojawił się na liście.
            </p>
          </section>
        ) : (
          <section className="panel-card mt-10 overflow-hidden">
            <div className="divide-y divide-black/[0.06]">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/items/${item.id}`}
                  className="block px-6 py-5 transition hover:bg-[#f5f5f7] sm:px-8"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row">
                    <div>
                      <h2 className="font-semibold">{item.name}</h2>
                      <p className="mt-1 text-sm text-[#6e6e73]">
                        {item.quantity} {item.unit} · {item.barcode}
                      </p>
                    </div>
                    <div className="text-sm text-[#6e6e73] sm:text-right">
                      <p>{item.location.name}</p>
                      <p className="mt-1">
                        {item.category?.name ?? "Bez kategorii"}
                      </p>
                    </div>
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
