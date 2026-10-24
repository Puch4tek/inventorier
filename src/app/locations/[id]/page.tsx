import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { getLocation } from "@/server/locations/get-location";
import { listLocations } from "@/server/locations/list-locations";
import { LocationActions } from "./location-actions";

export const instant = false;

export default async function LocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
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
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <header className="border-b border-black/[0.06] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-4 sm:px-10">
          <Link
            href="/locations"
            className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f]"
          >
            ← Wróć do lokalizacji
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12 sm:px-10 lg:py-16">
        <p className="text-sm font-medium text-[#6e6e73]">Lokalizacja</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.04em]">
          {location.name}
        </h1>
        <p className="mt-3 text-[15px] text-[#6e6e73]">
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
          <section className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
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

          <section className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-semibold">Przedmioty</h2>
            {location.items.length === 0 ? (
              <p className="mt-4 text-sm text-[#6e6e73]">
                Brak przedmiotów w tej lokalizacji.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {location.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-[#f5f5f7] px-4 py-3"
                  >
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-[#6e6e73]">
                      {item.quantity} {item.unit} · {item.barcode}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
