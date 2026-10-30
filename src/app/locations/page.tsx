import { AppHeader } from "@/components/app-header";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { listLocations } from "@/server/locations/list-locations";
import { requireCurrentWarehouse } from "@/server/warehouses/current-warehouse";
import { canManageWarehouseData } from "@/server/warehouses/permissions";
import { LocationCreateModal } from "./location-create-modal";
import { LocationTree } from "./location-tree";
import { MobileNav } from "@/app/dashboard/mobile-nav";
import { getTranslations } from "next-intl/server";

export const instant = false;

export default async function LocationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [locations, current] = await Promise.all([listLocations(), requireCurrentWarehouse()]);
  const t = await getTranslations("organization.locations");
  const canManage = canManageWarehouseData(current);

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader />

      <section className="page-shell">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="page-kicker">{t("section")}</p>
            <h1 className="page-title">{t("title")}</h1>
            <p className="page-description">{t("description")}</p>
          </div>
          {canManage ? (
            <LocationCreateModal
              locations={locations.map(({ id, name, parentId }) => ({
                id,
                name,
                parentId,
              }))}
            />
          ) : null}
        </div>

        {locations.length === 0 ? (
          <section className="panel-card mt-10 p-8 text-center">
            <h2 className="text-xl font-semibold">{t("emptyTitle")}</h2>
            <p className="mt-2 text-sm text-app-muted">
              {canManage ? t("emptyCanManage") : t("emptyReadOnly")}
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
