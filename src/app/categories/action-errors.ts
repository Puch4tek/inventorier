export type CategoryActionErrorKey =
  | "nameRequired"
  | "invalidId"
  | "notFound"
  | "hasItems";

export function getCategoryActionErrorKey(
  error: unknown,
): CategoryActionErrorKey | undefined {
  if (!(error instanceof Error)) return undefined;
  switch (error.message) {
    case "Category name is required":
      return "nameRequired";
    case "Valid category ID is required":
      return "invalidId";
    case "Category not found":
      return "notFound";
    case "Category has items and cannot be deleted":
      return "hasItems";
    default:
      return undefined;
  }
}
