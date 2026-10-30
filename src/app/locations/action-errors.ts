export type LocationActionErrorKey =
  | "invalidId"
  | "invalidParent"
  | "nameRequired"
  | "parentNotFound"
  | "parentSelf"
  | "cycle"
  | "existingCycle"
  | "notFound"
  | "hasItemsOrChildren";

export function getLocationActionErrorKey(
  error: unknown,
): LocationActionErrorKey | undefined {
  if (!(error instanceof Error)) return undefined;
  switch (error.message) {
    case "Location name is required":
      return "nameRequired";
    case "Parent location ID must be a positive integer":
    case "Valid parent ID is required":
      return "invalidParent";
    case "Parent location does not exist":
    case "Parent location not found":
      return "parentNotFound";
    case "Valid location ID is required":
    case "Location ID is required":
      return "invalidId";
    case "Location not found":
      return "notFound";
    case "A location cannot be its own parent":
      return "parentSelf";
    case "This change would create a location cycle":
      return "cycle";
    case "Existing location cycle detected":
      return "existingCycle";
    case "Location has items or children":
      return "hasItemsOrChildren";
    default:
      return undefined;
  }
}
