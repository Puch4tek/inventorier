import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { logoutAction } from "@/app/dashboard/actions";
import { listLocations } from "@/server/locations/list-locations";
import { LocationCreateModal } from "./location-create-modal";
import { LocationTree } from "./location-tree";
import { MobileNav } from "@/app/dashboard/mobile-nav";
import { ThemeToggle } from "@/app/theme-toggle";

export const instant = false;

export default async function LocationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const locations = await listLocations();

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <header className="app-header">
        <div className="app-header-inner">
          <Link href="/dashboard" className="font-semibold tracking-[-0.02em]">
            Inventory App
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

      <section className="page-shell">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="page-kicker">Magazyn</p>
            <h1 className="page-title">
              Lokalizacje
            </h1>
            <p className="page-description">
              Zarządzaj miejscami przechowywania swoich przedmiotów.
            </p>
          </div>
          <LocationCreateModal
            locations={locations.map(({ id, name, parentId }) => ({
              id,
              name,
              parentId,
            }))}
          />
        </div>

        {locations.length === 0 ? (
          <section className="panel-card mt-10 p-8 text-center">
            <h2 className="text-xl font-semibold">Brak lokalizacji</h2>
            <p className="mt-2 text-sm text-[#6e6e73]">
              Dodaj pierwsze miejsce przechowywania, aby rozpocząć.
            </p>
          </section>
        ) : (
          <LocationTree locations={locations} />
        )}
      </section>
      <MobileNav />
    </main>
  );
}
