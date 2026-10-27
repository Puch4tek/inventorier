import Link from "next/link";
import { getButtonClassName } from "./button";
import { UserMenu } from "./user-menu";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { ThemeToggle } from "@/app/theme-toggle";
import { WarehouseSwitcher } from "./warehouse-switcher";
import {
  getCurrentWarehouse,
  listAccessibleWarehouses,
} from "@/server/warehouses/current-warehouse";

type AppHeaderProps = {
  backHref?: string;
  backLabel?: string;
  sectionLabel?: string;
  maxWidth?: string;
};

export async function AppHeader({
  backHref,
  backLabel,
  sectionLabel,
  maxWidth = "max-w-7xl",
}: AppHeaderProps) {
  const user = await getCurrentUser();
  const [warehouses, currentWarehouse] = user
    ? await Promise.all([listAccessibleWarehouses(), getCurrentWarehouse()])
    : [[], null];

  return (
    <header className="app-header">
      <div className={`app-header-inner ${maxWidth}`}>
        <div className="flex min-w-0 items-center gap-4">
          {backHref && backLabel ? (
            <Link
              href={backHref}
              className="text-sm font-medium text-app-muted transition hover:text-app-foreground"
            >
              ← {backLabel}
            </Link>
          ) : (
            <Link
              href={user ? "/dashboard" : "/"}
              className="font-semibold tracking-[-0.02em]"
            >
              Inventory App
            </Link>
          )}
          {sectionLabel ? (
            <span className="hidden text-sm text-app-muted sm:inline">
              {sectionLabel}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <WarehouseSwitcher
                warehouses={warehouses}
                activeId={currentWarehouse?.warehouse.id}
              />
              <Link
                href="/dashboard"
                className={getButtonClassName(
                  "secondary",
                  "px-3 py-2 text-xs sm:px-4 sm:text-sm",
                )}
              >
                Panel główny
              </Link>
              <UserMenu
                name={user.name}
                warehouses={warehouses}
                activeWarehouseId={currentWarehouse?.warehouse.id}
                canManageWarehouses={
                  user.role === "ADMIN" || currentWarehouse?.access === "MANAGER"
                }
              />
            </>
          ) : (
            <Link
              href="/login"
              className={getButtonClassName(
                "secondary",
                "px-3 py-2 text-xs sm:px-4 sm:text-sm",
              )}
            >
              Zaloguj się
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
