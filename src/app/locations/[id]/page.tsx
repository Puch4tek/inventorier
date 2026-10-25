import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { logoutAction } from "@/app/dashboard/actions";
import { getLocation } from "@/server/locations/get-location";
import { listLocations } from "@/server/locations/list-locations";
import { LocationActions } from "./location-actions";
import { MobileNav } from "@/app/dashboard/mobile-nav";
import { ThemeToggle } from "@/app/theme-toggle";

export const instant = false;

export default async function LocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const query = await searchParams;
  const fromItem = Array.isArray(query.fromItem) ? query.fromItem[0] : query.fromItem;
  const locationId = Number(id);

  if (!Number.isInteger(locationId) || locationId <= 0) {
    notFound();
  }

  const location = await getLocation(locationId);

  if (!location) {
    notFound();
  }

  const locations = await listLocations();

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <header className="app-header">
        <div className="app-header-inner max-w-5xl">
          <Link
            href={fromItem && /^\d+$/.test(fromItem) ? `/items/${fromItem}` : "/locations"}
            className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
          >
            ← {fromItem && /^\d+$/.test(fromItem) ? "Wróć do przedmiotu" : "Wróć do lokalizacji"}
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
        <p className="page-kicker">Lokalizacja</p>
        <h1 className="page-title">
          {location.name}
        </h1>
        <p className="page-description">
          {location.description || "Brak opisu"}
        </p>
        <LocationActions
          location={{
            id: location.id,
            name: location.name,
            description: location.description,
            parentId: location.parent?.id ?? null,
          }}
          locations={locations.map(({ id, name, parentId }) => ({
            id,
            name,
            parentId,
          }))}
        />

        {location.parent ? (
          <p className="mt-5 text-sm text-[#6e6e73]">
            Rodzic:{" "}
            <Link
              href={`/locations/${location.parent.id}`}
              className="font-medium text-[#1d1d1f] hover:underline"
            >
              {location.parent.name}
            </Link>
          </p>
        ) : null}

        <div className="mt-10 space-y-5">
          <section className="panel-card p-6">
            <h2 className="text-xl font-semibold">Podlokalizacje</h2>
            {location.children.length === 0 ? (
              <p className="mt-4 text-sm text-[#6e6e73]">
                Brak podlokalizacji.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {location.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/locations/${child.id}`}
                    className="block rounded-xl bg-[#f5f5f7] px-4 py-3 text-sm font-medium hover:bg-[#e8e8ed]"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="panel-card p-6">
            <h2 className="text-xl font-semibold">Przedmioty</h2>
            {location.items.length === 0 ? (
              <p className="mt-4 text-sm text-[#6e6e73]">
                Brak przedmiotów w tej lokalizacji.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {location.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.id}?fromLocation=${location.id}`}
                    className="rounded-xl bg-[#f5f5f7] px-4 py-3"
                  >
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-[#6e6e73]">
                      {item.quantity} {item.unit} · {item.barcode}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
      <MobileNav />
    </main>
  );
}
