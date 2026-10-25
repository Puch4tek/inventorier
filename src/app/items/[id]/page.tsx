import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { logoutAction } from "@/app/dashboard/actions";
import { listCategories } from "@/server/categories/list-categories";
import { listLocations } from "@/server/locations/list-locations";
import { getItem } from "@/server/items/get-item";
import { ItemActions } from "./item-actions";
import { QuantityActions } from "./quantity-actions";
import { BarcodePanel, CopyBarcode } from "./barcode-panel";
import { MobileNav } from "@/app/dashboard/mobile-nav";
import { ThemeToggle } from "@/app/theme-toggle";

export const instant = false;

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const query = await searchParams;
  const fromLocation = Array.isArray(query.fromLocation)
    ? query.fromLocation[0]
    : query.fromLocation;
  const itemId = Number(id);

  if (!Number.isInteger(itemId) || itemId <= 0) {
    notFound();
  }

  let item;
  try {
    item = await getItem(itemId);
  } catch {
    notFound();
  }

  const [locations, categories] = await Promise.all([
    listLocations(),
    listCategories(),
  ]);

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <header className="app-header">
        <div className="app-header-inner max-w-5xl">
          <Link
            href={
              fromLocation && /^\d+$/.test(fromLocation)
                ? `/locations/${fromLocation}`
                : "/items"
            }
            className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
          >
            ←{" "}
            {fromLocation && /^\d+$/.test(fromLocation)
              ? "Wróć do lokalizacji"
              : "Wróć do przedmiotów"}
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
      <section className="page-shell page-shell-narrow">
        <p className="page-kicker">Przedmiot</p>
        <h1 className="page-title">
          {item.name}
        </h1>
        {item.isArchived ? (
          <p className="mt-3 inline-flex rounded-full bg-[#fff2f2] px-3 py-1 text-sm font-medium text-[#b42318]">
            Przedmiot zarchiwizowany
          </p>
        ) : null}
        <p className="page-description">
          {item.description || "Brak opisu"}
        </p>
        <ItemActions
          item={{
            id: item.id,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            locationId: item.locationId,
            categoryId: item.categoryId,
            isArchived: item.isArchived,
          }}
          locations={locations.map(({ id, name }) => ({ id, name }))}
          categories={categories}
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <section className="panel-card p-6 lg:row-span-3">
            <p className="text-sm font-medium text-[#6e6e73]">Informacje</p>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#6e6e73]">
                  Ilość
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {item.quantity}{" "}
                  <span className="text-base font-normal text-[#6e6e73]">
                    {item.unit}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#6e6e73]">
                  Kod kreskowy
                </p>
                <CopyBarcode barcode={item.barcode} />
                <BarcodePanel itemId={item.id} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#6e6e73]">
                  Ostatnia zmiana
                </p>
                <p className="mt-1 text-sm text-[#6e6e73]">
                  {item.updatedAt.toLocaleString("pl-PL")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#6e6e73]">
                  Opis
                </p>
                <p className="mt-1 text-sm leading-6 text-[#6e6e73]">
                  {item.description || "Brak opisu"}
                </p>
              </div>
            </div>
          </section>

          <section className="panel-card p-6">
            <p className="text-sm font-medium text-[#6e6e73]">Lokalizacja</p>
            <Link
              href={`/locations/${item.location.id}?fromItem=${item.id}`}
              className="mt-3 block text-xl font-semibold hover:underline"
            >
              {item.location.name}
            </Link>
            <p className="mt-2 text-sm text-[#6e6e73]">
              Przejdź do strony lokalizacji
            </p>
          </section>

          <section className="panel-card p-6">
            <p className="text-sm font-medium text-[#6e6e73]">Kategoria</p>
            {item.category ? (
              <>
                <Link
                  href={`/categories/${item.category.id}?fromItem=${item.id}`}
                  className="mt-3 block text-xl font-semibold hover:underline"
                >
                  {item.category.name}
                </Link>
                <p className="mt-2 text-sm text-[#6e6e73]">
                  Przejdź do strony kategorii
                </p>
              </>
            ) : (
              <p className="mt-3 text-xl font-semibold">Bez kategorii</p>
            )}
          </section>
          {!item.isArchived ? (
            <QuantityActions itemId={item.id} quantity={item.quantity} />
          ) : null}
        </div>
        <section className="panel-card mt-5 p-6">
          <h2 className="text-xl font-semibold">Historia zmian</h2>
          {item.itemHistories.length === 0 ? (
            <p className="mt-4 text-sm text-[#6e6e73]">Brak historii zmian.</p>
          ) : (
            <div className="mt-4 divide-y divide-black/[0.06]">
              {item.itemHistories.map((entry) => (
                <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium">
                    {entry.description ?? entry.type}
                  </p>
                  <p className="mt-1 text-xs text-[#6e6e73]">
                    {entry.user.name} ·{" "}
                    {entry.createdAt.toLocaleString("pl-PL")}
                  </p>
                  {entry.oldValue !== null || entry.newValue !== null ? (
                    <p className="mt-2 text-sm text-[#6e6e73]">
                      {entry.oldValue ?? "brak"} → {entry.newValue ?? "brak"}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
      <MobileNav />
    </main>
  );
}
