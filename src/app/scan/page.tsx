import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { logoutAction } from "@/app/dashboard/actions";
import { Scanner } from "./scanner";
import { MobileNav } from "@/app/dashboard/mobile-nav";
import { ThemeToggle } from "@/app/theme-toggle";

export const instant = false;

export default async function ScanPage() {
  if (!(await getCurrentUser())) {
    redirect("/login");
  }

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/dashboard" className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f]">
            ← Panel główny
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
        <p className="page-kicker">Magazyn</p>
        <h1 className="page-title">Skanuj kod</h1>
        <p className="page-description">
          Skieruj aparat na kod Code 128 albo wpisz go ręcznie.
        </p>
        <section className="panel-card mt-8 p-5 sm:p-8">
          <Scanner />
        </section>
      </section>
      <MobileNav />
    </main>
  );
}
