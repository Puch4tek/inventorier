import { AppHeader } from "@/components/app-header";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { listCategories } from "@/server/categories/list-categories";
import { listLocations } from "@/server/locations/list-locations";
import { getItem } from "@/server/items/get-item";
import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { canManageWarehouseData } from "@/server/warehouses/permissions";
import { ItemActions } from "./item-actions";
import { QuantityActions } from "./quantity-actions";
import { BarcodePanel, CopyBarcode } from "./barcode-panel";
import { MobileNav } from "@/app/dashboard/mobile-nav";

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

  const current = await requireCurrentWarehouse();
  const canManage = canManageWarehouseData(current);
  const [locations, categories] = canManage
    ? await Promise.all([listLocations(), listCategories()])
    : [[], []];

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader
        maxWidth="max-w-5xl"
        backHref={
          fromLocation && /^\d+$/.test(fromLocation)
            ? `/locations/${fromLocation}`
            : "/items"
        }
        backLabel={
          fromLocation && /^\d+$/.test(fromLocation)
            ? "Wróć do lokalizacji"
            : "Wróć do przedmiotów"
        }
      />
      <section className="page-shell page-shell-narrow">
        <p className="page-kicker">Przedmiot</p>
        <h1 className="page-title">
          {item.name}
        </h1>
        {item.isArchived ? (
          <p className="mt-3 inline-flex rounded-full bg-app-danger-surface px-3 py-1 text-sm font-medium text-app-danger">
            Przedmiot zarchiwizowany
          </p>
        ) : null}
        <p className="page-description">
          {item.description || "Brak opisu"}
        </p>
        {canManage ? <ItemActions
          item={{
            id: item.id,
            name: item.name,
            description: item.description,
            unit: item.unit,
            locationId: item.locationId,
            categoryId: item.categoryId,
            isArchived: item.isArchived,
          }}
          locations={locations.map(({ id, name }) => ({ id, name }))}
          categories={categories}
        /> : null}
        {!item.isArchived ? (
            <div className="mt-4 mb-4 lg:hidden">
              <QuantityActions
                itemId={item.id}
                quantity={item.quantity}
                inputId="exact-quantity-mobile"
              />
            </div>
        ) : null}
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <section className="panel-card p-6 lg:row-span-3">
            <p className="text-sm font-medium text-app-muted">Informacje</p>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-app-muted">
                  Ilość
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {item.quantity}{" "}
                  <span className="text-base font-normal text-app-muted">
                    {item.unit}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-app-muted">
                  Kod kreskowy
                </p>
                <CopyBarcode barcode={item.barcode} />
                <BarcodePanel itemId={item.id} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-app-muted">
                  Ostatnia zmiana
                </p>
                <p className="mt-1 text-sm text-app-muted">
                  {item.updatedAt.toLocaleString("pl-PL")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-app-muted">
                  Opis
                </p>
                <p className="mt-1 text-sm leading-6 text-app-muted">
                  {item.description || "Brak opisu"}
                </p>
              </div>
            </div>
          </section>

          <section className="panel-card p-6">
            <p className="text-sm font-medium text-app-muted">Lokalizacja</p>
            <Link
              href={`/locations/${item.location.id}?fromItem=${item.id}`}
              className="mt-3 block text-xl font-semibold hover:underline"
            >
              {item.location.name}
            </Link>
            <p className="mt-2 text-sm text-app-muted">
              Przejdź do strony lokalizacji
            </p>
          </section>

          <section className="panel-card p-6">
            <p className="text-sm font-medium text-app-muted">Kategoria</p>
            {item.category ? (
              <>
                <Link
                  href={`/categories/${item.category.id}?fromItem=${item.id}`}
                  className="mt-3 block text-xl font-semibold hover:underline"
                >
                  {item.category.name}
                </Link>
                <p className="mt-2 text-sm text-app-muted">
                  Przejdź do strony kategorii
                </p>
              </>
            ) : (
              <p className="mt-3 text-xl font-semibold">Bez kategorii</p>
            )}
          </section>
          {!item.isArchived ? (
            <div className="hidden lg:col-start-2 lg:block">
              <QuantityActions
                itemId={item.id}
                quantity={item.quantity}
                inputId="exact-quantity-desktop"
              />
            </div>
          ) : null}
        </div>
        <section className="panel-card mt-5 p-6">
          <h2 className="text-xl font-semibold">Historia zmian</h2>
          {item.itemHistories.length === 0 ? (
            <p className="mt-4 text-sm text-app-muted">Brak historii zmian.</p>
          ) : (
            <div className="mt-4 divide-y divide-app-border">
              {item.itemHistories.map((entry) => (
                <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium">
                    {entry.description ?? entry.type}
                  </p>
                  <p className="mt-1 text-xs text-app-muted">
                    {entry.actorName} ·{" "}
                    {entry.createdAt.toLocaleString("pl-PL")}
                  </p>
                  {entry.oldValue !== null || entry.newValue !== null ? (
                    <p className="mt-2 text-sm text-app-muted">
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
