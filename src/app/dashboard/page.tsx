import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { logoutAction } from "@/app/dashboard/actions";

export const instant = false;

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
          <Link
            href="/dashboard"
            className="text-base font-semibold tracking-[-0.02em]"
          >
            Inventory App
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-xl bg-[#1d1d1f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#424245] focus:outline-none focus:ring-2 focus:ring-[#1d1d1f] focus:ring-offset-2"
            >
              Wyloguj
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:py-16">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-[#6e6e73]">Panel główny</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
              Witaj, {user.name}.
            </h1>
            <p className="mt-3 text-[15px] text-[#6e6e73]">
              To jest centrum zarządzania Twoim magazynem.
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-3 text-sm shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-[#6e6e73]">Zalogowano jako</p>
            <p className="mt-1 font-medium">{user.email}</p>
          </div>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Przedmioty"
            value="0"
            description="Aktywne przedmioty w ewidencji"
          />
          <DashboardCard
            title="Lokalizacje"
            value="0"
            description="Miejsca przechowywania"
          />
          <DashboardCard
            title="Zarchiwizowane"
            value="0"
            description="Przedmioty poza aktywną listą"
          />
        </div>

        <section className="mt-8 rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8">
          <p className="text-sm font-medium text-[#6e6e73]">Następny krok</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Zacznij od dodania lokalizacji
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-6 text-[#6e6e73]">
            Utwórz pierwsze miejsce przechowywania, a następnie przypisz do
            niego swoje przedmioty.
          </p>
        </section>
      </section>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <p className="text-sm font-medium text-[#6e6e73]">{title}</p>
      <p className="mt-5 text-4xl font-semibold tracking-[-0.04em]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[#6e6e73]">{description}</p>
    </article>
  );
}
