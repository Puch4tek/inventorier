import type { Locale } from "../locale";

type OrganizationMessages = {
  home: {
    kicker: string;
    headline: string;
    description: string;
    createAccount: string;
    existingAccount: string;
    tip: string;
    previewDashboard: string;
    previewWarehouse: string;
    current: string;
    items: string;
    locations: string;
    categories: string;
    toReview: string;
    recentlyAdded: string;
    positions: string;
    exampleItemOne: string;
    exampleItemTwo: string;
    exampleItemThree: string;
    highlightKicker: string;
    highlightTitle: string;
    highlightInventoryTitle: string;
    highlightInventoryDescription: string;
    highlightLocationsTitle: string;
    highlightLocationsDescription: string;
    highlightSearchTitle: string;
    highlightSearchDescription: string;
    footerDescription: string;
    previewItemOneMeta: string;
    previewItemTwoMeta: string;
    previewItemThreeMeta: string;
  };
  dashboard: {
    title: string;
    greeting: string;
    description: string;
    signedInAs: string;
    items: string;
    activeItemsDescription: string;
    locations: string;
    locationsDescription: string;
    categories: string;
    categoriesDescription: string;
    archived: string;
    archivedDescription: string;
    warehouseStatus: string;
    activePositions: string;
    seeItems: string;
    totalQuantity: string;
    activeQuantityDescription: string;
    uncategorized: string;
    uncategorizedDescription: string;
    quickActions: string;
    manageWarehouse: string;
    scan: string;
    browseItems: string;
    manageLocations: string;
    manageCategories: string;
    recentlyAdded: string;
    latestItems: string;
    allItems: string;
    emptyWarehouse: string;
    addFirstItem: string;
    chooseWarehouse: string;
    chooseWarehouseDescription: string;
    createFirstWarehouse: string;
    createFirstWarehouseDescription: string;
    noWarehouseAccess: string;
    noWarehouseAccessDescription: string;
    createWarehouse: string;
    uncategorizedCategory: string;
  };
  nav: {
    ariaLabel: string;
    dashboard: string;
    items: string;
    locations: string;
    categories: string;
    scanner: string;
  };
  categories: {
    section: string;
    title: string;
    description: string;
    emptyTitle: string;
    emptyCanManage: string;
    emptyReadOnly: string;
    itemCount: string;
    detailKicker: string;
    backToItem: string;
    backToCategories: string;
    noDescription: string;
    itemsTitle: string;
    emptyItems: string;
    create: string;
    modalKicker: string;
    close: string;
    name: string;
    exampleName: string;
    descriptionLabel: string;
    optional: string;
    cancel: string;
    saving: string;
    edit: string;
    delete: string;
    editTitle: string;
    saveChanges: string;
    deleteTitle: string;
    deleteConfirmation: string;
    deleteRestriction: string;
    confirmDelete: string;
  };
  locations: {
    section: string;
    title: string;
    description: string;
    emptyTitle: string;
    emptyCanManage: string;
    emptyReadOnly: string;
    detailKicker: string;
    backToItem: string;
    backToLocations: string;
    noDescription: string;
    parent: string;
    childrenTitle: string;
    noChildren: string;
    itemsTitle: string;
    noItems: string;
    create: string;
    modalKicker: string;
    close: string;
    createTitle: string;
    createDescription: string;
    created: string;
    createAnother: string;
    name: string;
    exampleName: string;
    parentLabel: string;
    optional: string;
    noParent: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    cancel: string;
    saving: string;
    edit: string;
    delete: string;
    editTitle: string;
    saveChanges: string;
    deleteTitle: string;
    deleteConfirmation: string;
    deleteRestriction: string;
    confirmDelete: string;
    itemsCount: string;
    childrenCount: string;
  };
  scanner: {
    section: string;
    title: string;
    description: string;
    backToDashboard: string;
    emptyCamera: string;
    startCamera: string;
    stopCamera: string;
    cameraStarting: string;
    cameraActive: string;
    codeRecognized: string;
    enterBarcode: string;
    barcodeRequired: string;
    barcodePlaceholder: string;
    searching: string;
    open: string;
    barcodeNotFound: string;
    lookupFailed: string;
    connectionFailed: string;
    cameraPreviewMissing: string;
    cameraStartFailed: string;
  };
  userMenu: {
    buttonLabel: string;
    signedIn: string;
    warehouse: string;
    dashboard: string;
    accountSettings: string;
    administrator: string;
    warehouseManagement: string;
    signOut: string;
  };
  warehouseSwitcher: {
    label: string;
    chooseWarehouse: string;
  };
  installPrompt: {
    ariaLabel: string;
    title: string;
    error: string;
    iosInstructions: string;
    instructions: string;
    install: string;
    later: string;
  };
  actions: {
    categories: {
      invalidData: string;
      invalidId: string;
      created: string;
      createFailed: string;
      updated: string;
      updateFailed: string;
      deleted: string;
      deleteFailed: string;
      nameRequired: string;
      notFound: string;
      hasItems: string;
    };
    locations: {
      invalidData: string;
      invalidId: string;
      invalidParent: string;
      created: string;
      createFailed: string;
      updated: string;
      updateFailed: string;
      deleted: string;
      deleteFailed: string;
      nameRequired: string;
      notFound: string;
      parentNotFound: string;
      parentSelf: string;
      cycle: string;
      existingCycle: string;
      hasItemsOrChildren: string;
    };
  };
};

export const organizationMessages = {
  en: {
    home: {
      kicker: "A simpler way to organize your inventory",
      headline: "Know what you have. Know where it is.",
      description:
        "Inventorier helps you track items, organize storage locations, and quickly find what you need.",
      createAccount: "Create an account",
      existingAccount: "I already have an account",
      tip: "Start by organizing one place.",
      previewDashboard: "Dashboard",
      previewWarehouse: "Your warehouse",
      current: "Up to date",
      items: "Items",
      locations: "Locations",
      categories: "Categories",
      toReview: "To review",
      recentlyAdded: "Recently added",
      positions: "items",
      exampleItemOne: "Cordless drill",
      exampleItemTwo: "Storage containers",
      exampleItemThree: "Wrench set",
      previewItemOneMeta: "Workshop · 2 pcs.",
      previewItemTwoMeta: "Shelf A · 16 pcs.",
      previewItemThreeMeta: "Cabinet 2 · 1 pc.",
      highlightKicker: "One place to keep things organized",
      highlightTitle: "Less searching. More control.",
      highlightInventoryTitle: "Know what you have",
      highlightInventoryDescription:
        "Keep a clear inventory of items, quantities, and units.",
      highlightLocationsTitle: "Know where it is",
      highlightLocationsDescription:
        "Organize your warehouse by location and build your own hierarchy.",
      highlightSearchTitle: "Find things quickly",
      highlightSearchDescription:
        "Search by name, filter the list, and scan barcodes.",
      footerDescription: "A simple inventory management system.",
    },
    dashboard: {
      title: "Dashboard",
      greeting: "Welcome, {name}.",
      description: "Your warehouse management hub.",
      signedInAs: "Signed in as",
      items: "Items",
      activeItemsDescription: "Active inventory items",
      locations: "Locations",
      locationsDescription: "Storage locations",
      categories: "Categories",
      categoriesDescription: "Ways to organize items",
      archived: "Archived",
      archivedDescription: "Items outside the active list",
      warehouseStatus: "Warehouse status",
      activePositions:
        "{count, plural, one {# active item} other {# active items}}",
      seeItems: "View items →",
      totalQuantity: "Total quantity ({unit})",
      activeQuantityDescription: "total quantity of active items",
      uncategorized: "Uncategorized",
      uncategorizedDescription: "active items to organize",
      quickActions: "Quick actions",
      manageWarehouse: "Manage warehouse",
      scan: "Scan a barcode",
      browseItems: "Browse items",
      manageLocations: "Manage locations",
      manageCategories: "Manage categories",
      recentlyAdded: "Recently added",
      latestItems: "Latest items",
      allItems: "All items →",
      emptyWarehouse: "This warehouse is still empty.",
      addFirstItem: "Add your first item to see it here.",
      chooseWarehouse: "Choose a warehouse",
      chooseWarehouseDescription:
        "Choose a warehouse from the header to get started.",
      createFirstWarehouse: "Create your first warehouse",
      createFirstWarehouseDescription:
        "This instance has no warehouse yet. Create one to get started.",
      noWarehouseAccess: "No warehouse access",
      noWarehouseAccessDescription:
        "You have not been assigned to a warehouse yet. Ask an administrator or warehouse manager for access.",
      createWarehouse: "Create warehouse",
      uncategorizedCategory: "Uncategorized",
    },
    nav: {
      ariaLabel: "Dashboard navigation",
      dashboard: "Home",
      items: "Items",
      locations: "Locations",
      categories: "Categories",
      scanner: "Scanner",
    },
    categories: {
      section: "Warehouse",
      title: "Categories",
      description: "Organize items by their purpose.",
      emptyTitle: "No categories",
      emptyCanManage: "Add your first category to organize your items.",
      emptyReadOnly: "There are no categories in this warehouse.",
      itemCount: "{count, plural, one {# item} other {# items}}",
      detailKicker: "Category",
      backToItem: "Back to item",
      backToCategories: "Back to categories",
      noDescription: "No description",
      itemsTitle: "Items ({count})",
      emptyItems: "There are no active items in this category.",
      create: "Add category",
      modalKicker: "Categories",
      close: "Close",
      name: "Name",
      exampleName: "e.g. Tools",
      descriptionLabel: "Description",
      optional: "(optional)",
      cancel: "Cancel",
      saving: "Saving...",
      edit: "Edit",
      delete: "Delete",
      editTitle: "Edit category",
      saveChanges: "Save changes",
      deleteTitle: "Delete category",
      deleteConfirmation:
        "Are you sure you want to delete the category {name}?",
      deleteRestriction: "It can only be deleted if it has no assigned items.",
      confirmDelete: "Delete category",
    },
    locations: {
      section: "Warehouse",
      title: "Locations",
      description: "Manage where your items are stored.",
      emptyTitle: "No locations",
      emptyCanManage: "Add your first storage location to get started.",
      emptyReadOnly: "There are no locations in this warehouse.",
      detailKicker: "Location",
      backToItem: "Back to item",
      backToLocations: "Back to locations",
      noDescription: "No description",
      parent: "Parent location: {name}",
      childrenTitle: "Sub-locations",
      noChildren: "There are no sub-locations.",
      itemsTitle: "Items",
      noItems: "There are no items at this location.",
      create: "Add location",
      modalKicker: "Locations",
      close: "Close",
      createTitle: "Add location",
      createDescription: "Create a place to store your items.",
      created: "Location created.",
      createAnother: "Add another location",
      name: "Location name",
      exampleName: "e.g. Warehouse",
      parentLabel: "Parent location",
      optional: "(optional)",
      noParent: "None — top-level location",
      descriptionLabel: "Description",
      descriptionPlaceholder: "A short description of the location",
      cancel: "Cancel",
      saving: "Saving...",
      edit: "Edit",
      delete: "Delete",
      editTitle: "Edit location",
      saveChanges: "Save changes",
      deleteTitle: "Delete location",
      deleteConfirmation:
        "Are you sure you want to delete the location {name}?",
      deleteRestriction:
        "It can only be deleted if it has no sub-locations or items.",
      confirmDelete: "Delete location",
      itemsCount: "{count, plural, one {# item} other {# items}}",
      childrenCount:
        "{count, plural, one {# sub-location} other {# sub-locations}}",
    },
    scanner: {
      section: "Warehouse",
      title: "Scan a barcode",
      description: "Point your camera at a Code 128 barcode or enter it manually.",
      backToDashboard: "Dashboard",
      emptyCamera: "Camera is off",
      startCamera: "Start camera",
      stopCamera: "Stop camera",
      cameraStarting: "Starting camera...",
      cameraActive: "Camera is active — position the barcode inside the frame.",
      codeRecognized: "Code recognized. Opening item...",
      enterBarcode: "Enter barcode manually",
      barcodeRequired: "Enter a barcode.",
      barcodePlaceholder: "e.g. INV-ABC123",
      searching: "Searching...",
      open: "Open",
      barcodeNotFound: "No item was found with this barcode.",
      lookupFailed: "Could not look up the item.",
      connectionFailed: "Could not connect to the server.",
      cameraPreviewMissing: "Camera preview element was not found.",
      cameraStartFailed:
        "Could not start the camera. Check permissions and your HTTPS connection.",
    },
    userMenu: {
      buttonLabel: "User menu: {name}",
      signedIn: "Signed-in user",
      warehouse: "Warehouse",
      dashboard: "Dashboard",
      accountSettings: "Account settings",
      administrator: "Administrator dashboard",
      warehouseManagement: "Warehouse management",
      signOut: "Sign out",
    },
    warehouseSwitcher: {
      label: "Active warehouse",
      chooseWarehouse: "Choose a warehouse",
    },
    installPrompt: {
      ariaLabel: "Install app",
      title: "Install Inventorier",
      error: "Could not start installation. Try again from your browser menu.",
      iosInstructions:
        "To install the app, tap Share, then choose “Add to Home Screen”.",
      instructions: "Add the app to your device for quick access.",
      install: "Install",
      later: "Not now",
    },
    actions: {
      categories: {
        invalidData: "Please enter valid category details.",
        invalidId: "Invalid category ID.",
        created: "Category created.",
        createFailed: "Could not create the category.",
        updated: "Category updated.",
        updateFailed: "Could not update the category.",
        deleted: "Category deleted.",
        deleteFailed: "Could not delete the category.",
        nameRequired: "Category name is required.",
        notFound: "Category was not found.",
        hasItems: "A category with items cannot be deleted.",
      },
      locations: {
        invalidData: "Please enter valid location details.",
        invalidId: "Invalid location ID.",
        invalidParent: "Invalid parent location.",
        created: "Location created.",
        createFailed: "Could not create the location.",
        updated: "Location updated.",
        updateFailed: "Could not update the location.",
        deleted: "Location deleted.",
        deleteFailed: "Could not delete the location.",
        nameRequired: "Location name is required.",
        notFound: "Location was not found.",
        parentNotFound: "Parent location was not found.",
        parentSelf: "A location cannot be its own parent.",
        cycle: "This change would create a location cycle.",
        existingCycle: "The location hierarchy already contains a cycle.",
        hasItemsOrChildren:
          "A location with items or sub-locations cannot be deleted.",
      },
    },
  },
  pl: {
    home: {
      kicker: "Prostszy porządek w magazynie",
      headline: "Wiesz, co masz. Wiesz, gdzie to jest.",
      description:
        "Inventorier pomaga ewidencjonować przedmioty, porządkować lokalizacje i szybko odnajdywać potrzebne rzeczy.",
      createAccount: "Utwórz konto",
      existingAccount: "Mam już konto",
      tip: "Zacznij od uporządkowania jednego miejsca.",
      previewDashboard: "Panel główny",
      previewWarehouse: "Twój magazyn",
      current: "Aktualny",
      items: "Przedmioty",
      locations: "Lokalizacje",
      categories: "Kategorie",
      toReview: "Do sprawdzenia",
      recentlyAdded: "Ostatnio dodane",
      positions: "pozycje",
      exampleItemOne: "Wiertarka akumulatorowa",
      exampleItemTwo: "Pojemniki magazynowe",
      exampleItemThree: "Zestaw kluczy",
      previewItemOneMeta: "Warsztat · 2 szt.",
      previewItemTwoMeta: "Regał A · 16 szt.",
      previewItemThreeMeta: "Szafka 2 · 1 szt.",
      highlightKicker: "Jedno miejsce na cały porządek",
      highlightTitle: "Mniej szukania. Więcej kontroli.",
      highlightInventoryTitle: "Wiesz, co masz",
      highlightInventoryDescription:
        "Prowadź przejrzystą ewidencję przedmiotów, ilości i jednostek.",
      highlightLocationsTitle: "Wiesz, gdzie to jest",
      highlightLocationsDescription:
        "Organizuj magazyn według lokalizacji i buduj własną hierarchię miejsc.",
      highlightSearchTitle: "Szybko znajdujesz",
      highlightSearchDescription:
        "Wyszukuj po nazwie, filtruj listę i korzystaj ze skanowania kodów.",
      footerDescription: "Prosty system ewidencji przedmiotów.",
    },
    dashboard: {
      title: "Panel główny",
      greeting: "Witaj, {name}.",
      description: "To jest centrum zarządzania Twoim magazynem.",
      signedInAs: "Zalogowano jako",
      items: "Przedmioty",
      activeItemsDescription: "Aktywne pozycje w ewidencji",
      locations: "Lokalizacje",
      locationsDescription: "Miejsca przechowywania",
      categories: "Kategorie",
      categoriesDescription: "Sposoby porządkowania",
      archived: "Zarchiwizowane",
      archivedDescription: "Przedmioty poza aktywną listą",
      warehouseStatus: "Stan magazynu",
      activePositions:
        "{count, plural, one {# aktywna pozycja} few {# aktywne pozycje} many {# aktywnych pozycji} other {# aktywnej pozycji}}",
      seeItems: "Zobacz przedmioty →",
      totalQuantity: "Łączna ilość ({unit})",
      activeQuantityDescription: "suma ilości aktywnych przedmiotów",
      uncategorized: "Bez kategorii",
      uncategorizedDescription: "aktywnych przedmiotów do uporządkowania",
      quickActions: "Szybkie akcje",
      manageWarehouse: "Zarządzaj magazynem",
      scan: "Skanuj kod aparatem",
      browseItems: "Przeglądaj przedmioty",
      manageLocations: "Zarządzaj lokalizacjami",
      manageCategories: "Zarządzaj kategoriami",
      recentlyAdded: "Ostatnio dodane",
      latestItems: "Najnowsze przedmioty",
      allItems: "Wszystkie →",
      emptyWarehouse: "Magazyn jest jeszcze pusty.",
      addFirstItem: "Dodaj pierwszy przedmiot, aby zobaczyć go tutaj.",
      chooseWarehouse: "Wybierz magazyn",
      chooseWarehouseDescription:
        "Wybierz magazyn z listy w nagłówku, aby rozpocząć pracę.",
      createFirstWarehouse: "Utwórz pierwszy magazyn",
      createFirstWarehouseDescription:
        "Ta instancja nie ma jeszcze magazynu. Utwórz pierwszy, aby rozpocząć pracę.",
      noWarehouseAccess: "Brak dostępu do magazynu",
      noWarehouseAccessDescription:
        "Nie przypisano Cię jeszcze do żadnego magazynu. Poproś administratora lub menedżera magazynu o dostęp.",
      createWarehouse: "Utwórz magazyn",
      uncategorizedCategory: "Bez kategorii",
    },
    nav: {
      ariaLabel: "Nawigacja panelu",
      dashboard: "Panel",
      items: "Przedmioty",
      locations: "Lokalizacje",
      categories: "Kategorie",
      scanner: "Skaner",
    },
    categories: {
      section: "Magazyn",
      title: "Kategorie",
      description: "Porządkuj przedmioty według ich przeznaczenia.",
      emptyTitle: "Brak kategorii",
      emptyCanManage: "Dodaj pierwszą kategorię, aby uporządkować przedmioty.",
      emptyReadOnly: "W tym magazynie nie ma kategorii.",
      itemCount: "{count, plural, one {# przedmiot} few {# przedmioty} many {# przedmiotów} other {# przedmiotu}}",
      detailKicker: "Kategoria",
      backToItem: "Wróć do przedmiotu",
      backToCategories: "Wróć do kategorii",
      noDescription: "Brak opisu",
      itemsTitle: "Przedmioty ({count})",
      emptyItems: "Brak aktywnych przedmiotów w tej kategorii.",
      create: "Dodaj kategorię",
      modalKicker: "Kategorie",
      close: "Zamknij",
      name: "Nazwa",
      exampleName: "np. Narzędzia",
      descriptionLabel: "Opis",
      optional: "(opcjonalnie)",
      cancel: "Anuluj",
      saving: "Zapisywanie...",
      edit: "Edytuj",
      delete: "Usuń",
      editTitle: "Edytuj kategorię",
      saveChanges: "Zapisz zmiany",
      deleteTitle: "Usuń kategorię",
      deleteConfirmation:
        "Czy na pewno chcesz usunąć kategorię {name}?",
      deleteRestriction:
        "Usunięcie jest możliwe tylko wtedy, gdy nie ma przypisanych przedmiotów.",
      confirmDelete: "Usuń kategorię",
    },
    locations: {
      section: "Magazyn",
      title: "Lokalizacje",
      description: "Zarządzaj miejscami przechowywania swoich przedmiotów.",
      emptyTitle: "Brak lokalizacji",
      emptyCanManage:
        "Dodaj pierwsze miejsce przechowywania, aby rozpocząć.",
      emptyReadOnly: "W tym magazynie nie ma lokalizacji.",
      detailKicker: "Lokalizacja",
      backToItem: "Wróć do przedmiotu",
      backToLocations: "Wróć do lokalizacji",
      noDescription: "Brak opisu",
      parent: "Lokalizacja nadrzędna: {name}",
      childrenTitle: "Podlokalizacje",
      noChildren: "Brak podlokalizacji.",
      itemsTitle: "Przedmioty",
      noItems: "Brak przedmiotów w tej lokalizacji.",
      create: "Dodaj lokalizację",
      modalKicker: "Lokalizacje",
      close: "Zamknij",
      createTitle: "Dodaj lokalizację",
      createDescription:
        "Utwórz miejsce, w którym przechowujesz swoje przedmioty.",
      created: "Lokalizacja została utworzona.",
      createAnother: "Dodaj kolejną lokalizację",
      name: "Nazwa lokalizacji",
      exampleName: "np. Magazyn",
      parentLabel: "Lokalizacja nadrzędna",
      optional: "(opcjonalnie)",
      noParent: "Brak — lokalizacja główna",
      descriptionLabel: "Opis",
      descriptionPlaceholder: "Krótki opis lokalizacji",
      cancel: "Anuluj",
      saving: "Zapisywanie...",
      edit: "Edytuj",
      delete: "Usuń",
      editTitle: "Edytuj lokalizację",
      saveChanges: "Zapisz zmiany",
      deleteTitle: "Usuń lokalizację",
      deleteConfirmation: "Czy na pewno chcesz usunąć lokalizację {name}?",
      deleteRestriction:
        "Operacja jest możliwa tylko wtedy, gdy nie ma ona dzieci ani przedmiotów.",
      confirmDelete: "Usuń lokalizację",
      itemsCount: "{count, plural, one {# przedmiot} few {# przedmioty} many {# przedmiotów} other {# przedmiotu}}",
      childrenCount:
        "{count, plural, one {# podlokalizacja} few {# podlokalizacje} many {# podlokalizacji} other {# podlokalizacji}}",
    },
    scanner: {
      section: "Magazyn",
      title: "Skanuj kod",
      description: "Skieruj aparat na kod Code 128 albo wpisz go ręcznie.",
      backToDashboard: "Panel główny",
      emptyCamera: "Kamera jest wyłączona",
      startCamera: "Uruchom kamerę",
      stopCamera: "Zatrzymaj kamerę",
      cameraStarting: "Uruchamianie kamery...",
      cameraActive: "Kamera aktywna — ustaw kod w ramce.",
      codeRecognized: "Kod rozpoznany. Otwieranie przedmiotu...",
      enterBarcode: "Wpisz kod ręcznie",
      barcodeRequired: "Wpisz kod kreskowy.",
      barcodePlaceholder: "np. INV-ABC123",
      searching: "Szukam...",
      open: "Otwórz",
      barcodeNotFound: "Nie znaleziono przedmiotu o tym kodzie.",
      lookupFailed: "Nie udało się wyszukać przedmiotu.",
      connectionFailed: "Nie udało się połączyć z serwerem.",
      cameraPreviewMissing: "Nie znaleziono elementu podglądu kamery.",
      cameraStartFailed:
        "Nie udało się uruchomić kamery. Sprawdź uprawnienia i połączenie HTTPS.",
    },
    userMenu: {
      buttonLabel: "Menu użytkownika: {name}",
      signedIn: "Zalogowany użytkownik",
      warehouse: "Magazyn",
      dashboard: "Panel główny",
      accountSettings: "Ustawienia konta",
      administrator: "Panel administratora",
      warehouseManagement: "Zarządzanie magazynami",
      signOut: "Wyloguj się",
    },
    warehouseSwitcher: {
      label: "Aktywny magazyn",
      chooseWarehouse: "Wybierz magazyn",
    },
    installPrompt: {
      ariaLabel: "Instalacja aplikacji",
      title: "Zainstaluj Inventorier",
      error:
        "Nie udało się uruchomić instalacji. Spróbuj ponownie z menu przeglądarki.",
      iosInstructions:
        "Aby zainstalować aplikację, użyj przycisku Udostępnij, a następnie wybierz „Dodaj do ekranu początkowego”.",
      instructions: "Dodaj aplikację do urządzenia, aby mieć do niej szybki dostęp.",
      install: "Zainstaluj",
      later: "Nie teraz",
    },
    actions: {
      categories: {
        invalidData: "Nieprawidłowe dane kategorii.",
        invalidId: "Nieprawidłowe ID kategorii.",
        created: "Kategoria została utworzona.",
        createFailed: "Nie udało się utworzyć kategorii.",
        updated: "Kategoria została zaktualizowana.",
        updateFailed: "Nie udało się zaktualizować kategorii.",
        deleted: "Kategoria została usunięta.",
        deleteFailed: "Nie udało się usunąć kategorii.",
        nameRequired: "Nazwa kategorii jest wymagana.",
        notFound: "Nie znaleziono kategorii.",
        hasItems: "Nie można usunąć kategorii, do której przypisano przedmioty.",
      },
      locations: {
        invalidData: "Nieprawidłowe dane lokalizacji.",
        invalidId: "Nieprawidłowe ID lokalizacji.",
        invalidParent: "Nieprawidłowa lokalizacja nadrzędna.",
        created: "Lokalizacja została utworzona.",
        createFailed: "Nie udało się utworzyć lokalizacji.",
        updated: "Lokalizacja została zaktualizowana.",
        updateFailed: "Nie udało się zaktualizować lokalizacji.",
        deleted: "Lokalizacja została usunięta.",
        deleteFailed: "Nie udało się usunąć lokalizacji.",
        nameRequired: "Nazwa lokalizacji jest wymagana.",
        notFound: "Nie znaleziono lokalizacji.",
        parentNotFound: "Nie znaleziono lokalizacji nadrzędnej.",
        parentSelf: "Lokalizacja nie może być własną lokalizacją nadrzędną.",
        cycle: "Ta zmiana spowodowałaby utworzenie cyklu lokalizacji.",
        existingCycle: "W hierarchii lokalizacji istnieje już cykl.",
        hasItemsOrChildren:
          "Nie można usunąć lokalizacji, która zawiera przedmioty lub podlokalizacje.",
      },
    },
  },
} satisfies Record<Locale, OrganizationMessages>;
