import { AppHeader } from "@/components/app-header";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { getCategory } from "@/server/categories/get-category";
import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { canManageWarehouseData } from "@/server/warehouses/permissions";
import { CategoryActions } from "./category-actions";
import { MobileNav } from "@/app/dashboard/mobile-nav";
import { getFormatter, getTranslations } from "next-intl/server";

export const instant = false;

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await getCurrentUser())) redirect("/login");
  const id = Number((await params).id);
  const query = await searchParams;
  const fromItem = Array.isArray(query.fromItem) ? query.fromItem[0] : query.fromItem;
  if (!Number.isInteger(id) || id <= 0) notFound();
  const category = await getCategory(id);
  if (!category) notFound();
  const current = await requireCurrentWarehouse();
  const [t, format] = await Promise.all([
    getTranslations("organization.categories"),
    getFormatter(),
  ]);

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader
        maxWidth="max-w-5xl"
        backHref={fromItem && /^\d+$/.test(fromItem) ? `/items/${fromItem}` : "/categories"}
        backLabel={fromItem && /^\d+$/.test(fromItem) ? t("backToItem") : t("backToCategories")}
      />
      <section className="page-shell page-shell-narrow">
        <p className="page-kicker">{t("detailKicker")}</p>
        <h1 className="page-title">{category.name}</h1>
        <p className="page-description">{category.description || t("noDescription")}</p>
        {canManageWarehouseData(current) ? (
          <CategoryActions category={{ id: category.id, name: category.name, description: category.description, itemCount: category._count.items }} />
        ) : null}
        <section className="panel-card mt-10 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">{t("itemsTitle", { count: category.items.length })}</h2>
          {category.items.length === 0 ? <p className="mt-4 text-sm text-app-muted">{t("emptyItems")}</p> : (
            <div className="mt-4 space-y-2">{category.items.map((item) => <Link key={item.id} href={`/items/${item.id}`} className="block rounded-xl bg-app-surface-muted px-4 py-3 hover:bg-app-surface-subtle"><p className="text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-app-muted">{format.number(item.quantity)} {item.unit} · {item.location.name} · {item.barcode}</p></Link>)}</div>
          )}
        </section>
      </section>
      <MobileNav />
    </main>
  );
}
