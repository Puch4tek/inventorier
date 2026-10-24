import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { listLocations } from "@/server/locations/list-locations";
import { LocationCreateModal } from "./location-create-modal";
import { LocationTree } from "./location-tree";

export const instant = false;

export default async function LocationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const locations = await listLocations();

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
          <Link href="/dashboard" className="font-semibold tracking-[-0.02em]">
            Inventory App
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
          >
            Panel główny
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:py-16">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-[#6e6e73]">Magazyn</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
              Lokalizacje
            </h1>
            <p className="mt-3 text-[15px] text-[#6e6e73]">
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
          <section className="mt-10 rounded-3xl border border-black/[0.06] bg-white p-8 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-semibold">Brak lokalizacji</h2>
            <p className="mt-2 text-sm text-[#6e6e73]">
              Dodaj pierwsze miejsce przechowywania, aby rozpocząć.
            </p>
          </section>
        ) : (
          <LocationTree locations={locations} />
        )}
      </section>
    </main>
  );
}
