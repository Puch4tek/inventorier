"use client";

import { Button } from "@/components/button";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

type Option = { id: number; name: string };

export function ItemFilters({
  locations,
  categories,
}: {
  locations: Option[];
  categories: Option[];
}) {
  const t = useTranslations("items");
  const router = useRouter();
  const searchParams = useSearchParams();
  const filtersRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const filters = filtersRef.current;
    if (!filters) return;

    const desktopQuery = window.matchMedia("(min-width: 640px)");
    const syncOpenState = () => {
      if (desktopQuery.matches) {
        filters.open = true;
      }
    };

    syncOpenState();
    desktopQuery.addEventListener("change", syncOpenState);
    return () => desktopQuery.removeEventListener("change", syncOpenState);
  }, []);

  function updateFilter(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    router.push(`/items?${params.toString()}`);
  }

  return (
    <details ref={filtersRef} className="filters-panel panel-card group mt-5 p-4 sm:mt-8 sm:p-5">
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold sm:hidden">
        <span>{t("filters.summary")}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 fill-current text-app-muted transition-transform group-open:rotate-180"
        >
          <path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
        </svg>
      </summary>
      <form
        onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        const nextSearch = new FormData(event.currentTarget)
          .get("search")
          ?.toString()
          .trim();
        if (nextSearch) params.set("search", nextSearch);
        else params.delete("search");
        router.push(`/items?${params.toString()}`);
      }}
        className="mt-3 grid gap-3 sm:mt-0 sm:grid-cols-2 lg:grid-cols-5"
      >
      <input
        name="search"
        aria-label={t("filters.searchLabel")}
        key={searchParams.toString()}
        defaultValue={searchParams.get("search") ?? ""}
        placeholder={t("filters.searchPlaceholder")}
        className="field-input mt-0 lg:col-span-2"
      />
      <select
        name="locationId"
        aria-label={t("filters.locationLabel")}
        defaultValue={searchParams.get("locationId") ?? ""}
        onChange={(event) => updateFilter("locationId", event.target.value)}
        className="field-input field-select mt-0"
      >
        <option value="">{t("filters.allLocations")}</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
      <select
        name="categoryId"
        aria-label={t("filters.categoryLabel")}
        defaultValue={searchParams.get("categoryId") ?? ""}
        onChange={(event) => updateFilter("categoryId", event.target.value)}
        className="field-input field-select mt-0"
      >
        <option value="">{t("filters.allCategories")}</option>
        <option value="none">{t("filters.noCategory")}</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        name="sort"
        aria-label={t("filters.sortLabel")}
        value={`${["quantity", "updatedAt"].includes(searchParams.get("sortBy") ?? "") ? searchParams.get("sortBy") : "name"}-${searchParams.get("sortDirection") === "desc" ? "desc" : "asc"}`}
        onChange={(event) => {
          const [sortBy, sortDirection] = event.target.value.split("-");
          const params = new URLSearchParams(searchParams.toString());
          params.set("sortBy", sortBy);
          params.set("sortDirection", sortDirection);
          router.push(`/items?${params.toString()}`);
        }}
        className="field-input field-select mt-0"
      >
        <option value="name-asc">{t("filters.nameAsc")}</option>
        <option value="name-desc">{t("filters.nameDesc")}</option>
        <option value="quantity-asc">{t("filters.quantityAsc")}</option>
        <option value="quantity-desc">{t("filters.quantityDesc")}</option>
        <option value="updatedAt-desc">{t("filters.recentlyUpdated")}</option>
        <option value="updatedAt-asc">{t("filters.leastRecentlyUpdated")}</option>
      </select>
      <div className="flex flex-wrap gap-3 sm:col-span-2 lg:col-span-5">
        <select
          name="archived"
          aria-label={t("filters.archiveState")}
          defaultValue={searchParams.get("archived") ?? "active"}
          onChange={(event) => updateFilter("archived", event.target.value)}
          className="field-input field-select mt-0 min-w-0 sm:max-w-xs"
        >
          <option value="active">{t("filters.active")}</option>
          <option value="archived">{t("filters.archived")}</option>
        </select>
        <Button variant="primary"
          type="submit"
          className="px-5 py-3 text-sm font-semibold transition"
        >
          {t("filters.search")}
        </Button>
        <Button
          variant="secondary"
          type="button"
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) {
              const searchInput = form.elements.namedItem("search");
              const locationInput = form.elements.namedItem("locationId");
              const categoryInput = form.elements.namedItem("categoryId");
              const archivedInput = form.elements.namedItem("archived");

              if (searchInput instanceof HTMLInputElement) {
                searchInput.value = "";
              }
              if (locationInput instanceof HTMLSelectElement) {
                locationInput.value = "";
              }
              if (categoryInput instanceof HTMLSelectElement) {
                categoryInput.value = "";
              }
              if (archivedInput instanceof HTMLSelectElement) {
                archivedInput.value = "active";
              }
            }

            router.replace("/items");
          }}
          className="px-5 py-3 text-sm"
        >
          {t("filters.clear")}
        </Button>
      </div>
      </form>
    </details>
  );
}
