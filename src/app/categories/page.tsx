import { AppHeader } from "@/components/app-header";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { listCategories } from "@/server/categories/list-categories";
import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { canManageWarehouseData } from "@/server/warehouses/permissions";
import { CategoryCreateModal } from "./category-create-modal";
import { MobileNav } from "@/app/dashboard/mobile-nav";

export const instant = false;

export default async function CategoriesPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const [categories, current] = await Promise.all([listCategories(), requireCurrentWarehouse()]);
  const canManage = canManageWarehouseData(current);

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader />
      <section className="page-shell">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="page-kicker">Magazyn</p>
            <h1 className="page-title">Kategorie</h1>
            <p className="page-description">Porządkuj przedmioty według ich przeznaczenia.</p>
          </div>
          {canManage ? <CategoryCreateModal /> : null}
        </div>
        {categories.length === 0 ? (
          <section className="panel-card mt-10 p-8 text-center">
            <h2 className="text-xl font-semibold">Brak kategorii</h2>
            <p className="mt-2 text-sm text-app-muted">
              {canManage ? "Dodaj pierwszą kategorię, aby uporządkować przedmioty." : "W tym magazynie nie ma kategorii."}
            </p>
          </section>
        ) : (
          <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.id}`} className="panel-card p-6 transition hover:bg-app-surface-subtle">
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <p className="mt-3 text-sm text-app-muted">
                  {category._count.items}{" "}
                  {category._count.items === 1 ? "przedmiot" : "przedmiotów"}
                </p>
              </Link>
            ))}
          </section>
        )}
      </section>
      <MobileNav />
    </main>
  );
}
