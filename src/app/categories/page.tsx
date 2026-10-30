import { AppHeader } from "@/components/app-header";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { listCategories } from "@/server/categories/list-categories";
import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { canManageWarehouseData } from "@/server/warehouses/permissions";
import { CategoryCreateModal } from "./category-create-modal";
import { MobileNav } from "@/app/dashboard/mobile-nav";
import { getTranslations } from "next-intl/server";

export const instant = false;

export default async function CategoriesPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const [categories, current] = await Promise.all([listCategories(), requireCurrentWarehouse()]);
  const t = await getTranslations("organization.categories");
  const canManage = canManageWarehouseData(current);

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader />
      <section className="page-shell">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="page-kicker">{t("section")}</p>
            <h1 className="page-title">{t("title")}</h1>
            <p className="page-description">{t("description")}</p>
          </div>
          {canManage ? <CategoryCreateModal /> : null}
        </div>
        {categories.length === 0 ? (
          <section className="panel-card mt-10 p-8 text-center">
            <h2 className="text-xl font-semibold">{t("emptyTitle")}</h2>
            <p className="mt-2 text-sm text-app-muted">
              {canManage ? t("emptyCanManage") : t("emptyReadOnly")}
            </p>
          </section>
        ) : (
          <section className="panel-card mt-5 overflow-hidden transition hover:bg-app-surface-subtle sm:mt-10">
            <div className="divide-y divide-app-border">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.id}`}
                  className="block px-4 py-3 transition sm:px-8 sm:py-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold">{category.name}</h2>
                      <p className="mt-1 truncate text-xs text-app-muted sm:text-sm">
                        {category.description || t("noDescription")}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold sm:text-base">
                      {t("itemCount", { count: category._count.items })}
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
