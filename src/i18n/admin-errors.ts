import type { Locale } from "./locale";
import { adminMessages } from "./messages/admin";

const knownErrorKeys: Record<string, keyof typeof adminMessages.en.actions.knownErrors> = {
  "Nieprawidłowy użytkownik.": "invalidUser",
  "Nieprawidłowa rola.": "invalidRole",
  "Użytkownik nie istnieje.": "userMissing",
  "W systemie musi pozostać przynajmniej jeden aktywny administrator.": "lastActiveAdministrator",
  "Nie możesz usunąć własnego konta.": "cannotDeleteSelf",
  "Nie możesz zablokować własnego konta.": "cannotBlockSelf",
  "Nie możesz odebrać sobie roli administratora.": "cannotRemoveOwnAdmin",
  "Użytkownik nie ma konta umożliwiającego logowanie hasłem.": "passwordAccountMissing",
  "Hasło musi mieć co najmniej 8 znaków.": "passwordTooShort",
  "Nazwa magazynu musi mieć od 2 do 100 znaków.": "invalidWarehouseName",
  "Nieprawidłowy magazyn.": "invalidWarehouse",
  "Magazyn nie istnieje.": "warehouseMissing",
  "Wpisz dokładną nazwę magazynu, aby potwierdzić usunięcie.": "warehouseConfirmation",
  "Nie można usunąć ostatniego magazynu.": "lastWarehouse",
  "Nieprawidłowa rola magazynowa.": "invalidWarehouseRole",
  "Menedżer nie może zmienić własnego przypisania.": "managerCannotChangeOwnAssignment",
  "Menedżer nie może odebrać sobie własnego przypisania.": "managerCannotRemoveOwnAssignment",
  "Nie można zarządzać przypisaniem globalnego administratora.": "cannotManageGlobalAdministrator",
  "Użytkownik nie ma przypisania do tego magazynu.": "noWarehouseAssignment",
  "Nie można usunąć danych: istnieją nieprawidłowe powiązania między magazynami.": "invalidWarehouseRelationships",
  "Nie masz uprawnień do wykonania tej operacji.": "forbidden",
  "Tylko administrator lub menedżer tego magazynu może zarządzać danymi.": "forbidden",
};

export function getAdminActionError(
  error: unknown,
  locale: Locale,
  fallback: keyof typeof adminMessages.en.actions.errors,
) {
  const knownErrorKey =
    error instanceof Error ? knownErrorKeys[error.message] : undefined;
  return knownErrorKey
    ? adminMessages[locale].actions.knownErrors[knownErrorKey]
    : adminMessages[locale].actions.errors[fallback];
}
