import { AppHeader } from "@/components/app-header";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { Scanner } from "./scanner";
import { MobileNav } from "@/app/dashboard/mobile-nav";

export const instant = false;

export default async function ScanPage() {
  if (!(await getCurrentUser())) {
    redirect("/login");
  }

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader backHref="/dashboard" backLabel="Panel główny" />
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
