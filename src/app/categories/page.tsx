import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { logoutAction } from "@/app/dashboard/actions";
import { listCategories } from "@/server/categories/list-categories";
import { CategoryCreateModal } from "./category-create-modal";
import { MobileNav } from "@/app/dashboard/mobile-nav";
import { ThemeToggle } from "@/app/theme-toggle";

export const instant = false;

export default async function CategoriesPage() {
  if (!(await getCurrentUser())) redirect("/login");
  const categories = await listCategories();

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/dashboard" className="font-semibold tracking-[-0.02em]">Inventory App</Link>
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
            <h1 className="page-title">Kategorie</h1>
            <p className="page-description">Porządkuj przedmioty według ich przeznaczenia.</p>
          </div>
          <CategoryCreateModal />
        </div>
        {categories.length === 0 ? (
          <section className="panel-card mt-10 p-8 text-center">
            <h2 className="text-xl font-semibold">Brak kategorii</h2>
            <p className="mt-2 text-sm text-[#6e6e73]">Dodaj pierwszą kategorię, aby uporządkować przedmioty.</p>
          </section>
        ) : (
          <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link key={category.id} href={`/categories/${category.id}`} className="panel-card p-6 transition hover:bg-[#fafafa]">
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <p className="mt-3 text-sm text-[#6e6e73]">
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
