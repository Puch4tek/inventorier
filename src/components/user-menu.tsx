"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/dashboard/actions";
import { LocaleSwitcher } from "./locale-switcher";
import { WarehouseSwitcher } from "./warehouse-switcher";
import { useTranslations } from "next-intl";

type UserMenuProps = {
  name: string;
  isAdmin: boolean;
  warehouses: { id: string; name: string }[];
  activeWarehouseId?: string;
  canManageWarehouses: boolean;
};

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "?";
}

export function UserMenu({
  name,
  isAdmin,
  warehouses,
  activeWarehouseId,
  canManageWarehouses,
}: UserMenuProps) {
  const t = useTranslations("organization.userMenu");
  const languageT = useTranslations("common.language");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-app-accent text-xs font-semibold text-app-inverse transition hover:bg-app-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent"
        aria-expanded={open}
        aria-controls="user-menu"
        aria-label={t("buttonLabel", { name })}
      >
        {getInitials(name)}
      </button>

      {open ? (
        <div
          id="user-menu"
          className="absolute right-0 top-12 z-20 min-w-48 rounded-2xl border border-app-border bg-app-surface p-2 shadow-modal"
        >
          <div className="border-b border-app-border px-3 py-2">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="mt-1 text-xs text-app-muted">{t("signedIn")}</p>
          </div>
          <div className="space-y-3 border-b border-app-border px-3 py-3 sm:hidden">
            <div>
              <p className="mb-1 text-xs font-medium text-app-muted">{languageT("label")}</p>
              <LocaleSwitcher mobile />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-app-muted">{t("warehouse")}</p>
              <WarehouseSwitcher
                warehouses={warehouses}
                activeId={activeWarehouseId}
                mobile
              />
            </div>
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl px-3 py-2 text-sm text-app-foreground transition hover:bg-app-surface-muted"
          >
            {t("dashboard")}
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl px-3 py-2 text-sm text-app-foreground transition hover:bg-app-surface-muted"
          >
            {t("accountSettings")}
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-xl px-3 py-2 text-sm text-app-foreground transition hover:bg-app-surface-muted"
            >
              {t("administrator")}
            </Link>
          ) : null}
          {canManageWarehouses ? (
            <Link
            href="/settings/warehouses"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-xl px-3 py-2 text-sm text-app-foreground transition hover:bg-app-surface-muted"
            >
            {t("warehouseManagement")}
            </Link>
          ) : null}
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm text-app-danger transition hover:bg-app-danger-surface"
            >
              {t("signOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
