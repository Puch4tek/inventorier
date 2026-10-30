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
import { getFormatter, getTranslations } from "next-intl/server";
import { getItemHistoryMessageKey } from "@/lib/items/history";

export const instant = false;

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [t, format] = await Promise.all([
    getTranslations("items"),
    getFormatter(),
  ]);
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
            ? t("detail.backToLocation")
            : t("detail.backToItems")
        }
      />
      <section className="page-shell page-shell-narrow">
        <p className="page-kicker">{t("detail.section")}</p>
        <h1 className="page-title">
          {item.name}
        </h1>
        {item.isArchived ? (
          <p className="mt-3 inline-flex rounded-full bg-app-danger-surface px-3 py-1 text-sm font-medium text-app-danger">
            {t("detail.archived")}
          </p>
        ) : null}
        <p className="page-description">
          {item.description || t("detail.missingDescription")}
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
          <section className="panel-card p-6">
            <p className="text-sm font-medium text-app-muted">{t("detail.information")}</p>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-app-muted">
                  {t("detail.quantity")}
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {format.number(item.quantity)}{" "}
                  <span className="text-base font-normal text-app-muted">
                    {item.unit}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-app-muted">
                  {t("detail.barcode")}
                </p>
                <CopyBarcode barcode={item.barcode} />
                <BarcodePanel itemId={item.id} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-app-muted">
                  {t("detail.lastChanged")}
                </p>
                <p className="mt-1 text-sm text-app-muted">
                  {format.dateTime(item.updatedAt, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          </section>

          <div
            className={`grid gap-5 ${item.isArchived ? "lg:grid-rows-2" : "lg:grid-rows-3"}`}
          >
            <section className="panel-card p-6">
              <p className="text-sm font-medium text-app-muted">{t("detail.location")}</p>
              <Link
                href={`/locations/${item.location.id}?fromItem=${item.id}`}
                className="mt-3 block text-xl font-semibold hover:underline"
              >
                {item.location.name}
              </Link>
              <p className="mt-2 text-sm text-app-muted">
                {t("detail.goToLocation")}
              </p>
            </section>

            <section className="panel-card p-6">
              <p className="text-sm font-medium text-app-muted">{t("detail.category")}</p>
              {item.category ? (
                <>
                  <Link
                    href={`/categories/${item.category.id}?fromItem=${item.id}`}
                    className="mt-3 block text-xl font-semibold hover:underline"
                  >
                    {item.category.name}
                  </Link>
                  <p className="mt-2 text-sm text-app-muted">
                    {t("detail.goToCategory")}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-xl font-semibold">{t("list.noCategory")}</p>
              )}
            </section>

            {!item.isArchived ? (
              <div className="hidden lg:block">
                <QuantityActions
                  itemId={item.id}
                  quantity={item.quantity}
                  inputId="exact-quantity-desktop"
                />
              </div>
            ) : null}
          </div>
        </div>
        <section className="panel-card mt-5 p-6">
          <h2 className="text-xl font-semibold">{t("detail.history")}</h2>
          {item.itemHistories.length === 0 ? (
            <p className="mt-4 text-sm text-app-muted">{t("detail.noHistory")}</p>
          ) : (
            <div className="mt-4 divide-y divide-app-border">
              {item.itemHistories.map((entry) => {
                const messageKey = getItemHistoryMessageKey(
                  entry.description,
                  entry.type,
                );
                const description = messageKey
                  ? t(messageKey)
                  : (entry.description ?? entry.type);

                return (
                  <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium">{description}</p>
                    <p className="mt-1 text-xs text-app-muted">
                      {entry.actorName} ·{" "}
                      {format.dateTime(entry.createdAt, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {entry.oldValue !== null || entry.newValue !== null ? (
                      <p className="mt-2 text-sm text-app-muted">
                        {entry.oldValue ?? t("detail.noValue")} →{" "}
                        {entry.newValue ?? t("detail.noValue")}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>
      <MobileNav />
    </main>
  );
}
