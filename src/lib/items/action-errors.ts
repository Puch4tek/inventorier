export type ItemErrorKey =
  | "errors.invalidItemId"
  | "errors.invalidQuantity"
  | "errors.deltaMustBeInteger"
  | "errors.quantityNegative"
  | "errors.itemNotFound"
  | "errors.itemArchived"
  | "errors.nameRequired"
  | "errors.quantityPositive"
  | "errors.descriptionMustBeText"
  | "errors.unitRequired"
  | "errors.locationIdInvalid"
  | "errors.categoryIdInvalid"
  | "errors.locationNotFound"
  | "errors.categoryNotFound"
  | "errors.barcodeGenerationFailed"
  | "errors.barcodeRetriesFailed"
  | "errors.itemAlreadyArchived"
  | "errors.itemAlreadyActive"
  | "errors.locationIdRequired"
  | "errors.categoryIdRequired";

const knownItemErrors: Record<string, ItemErrorKey> = {
  "Nieprawidłowy identyfikator": "errors.invalidItemId",
  "Nieprawidłowa ilość": "errors.invalidQuantity",
  "Zmiana ilości musi być liczbą całkowitą": "errors.deltaMustBeInteger",
  "Ilość nie może być mniejsza niż zero": "errors.quantityNegative",
  "Przedmiot nie istnieje": "errors.itemNotFound",
  "Nie można zmienić ilości zarchiwizowanego przedmiotu": "errors.itemArchived",
  "Nazwa jest wymagana": "errors.nameRequired",
  "Ilość musi być dodatnia": "errors.quantityPositive",
  "Opis musi być tekstem": "errors.descriptionMustBeText",
  "Jednostka jest wymagana": "errors.unitRequired",
  "ID lokalizacji musi być liczbą dodatnią": "errors.locationIdInvalid",
  "ID kategorii musi być liczbą dodatnią": "errors.categoryIdInvalid",
  "Lokalizacja nie istnieje": "errors.locationNotFound",
  "Kategoria nie istnieje": "errors.categoryNotFound",
  "Nie udało się wygenerować kodu kreskowego.": "errors.barcodeGenerationFailed",
  "Nie udało się wygenerować unikalnego kodu kreskowego po 10 próbach.": "errors.barcodeRetriesFailed",
  "Prawidłowe ID przedmiotu jest wymagane": "errors.invalidItemId",
  "Przedmiot jest już zarchiwizowany": "errors.itemAlreadyArchived",
  "Przedmiot jest już aktywny": "errors.itemAlreadyActive",
  "Nie można edytować zarchiwizowanego przedmiotu": "errors.itemArchived",
  "Prawidłowe ID lokalizacji jest wymagane": "errors.locationIdRequired",
  "Prawidłowe ID kategorii jest wymagane": "errors.categoryIdRequired",
};

export function localizeItemActionError(
  error: unknown,
  fallback: string,
  translate: (key: ItemErrorKey) => string,
): string {
  const key =
    error instanceof Error ? knownItemErrors[error.message] : undefined;
  return key ? translate(key) : fallback;
}
