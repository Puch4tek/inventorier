import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { logoutAction } from "@/app/dashboard/actions";
import { getCategory } from "@/server/categories/get-category";
import { CategoryActions } from "./category-actions";
import { MobileNav } from "@/app/dashboard/mobile-nav";
import { ThemeToggle } from "@/app/theme-toggle";

export const instant = false;

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!(await getCurrentUser())) redirect("/login");
  const id = Number((await params).id);
  const query = await searchParams;
  const fromItem = Array.isArray(query.fromItem) ? query.fromItem[0] : query.fromItem;
  if (!Number.isInteger(id) || id <= 0) notFound();
  const category = await getCategory(id);
  if (!category) notFound();

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <header className="app-header"><div className="app-header-inner max-w-5xl"><Link href={fromItem && /^\d+$/.test(fromItem) ? `/items/${fromItem}` : "/categories"} className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f]">← {fromItem && /^\d+$/.test(fromItem) ? "Wróć do przedmiotu" : "Wróć do kategorii"}</Link><div className="flex items-center gap-2"><ThemeToggle /><form action={logoutAction}><button type="submit" className="primary-button px-3 py-2 text-xs sm:px-4 sm:text-sm">Wyloguj</button></form></div></div></header>
      <section className="page-shell page-shell-narrow">
        <p className="page-kicker">Kategoria</p>
        <h1 className="page-title">{category.name}</h1>
        <p className="page-description">{category.description || "Brak opisu"}</p>
        <CategoryActions category={{ id: category.id, name: category.name, description: category.description, itemCount: category._count.items }} />
        <section className="panel-card mt-10 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Przedmioty ({category.items.length})</h2>
          {category.items.length === 0 ? <p className="mt-4 text-sm text-[#6e6e73]">Brak aktywnych przedmiotów w tej kategorii.</p> : (
            <div className="mt-4 space-y-2">{category.items.map((item) => <Link key={item.id} href={`/items/${item.id}`} className="block rounded-xl bg-[#f5f5f7] px-4 py-3 hover:bg-[#e8e8ed]"><p className="text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-[#6e6e73]">{item.quantity} {item.unit} · {item.location.name} · {item.barcode}</p></Link>)}</div>
          )}
        </section>
      </section>
      <MobileNav />
    </main>
  );
}
