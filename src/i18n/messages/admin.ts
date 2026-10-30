import type { Locale } from "../locale";

const en = {
  tabs: {
    ariaLabel: "Administration",
    users: "Users",
    email: "Email",
  },
  usersPage: {
    section: "Administration",
    title: "Administrator dashboard",
    description: "Manage accounts, global roles, and system settings.",
    registrationTitle: "Self-registration",
    registrationDescription:
      "Choose whether new people can create accounts themselves. Administrators can still create users.",
    createTitle: "Create user",
    createDescription:
      "The user will receive a temporary password set by the administrator.",
    globalRoleNotice:
      "The global administrator role grants access to the entire instance. Other users are granted access separately for each warehouse.",
    createdAt: "Account since {date}",
    active: "Active",
    blocked: "Blocked",
    passwordChangeRequired: "Password change required",
    totpEnabled: "TOTP enabled",
    passkeys: "Passkeys: {count}",
  },
  createUser: {
    name: "Full name",
    email: "Email",
    password: "Temporary password",
    role: "System role",
    user: "User",
    administrator: "Administrator",
    creating: "Creating…",
    submit: "Create user",
  },
  userRole: {
    label: "User system role",
    user: "User",
    administrator: "Administrator",
    saving: "Saving…",
    save: "Save",
  },
  userActions: {
    saving: "Saving…",
    block: "Block account",
    unblock: "Unblock account",
    passwordChangeRequired: "Password change required",
    requirePasswordChange: "Require password change",
    resetTwoFactor: "Reset authentication methods",
    resetting: "Resetting…",
    resetTwoFactorConfirmation:
      "This reset removes TOTP and backup codes, registered passkeys, trusted devices, and login challenges, and revokes the user's existing sessions. Note: a sign-in verification started before the reset may finish concurrently. Continue?",
    newPassword: "New user password",
    passwordPlaceholder: "New password (at least 8 characters)",
    resetPassword: "Reset password",
    deleteUser: "Delete user",
    deleting: "Deleting…",
  },
  registration: {
    status: "Status:",
    enabled: "Enabled",
    disabled: "Disabled",
    saving: "Saving…",
    disable: "Disable registration",
    enable: "Enable registration",
  },
  warehousesPage: {
    section: "Warehouses",
    title: "Manage warehouses",
    description: "This list contains only warehouses available to your account.",
    createTitle: "Create warehouse",
    createDescription:
      "The new warehouse will be available to administrators. Grant access to other users separately.",
    allWarehouses: "All warehouses",
    accessibleWarehouses: "Warehouses you can access",
    noWarehouses: "No warehouse has been created for this instance yet.",
    noAssignedWarehouses: "You do not have access to any warehouse.",
    activeWarehouse: "Active warehouse",
    lastWarehouseCannotDelete: "The last warehouse cannot be deleted.",
    accessTitle: "User access",
    managerAccessDescription:
      "Only warehouse managers can manage user access.",
  },
  warehouseForm: {
    name: "Warehouse name",
    creating: "Creating…",
    create: "Create warehouse",
  },
  deleteWarehouse: {
    nameLabel: "Warehouse name",
    confirmWarning: "Click again to permanently delete this warehouse and its data.",
    deleting: "Deleting…",
    confirm: "Confirm deletion",
    delete: "Delete warehouse",
  },
  warehouseAccess: {
    kicker: "Warehouse access",
    description:
      "Grant access to instance users. The list shows only each user's role in this warehouse.",
    active: "Active account",
    blocked: "Account blocked",
    globalAdministrator: "Global administrator",
    yourAssignment: "Your assignment",
    administratorFullAccess: "Administrator — full access",
    noUsers: "No accounts to display.",
    roleLabel: "User's warehouse role",
    noAccess: "No access",
    user: "User",
    manager: "Manager",
    saving: "Saving…",
    save: "Save",
    removing: "Removing access…",
    remove: "Remove access",
    role: "Role: {role}",
  },
  emailSettings: {
    title: "Email settings",
    description: "Configure the mail server and password resets by email.",
    proxyWarning:
      "Password reset is unavailable: configure a trusted reverse proxy and set TRUSTED_PROXY_IP_HEADER=x-real-ip.",
    smtpTitle: "SMTP configuration",
    testTitle: "Test email",
    testDescription:
      "The test uses the saved SMTP settings. Save changes before sending. Administrators can send up to 5 test emails per hour.",
    proxyDescription:
      "In production, password resets require a trusted reverse proxy that overwrites the x-real-ip header, and the TRUSTED_PROXY_IP_HEADER=x-real-ip setting.",
    connectionLegend: "SMTP connection and sender",
    host: "SMTP server",
    port: "Port",
    encryption: "Encryption mode",
    username: "SMTP username",
    password: "New SMTP password",
    passwordUnreadable:
      "The saved password cannot be decrypted (check SMTP_ENCRYPTION_KEY). Enter a new password to replace it. ",
    passwordSaved: "A password is saved. ",
    passwordMissing: "No password is saved. ",
    passwordUnchanged: "Leave blank to keep the current password unchanged.",
    senderAddress: "Sender address",
    senderName: "Sender name",
    resetLegend: "Password reset",
    enableReset: "Enable password reset by email",
    resetWarning:
      "Disabling this blocks new reset requests. Previously sent links remain valid until they expire.",
    linkExpiry: "Link validity (minutes)",
    expiryDescription: "15 to 1440 minutes; applies to new links.",
    smtpRequired:
      "Password reset will be enabled only after a complete SMTP configuration is saved.",
    saving: "Saving…",
    save: "Save settings",
    recipient: "Recipient address",
    sending: "Sending…",
    sendTest: "Send test email",
  },
  emailActions: {
    errors: {
      unauthorized: "You are not authorized to perform this action.",
      invalidForm:
        "Check the form, port (1–65535), and expiry time (15–1440 minutes).",
      saveFailed:
        "Could not save email settings. Check the values, configuration completeness, and SMTP encryption key.",
      recipient: "Enter a valid recipient address.",
      testUnavailable:
        "Test sending is unavailable or the rate limit was exceeded. Try again later.",
      testFailed:
        "Could not send the test email. Check the saved SMTP settings and encryption key.",
      readFailed: "Could not read the email settings.",
      validation: "Invalid email settings.",
      configuration: "The SMTP configuration is incomplete.",
      encryption: "The SMTP encryption key is missing or invalid.",
    },
    saved: "Email settings have been saved.",
    testSent: "The test email has been sent.",
  },
  actions: {
    errors: {
      unauthorized: "You are not authorized to perform this action.",
      invalidUser: "Invalid user.",
      invalidUserData: "Invalid user details.",
      invalidRole: "Invalid role.",
      invalidRegistration: "Invalid registration setting.",
      invalidPasswordReset: "Invalid password reset details.",
      generic: "The action could not be completed. Please try again.",
      createUser: "The user could not be created.",
      duplicateEmail: "An account with this email address already exists.",
      changeAccountStatus: "The account status could not be changed.",
      requirePasswordChange: "Could not require a password change.",
      updateRole: "The role could not be changed.",
      resetPassword: "The password could not be reset.",
      deleteUser: "The user could not be deleted.",
      resetAuthentication: "Authentication could not be reset.",
      registration: "The registration setting could not be changed.",
      createWarehouse: "The warehouse could not be created.",
      invalidWarehouse: "Invalid warehouse.",
      noWarehouseAccess: "You do not have access to this warehouse.",
      invalidAssignment: "Invalid warehouse assignment details.",
      changeWarehouseAccess: "Warehouse access could not be changed.",
      removeWarehouseAccess: "Warehouse access could not be removed.",
      deleteWarehouse: "The warehouse could not be deleted.",
    },
    success: {
      resetAuthentication:
        "Two-factor authentication methods were removed and existing sessions were revoked.",
      registrationEnabled: "Self-registration has been enabled.",
      registrationDisabled: "Self-registration has been disabled.",
      accountUnblocked: "The account has been unblocked.",
      accountBlocked: "The account has been blocked.",
      passwordChangeRequired: "A password change is now required at the next sign-in.",
      userCreated: "The user has been created.",
      roleUpdated: "The user's role has been updated.",
      passwordReset: "The password has been reset.",
      userDeleted: "The user has been deleted.",
      warehouseCreated: "The warehouse has been created.",
      warehouseDeleted: "The warehouse has been deleted.",
      warehouseAccessUpdated: "Warehouse access has been updated.",
      warehouseAccessRemoved: "Warehouse access has been removed.",
    },
    knownErrors: {
      invalidUser: "Invalid user.",
      invalidRole: "Invalid role.",
      userMissing: "The user does not exist.",
      lastActiveAdministrator:
        "At least one active administrator must remain in the system.",
      cannotDeleteSelf: "You cannot delete your own account.",
      cannotBlockSelf: "You cannot block your own account.",
      cannotRemoveOwnAdmin: "You cannot remove your own administrator role.",
      passwordAccountMissing: "The user does not have a password sign-in account.",
      invalidWarehouseName: "Warehouse names must contain 2 to 100 characters.",
      warehouseMissing: "The warehouse does not exist.",
      warehouseConfirmation:
        "Enter the exact warehouse name to confirm deletion.",
      lastWarehouse: "The last warehouse cannot be deleted.",
      invalidWarehouseRole: "Invalid warehouse role.",
      managerCannotChangeOwnAssignment:
        "A manager cannot change their own assignment.",
      managerCannotRemoveOwnAssignment:
        "A manager cannot remove their own assignment.",
      cannotManageGlobalAdministrator:
        "A global administrator's assignment cannot be managed.",
      noWarehouseAssignment:
        "The user does not have an assignment to this warehouse.",
      invalidWarehouseRelationships:
        "Data cannot be deleted because invalid relationships between warehouses exist.",
      invalidWarehouse: "Invalid warehouse.",
      forbidden: "You are not authorized to perform this action.",
      invalidInput: "Invalid input.",
      passwordTooShort: "The password must contain at least 8 characters.",
    },
  },
} as const;

type SameMessageShape<T> = {
  [K in keyof T]: T[K] extends string ? string : SameMessageShape<T[K]>;
};

const pl: SameMessageShape<typeof en> = {
  tabs: {
    ariaLabel: "Administracja",
    users: "Użytkownicy",
    email: "E-mail",
  },
  usersPage: {
    section: "Administracja",
    title: "Panel administratora",
    description: "Zarządzaj kontami, rolami globalnymi i ustawieniami systemu.",
    registrationTitle: "Samodzielna rejestracja",
    registrationDescription:
      "Określ, czy nowe osoby mogą samodzielnie zakładać konta. Administratorzy nadal mogą tworzyć użytkowników.",
    createTitle: "Utwórz użytkownika",
    createDescription:
      "Użytkownik otrzyma tymczasowe hasło ustawione przez administratora.",
    globalRoleNotice:
      "Rola globalna administratora daje dostęp do całej instancji. Dostęp pozostałych użytkowników nadaje się osobno dla każdego magazynu.",
    createdAt: "Konto od {date}",
    active: "Aktywne",
    blocked: "Zablokowane",
    passwordChangeRequired: "Wymaga zmiany hasła",
    totpEnabled: "TOTP włączone",
    passkeys: "Klucze dostępu: {count}",
  },
  createUser: {
    name: "Imię i nazwisko",
    email: "E-mail",
    password: "Hasło tymczasowe",
    role: "Rola systemowa",
    user: "Użytkownik",
    administrator: "Administrator",
    creating: "Tworzenie…",
    submit: "Utwórz użytkownika",
  },
  userRole: {
    label: "Rola systemowa użytkownika",
    user: "Użytkownik",
    administrator: "Administrator",
    saving: "Zapisywanie…",
    save: "Zapisz",
  },
  userActions: {
    saving: "Zapisywanie…",
    block: "Zablokuj konto",
    unblock: "Odblokuj konto",
    passwordChangeRequired: "Zmiana hasła wymagana",
    requirePasswordChange: "Wymuś zmianę hasła",
    resetTwoFactor: "Resetuj metody uwierzytelniania",
    resetting: "Resetowanie…",
    resetTwoFactorConfirmation:
      "Reset usunie TOTP i kody zapasowe, zarejestrowane klucze dostępu, zaufane urządzenia oraz wyzwania logowania, a także unieważni istniejące sesje użytkownika. Uwaga: weryfikacja logowania rozpoczęta przed resetem może zakończyć się równolegle. Kontynuować?",
    newPassword: "Nowe hasło użytkownika",
    passwordPlaceholder: "Nowe hasło (min. 8 znaków)",
    resetPassword: "Resetuj hasło",
    deleteUser: "Usuń użytkownika",
    deleting: "Usuwanie…",
  },
  registration: {
    status: "Status:",
    enabled: "Włączona",
    disabled: "Wyłączona",
    saving: "Zapisywanie…",
    disable: "Wyłącz rejestrację",
    enable: "Włącz rejestrację",
  },
  warehousesPage: {
    section: "Magazyny",
    title: "Zarządzanie magazynami",
    description:
      "Lista zawiera wyłącznie magazyny dostępne dla Twojego konta.",
    createTitle: "Utwórz magazyn",
    createDescription:
      "Nowy magazyn będzie dostępny administratorom. Dostęp pozostałych użytkowników nadajesz osobno.",
    allWarehouses: "Wszystkie magazyny",
    accessibleWarehouses: "Magazyny z dostępem",
    noWarehouses: "W tej instancji nie utworzono jeszcze magazynu.",
    noAssignedWarehouses:
      "Nie masz przypisanego dostępu do żadnego magazynu.",
    activeWarehouse: "Aktywny magazyn",
    lastWarehouseCannotDelete: "Nie można usunąć ostatniego magazynu.",
    accessTitle: "Dostęp użytkowników",
    managerAccessDescription:
      "Zarządzanie dostępem jest dostępne dla menedżerów tego magazynu.",
  },
  warehouseForm: {
    name: "Nazwa magazynu",
    creating: "Tworzenie…",
    create: "Utwórz magazyn",
  },
  deleteWarehouse: {
    nameLabel: "Nazwa magazynu",
    confirmWarning:
      "Kliknij ponownie, aby trwale usunąć magazyn i jego dane.",
    deleting: "Usuwanie…",
    confirm: "Potwierdź usunięcie",
    delete: "Usuń magazyn",
  },
  warehouseAccess: {
    kicker: "Dostęp do magazynu",
    description:
      "Nadaj dostęp użytkownikom instancji. Lista pokazuje wyłącznie rolę w tym magazynie.",
    active: "Aktywne konto",
    blocked: "Konto zablokowane",
    globalAdministrator: "Administrator globalny",
    yourAssignment: "Twoje przypisanie",
    administratorFullAccess: "Administrator — pełny dostęp",
    noUsers: "Brak kont do wyświetlenia.",
    roleLabel: "Rola użytkownika w magazynie",
    noAccess: "Brak dostępu",
    user: "Użytkownik",
    manager: "Menedżer",
    saving: "Zapisywanie…",
    save: "Zapisz",
    removing: "Usuwanie dostępu…",
    remove: "Odbierz dostęp",
    role: "Rola: {role}",
  },
  emailSettings: {
    title: "Ustawienia e-mail",
    description: "Skonfiguruj serwer poczty i resetowanie hasła przez e-mail.",
    proxyWarning:
      "Reset hasła nie działa: skonfiguruj zaufane reverse proxy i ustaw TRUSTED_PROXY_IP_HEADER=x-real-ip.",
    smtpTitle: "Konfiguracja SMTP",
    testTitle: "Wiadomość testowa",
    testDescription:
      "Test używa zapisanych ustawień SMTP. Przed wysłaniem testu zapisz zmiany. Administrator może wysłać maksymalnie 5 wiadomości testowych na godzinę.",
    proxyDescription:
      "W środowisku produkcyjnym reset haseł wymaga zaufanego reverse proxy, które nadpisuje nagłówek x-real-ip, oraz ustawienia TRUSTED_PROXY_IP_HEADER=x-real-ip.",
    connectionLegend: "Połączenie SMTP i nadawca",
    host: "Serwer SMTP",
    port: "Port",
    encryption: "Tryb szyfrowania",
    username: "Nazwa użytkownika SMTP",
    password: "Nowe hasło SMTP",
    passwordUnreadable:
      "Zapisanego hasła nie można odszyfrować (sprawdź SMTP_ENCRYPTION_KEY). Wpisz nowe hasło, aby je zastąpić. ",
    passwordSaved: "Hasło jest zapisane. ",
    passwordMissing: "Hasło nie jest zapisane. ",
    passwordUnchanged: "Puste pole pozostawia obecne hasło bez zmian.",
    senderAddress: "Adres nadawcy",
    senderName: "Nazwa nadawcy",
    resetLegend: "Resetowanie hasła",
    enableReset: "Włącz resetowanie hasła przez e-mail",
    resetWarning:
      "Wyłączenie blokuje nowe prośby o reset. Wcześniej wysłane linki pozostają ważne do upływu ich czasu ważności.",
    linkExpiry: "Ważność linku (minuty)",
    expiryDescription: "Od 15 do 1440 minut; dotyczy nowych linków.",
    smtpRequired:
      "Reset zostanie włączony dopiero po zapisaniu kompletnej konfiguracji SMTP.",
    saving: "Zapisywanie…",
    save: "Zapisz ustawienia",
    recipient: "Adres odbiorcy",
    sending: "Wysyłanie…",
    sendTest: "Wyślij wiadomość testową",
  },
  emailActions: {
    errors: {
      unauthorized: "Nie masz uprawnień do wykonania tej operacji.",
      invalidForm:
        "Sprawdź dane formularza, port (1–65535) i czas ważności (15–1440 minut).",
      saveFailed:
        "Nie udało się zapisać ustawień. Sprawdź dane, kompletność konfiguracji i klucz szyfrowania SMTP.",
      recipient: "Podaj poprawny adres odbiorcy.",
      testUnavailable:
        "Wysyłka testowa jest obecnie niedostępna lub przekroczono limit. Spróbuj później.",
      testFailed:
        "Nie udało się wysłać wiadomości testowej. Sprawdź zapisane ustawienia SMTP i klucz szyfrowania.",
      readFailed: "Nie udało się odczytać ustawień e-mail.",
      validation: "Nieprawidłowe ustawienia e-mail.",
      configuration: "Konfiguracja SMTP jest niekompletna.",
      encryption: "Brak klucza SMTP_ENCRYPTION_KEY lub jest on nieprawidłowy.",
    },
    saved: "Ustawienia e-mail zostały zapisane.",
    testSent: "Wiadomość testowa została wysłana.",
  },
  actions: {
    errors: {
      unauthorized: "Nie masz uprawnień do wykonania tej operacji.",
      invalidUser: "Nieprawidłowy użytkownik.",
      invalidUserData: "Nieprawidłowe dane użytkownika.",
      invalidRole: "Nieprawidłowa rola.",
      invalidRegistration: "Nieprawidłowe ustawienie rejestracji.",
      invalidPasswordReset: "Nieprawidłowe dane resetowania hasła.",
      generic: "Nie udało się wykonać tej operacji. Spróbuj ponownie.",
      createUser: "Nie udało się utworzyć użytkownika.",
      duplicateEmail: "Konto z tym adresem e-mail już istnieje.",
      changeAccountStatus: "Nie udało się zmienić statusu konta.",
      requirePasswordChange: "Nie udało się wymusić zmiany hasła.",
      updateRole: "Nie udało się zmienić roli.",
      resetPassword: "Nie udało się zresetować hasła.",
      deleteUser: "Nie udało się usunąć użytkownika.",
      resetAuthentication: "Nie udało się zresetować uwierzytelniania.",
      registration: "Nie udało się zmienić ustawienia rejestracji.",
      createWarehouse: "Nie udało się utworzyć magazynu.",
      invalidWarehouse: "Nieprawidłowy magazyn.",
      noWarehouseAccess: "Nie masz dostępu do tego magazynu.",
      invalidAssignment: "Nieprawidłowe dane przypisania.",
      changeWarehouseAccess: "Nie udało się zmienić dostępu.",
      removeWarehouseAccess: "Nie udało się odebrać dostępu.",
      deleteWarehouse: "Nie udało się usunąć magazynu.",
    },
    success: {
      resetAuthentication:
        "Metody uwierzytelniania dwuskładnikowego usunięto, a istniejące sesje unieważniono.",
      registrationEnabled: "Samodzielna rejestracja została włączona.",
      registrationDisabled: "Samodzielna rejestracja została wyłączona.",
      accountUnblocked: "Konto zostało odblokowane.",
      accountBlocked: "Konto zostało zablokowane.",
      passwordChangeRequired:
        "Wymuszono zmianę hasła przy następnym logowaniu.",
      userCreated: "Użytkownik został utworzony.",
      roleUpdated: "Rola użytkownika została zaktualizowana.",
      passwordReset: "Hasło zostało zresetowane.",
      userDeleted: "Użytkownik został usunięty.",
      warehouseCreated: "Magazyn został utworzony.",
      warehouseDeleted: "Magazyn został usunięty.",
      warehouseAccessUpdated: "Dostęp do magazynu został zaktualizowany.",
      warehouseAccessRemoved: "Dostęp do magazynu został odebrany.",
    },
    knownErrors: {
      invalidUser: "Nieprawidłowy użytkownik.",
      invalidRole: "Nieprawidłowa rola.",
      userMissing: "Użytkownik nie istnieje.",
      lastActiveAdministrator:
        "W systemie musi pozostać przynajmniej jeden aktywny administrator.",
      cannotDeleteSelf: "Nie możesz usunąć własnego konta.",
      cannotBlockSelf: "Nie możesz zablokować własnego konta.",
      cannotRemoveOwnAdmin: "Nie możesz odebrać sobie roli administratora.",
      passwordAccountMissing:
        "Użytkownik nie ma konta umożliwiającego logowanie hasłem.",
      invalidWarehouseName: "Nazwa magazynu musi mieć od 2 do 100 znaków.",
      warehouseMissing: "Magazyn nie istnieje.",
      warehouseConfirmation:
        "Wpisz dokładną nazwę magazynu, aby potwierdzić usunięcie.",
      lastWarehouse: "Nie można usunąć ostatniego magazynu.",
      invalidWarehouseRole: "Nieprawidłowa rola magazynowa.",
      managerCannotChangeOwnAssignment:
        "Menedżer nie może zmienić własnego przypisania.",
      managerCannotRemoveOwnAssignment:
        "Menedżer nie może odebrać sobie własnego przypisania.",
      cannotManageGlobalAdministrator:
        "Nie można zarządzać przypisaniem globalnego administratora.",
      noWarehouseAssignment:
        "Użytkownik nie ma przypisania do tego magazynu.",
      invalidWarehouseRelationships:
        "Nie można usunąć danych: istnieją nieprawidłowe powiązania między magazynami.",
      invalidWarehouse: "Nieprawidłowy magazyn.",
      forbidden: "Nie masz uprawnień do wykonania tej operacji.",
      invalidInput: "Nieprawidłowe dane.",
      passwordTooShort: "Hasło musi mieć co najmniej 8 znaków.",
    },
  },
};

export const adminMessages = {
  en,
  pl,
} satisfies Record<Locale, SameMessageShape<typeof en>>;
