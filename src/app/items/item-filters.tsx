"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Option = { id: number; name: string };

export function ItemFilters({
  locations,
  categories,
}: {
  locations: Option[];
  categories: Option[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    router.push(`/items?${params.toString()}`);
  }

  return (
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
      className="panel-card mt-8 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5"
    >
      <input
        name="search"
        key={searchParams.toString()}
        defaultValue={searchParams.get("search") ?? ""}
        placeholder="Szukaj przedmiotu..."
        className="field-input mt-0 lg:col-span-2"
      />
      <select
        name="locationId"
        defaultValue={searchParams.get("locationId") ?? ""}
        onChange={(event) => updateFilter("locationId", event.target.value)}
        className="field-input mt-0"
      >
        <option value="">Wszystkie lokalizacje</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
      <select
        name="categoryId"
        defaultValue={searchParams.get("categoryId") ?? ""}
        onChange={(event) => updateFilter("categoryId", event.target.value)}
        className="field-input mt-0"
      >
        <option value="">Wszystkie kategorie</option>
        <option value="none">Bez kategorii</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        name="sort"
        defaultValue={searchParams.get("sort") ?? "name-asc"}
        onChange={(event) => {
          const [sortBy, sortDirection] = event.target.value.split("-");
          const params = new URLSearchParams(searchParams.toString());
          params.set("sortBy", sortBy);
          params.set("sortDirection", sortDirection);
          router.push(`/items?${params.toString()}`);
        }}
        className="field-input mt-0"
      >
        <option value="name-asc">Nazwa A-Z</option>
        <option value="name-desc">Nazwa Z-A</option>
        <option value="quantity-asc">Ilość rosnąco</option>
        <option value="quantity-desc">Ilość malejąco</option>
        <option value="updatedAt-desc">Ostatnio zmienione</option>
        <option value="updatedAt-asc">Najdawniej zmienione</option>
      </select>
      <div className="flex gap-3 sm:col-span-2 lg:col-span-5">
        <select
          name="archived"
          defaultValue={searchParams.get("archived") ?? "active"}
          onChange={(event) => updateFilter("archived", event.target.value)}
          className="field-input mt-0 max-w-xs"
        >
          <option value="active">Aktywne</option>
          <option value="archived">Zarchiwizowane</option>
        </select>
        <button
          type="submit"
          className="primary-button"
        >
          Szukaj
        </button>
        <button
          type="button"
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) {
              const searchInput = form.elements.namedItem("search");
              const locationInput = form.elements.namedItem("locationId");
              const categoryInput = form.elements.namedItem("categoryId");
              const sortInput = form.elements.namedItem("sort");
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
              if (sortInput instanceof HTMLSelectElement) {
                sortInput.value = "name-asc";
              }
              if (archivedInput instanceof HTMLSelectElement) {
                archivedInput.value = "active";
              }
            }

            router.replace("/items");
          }}
          className="secondary-button"
        >
          Wyczyść
        </button>
      </div>
    </form>
  );
}
