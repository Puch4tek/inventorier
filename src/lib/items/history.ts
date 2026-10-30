export const itemHistoryDescriptions = {
  created: "inventorier:i18n:v1:items:created",
  nameChanged: "inventorier:i18n:v1:items:name-changed",
  descriptionChanged: "inventorier:i18n:v1:items:description-changed",
  unitChanged: "inventorier:i18n:v1:items:unit-changed",
  categoryChanged: "inventorier:i18n:v1:items:category-changed",
  locationChanged: "inventorier:i18n:v1:items:location-changed",
  quantityChanged: "inventorier:i18n:v1:items:quantity-changed",
  archived: "inventorier:i18n:v1:items:archived",
  restored: "inventorier:i18n:v1:items:restored",
} as const;

export type ItemHistoryMessageKey =
  | "history.created"
  | "history.nameChanged"
  | "history.descriptionChanged"
  | "history.unitChanged"
  | "history.categoryChanged"
  | "history.locationChanged"
  | "history.quantityChanged"
  | "history.archived"
  | "history.restored"
  | "history.types.itemCreated"
  | "history.types.itemUpdated"
  | "history.types.quantityChanged"
  | "history.types.locationChanged"
  | "history.types.itemArchived"
  | "history.types.itemRestored";

const descriptionMessageKeys: Record<string, ItemHistoryMessageKey> = {
  [itemHistoryDescriptions.created]: "history.created",
  [itemHistoryDescriptions.nameChanged]: "history.nameChanged",
  [itemHistoryDescriptions.descriptionChanged]: "history.descriptionChanged",
  [itemHistoryDescriptions.unitChanged]: "history.unitChanged",
  [itemHistoryDescriptions.categoryChanged]: "history.categoryChanged",
  [itemHistoryDescriptions.locationChanged]: "history.locationChanged",
  [itemHistoryDescriptions.quantityChanged]: "history.quantityChanged",
  [itemHistoryDescriptions.archived]: "history.archived",
  [itemHistoryDescriptions.restored]: "history.restored",
};

const typeMessageKeys: Record<string, ItemHistoryMessageKey> = {
  ITEM_CREATED: "history.types.itemCreated",
  ITEM_UPDATED: "history.types.itemUpdated",
  QUANTITY_CHANGED: "history.types.quantityChanged",
  LOCATION_CHANGED: "history.types.locationChanged",
  ITEM_ARCHIVED: "history.types.itemArchived",
  ITEM_RESTORED: "history.types.itemRestored",
};

export function getItemHistoryMessageKey(
  description: string | null,
  type: string,
): ItemHistoryMessageKey | undefined {
  if (description !== null) return descriptionMessageKeys[description];
  return typeMessageKeys[type];
}
