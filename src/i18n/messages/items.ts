import type { Locale } from "../locale";

type ItemMessages = {
  list: {
    section: string;
    title: string;
    activeDescription: string;
    archivedDescription: string;
    emptyTitle: string;
    emptyManage: string;
    emptyReadOnly: string;
    noCategory: string;
  };
  detail: {
    section: string;
    backToLocation: string;
    backToItems: string;
    archived: string;
    missingDescription: string;
    information: string;
    quantity: string;
    barcode: string;
    lastChanged: string;
    description: string;
    location: string;
    goToLocation: string;
    category: string;
    goToCategory: string;
    history: string;
    noHistory: string;
    noValue: string;
  };
  filters: {
    summary: string;
    searchLabel: string;
    searchPlaceholder: string;
    locationLabel: string;
    allLocations: string;
    categoryLabel: string;
    allCategories: string;
    noCategory: string;
    sortLabel: string;
    nameAsc: string;
    nameDesc: string;
    quantityAsc: string;
    quantityDesc: string;
    recentlyUpdated: string;
    leastRecentlyUpdated: string;
    archiveState: string;
    active: string;
    archived: string;
    search: string;
    clear: string;
  };
  create: {
    open: string;
    title: string;
    close: string;
    name: string;
    description: string;
    optional: string;
    namePlaceholder: string;
    quantity: string;
    unit: string;
    unitPlaceholder: string;
    location: string;
    chooseLocation: string;
    category: string;
    noCategory: string;
    cancel: string;
    saving: string;
    submit: string;
  };
  edit: {
    open: string;
    title: string;
    name: string;
    description: string;
    unit: string;
    location: string;
    category: string;
    noCategory: string;
    cancel: string;
    saving: string;
    save: string;
    close: string;
  };
  archive: {
    open: string;
    title: string;
    confirmation: string;
    confirmationEnd: string;
    cancel: string;
    inProgress: string;
    submit: string;
  };
  restore: {
    open: string;
    title: string;
    confirmation: string;
    confirmationEnd: string;
    cancel: string;
    inProgress: string;
    submit: string;
  };
  quantityControl: {
    title: string;
    instructions: string;
    newQuantity: string;
    decrease: string;
    increase: string;
    set: string;
  };
  barcode: {
    imageAlt: string;
    downloadSvg: string;
    downloadPng: string;
    copyTitle: string;
    copied: string;
    copyFailed: string;
  };
  actions: {
    createSuccess: string;
    createFailure: string;
    updateSuccess: string;
    updateFailure: string;
    archiveSuccess: string;
    archiveFailure: string;
    restoreSuccess: string;
    restoreFailure: string;
    quantitySuccess: string;
    quantityFailure: string;
  };
  errors: {
    invalidInput: string;
    invalidCreateNumbers: string;
    invalidId: string;
    invalidNumber: string;
    invalidQuantity: string;
    nameRequired: string;
    quantityPositive: string;
    descriptionMustBeText: string;
    unitRequired: string;
    locationIdInvalid: string;
    categoryIdInvalid: string;
    locationNotFound: string;
    categoryNotFound: string;
    barcodeGenerationFailed: string;
    barcodeRetriesFailed: string;
    itemNotFound: string;
    itemArchived: string;
    itemAlreadyArchived: string;
    itemAlreadyActive: string;
    locationIdRequired: string;
    categoryIdRequired: string;
    quantityNegative: string;
    deltaMustBeInteger: string;
    quantityMustBeNonnegativeInteger: string;
    invalidItemId: string;
    operationFailed: string;
  };
  history: {
    created: string;
    nameChanged: string;
    descriptionChanged: string;
    unitChanged: string;
    categoryChanged: string;
    locationChanged: string;
    quantityChanged: string;
    archived: string;
    restored: string;
    types: {
      itemCreated: string;
      itemUpdated: string;
      quantityChanged: string;
      locationChanged: string;
      itemArchived: string;
      itemRestored: string;
    };
  };
  api: {
    unauthorized: string;
    barcodeRequired: string;
    noActiveWarehouse: string;
    itemNotFound: string;
    invalidItemId: string;
    unsupportedBarcodeFormat: string;
    barcodeGenerationFailed: string;
  };
};

export const itemMessages = {
  en: {
    list: {
      section: "Warehouse",
      title: "Items",
      activeDescription: "Browse all active items.",
      archivedDescription: "Browse archived items.",
      emptyTitle: "No items",
      emptyManage: "Add the first item to see it here.",
      emptyReadOnly: "There are no items in this warehouse.",
      noCategory: "Uncategorized",
    },
    detail: {
      section: "Item",
      backToLocation: "Back to location",
      backToItems: "Back to items",
      archived: "Archived item",
      missingDescription: "No description",
      information: "Information",
      quantity: "Quantity",
      barcode: "Barcode",
      lastChanged: "Last updated",
      description: "Description",
      location: "Location",
      goToLocation: "Go to location page",
      category: "Category",
      goToCategory: "Go to category page",
      history: "Change history",
      noHistory: "No change history.",
      noValue: "none",
    },
    filters: {
      summary: "Filters and search",
      searchLabel: "Search items",
      searchPlaceholder: "Search items...",
      locationLabel: "Filter by location",
      allLocations: "All locations",
      categoryLabel: "Filter by category",
      allCategories: "All categories",
      noCategory: "Uncategorized",
      sortLabel: "Sort",
      nameAsc: "Name A–Z",
      nameDesc: "Name Z–A",
      quantityAsc: "Quantity ascending",
      quantityDesc: "Quantity descending",
      recentlyUpdated: "Recently updated",
      leastRecentlyUpdated: "Least recently updated",
      archiveState: "Archive status",
      active: "Active",
      archived: "Archived",
      search: "Search",
      clear: "Clear",
    },
    create: {
      open: "Add item",
      title: "Add item",
      close: "Close",
      name: "Name",
      description: "Description",
      optional: "(optional)",
      namePlaceholder: "e.g. Drill",
      quantity: "Quantity",
      unit: "Unit",
      unitPlaceholder: "e.g. pcs",
      location: "Location",
      chooseLocation: "Choose a location",
      category: "Category",
      noCategory: "Uncategorized",
      cancel: "Cancel",
      saving: "Saving...",
      submit: "Add item",
    },
    edit: {
      open: "Edit",
      title: "Edit item",
      name: "Name",
      description: "Description",
      unit: "Unit",
      location: "Location",
      category: "Category",
      noCategory: "Uncategorized",
      cancel: "Cancel",
      saving: "Saving...",
      save: "Save changes",
      close: "Close",
    },
    archive: {
      open: "Archive",
      title: "Archive item",
      confirmation: "Are you sure you want to archive",
      confirmationEnd:
        "It will disappear from the active item list, but its history will be kept.",
      cancel: "Cancel",
      inProgress: "Archiving...",
      submit: "Archive",
    },
    restore: {
      open: "Restore",
      title: "Restore item",
      confirmation: "Are you sure you want to restore",
      confirmationEnd: "It will appear in the active list again.",
      cancel: "Cancel",
      inProgress: "Restoring...",
      submit: "Restore",
    },
    quantityControl: {
      title: "Quantity",
      instructions:
        "Use the buttons while working in the field, or enter a new quantity.",
      newQuantity: "New quantity",
      decrease: "Decrease quantity by one",
      increase: "Increase quantity by one",
      set: "Set",
    },
    barcode: {
      imageAlt: "Item barcode",
      downloadSvg: "Download SVG",
      downloadPng: "Download PNG",
      copyTitle: "Copy barcode",
      copied: "Copied",
      copyFailed: "Could not copy",
    },
    actions: {
      createSuccess: "Item created.",
      createFailure: "Could not create the item.",
      updateSuccess: "Item updated.",
      updateFailure: "Could not update the item.",
      archiveSuccess: "Item archived.",
      archiveFailure: "Could not archive the item.",
      restoreSuccess: "Item restored.",
      restoreFailure: "Could not restore the item.",
      quantitySuccess: "Quantity changed.",
      quantityFailure: "Could not change the quantity.",
    },
    errors: {
      invalidInput: "Invalid input data.",
      invalidCreateNumbers: "Quantity, location, or category has an invalid value.",
      invalidId: "Invalid item ID.",
      invalidNumber: "Invalid number or ID.",
      invalidQuantity: "Invalid quantity.",
      nameRequired: "A name is required.",
      quantityPositive: "Quantity must be a non-negative integer.",
      descriptionMustBeText: "Description must be text.",
      unitRequired: "A unit is required.",
      locationIdInvalid: "Location ID must be a positive number.",
      categoryIdInvalid: "Category ID must be a positive number.",
      locationNotFound: "Location not found.",
      categoryNotFound: "Category not found.",
      barcodeGenerationFailed: "Could not generate a barcode.",
      barcodeRetriesFailed: "Could not generate a unique barcode after 10 attempts.",
      itemNotFound: "Item not found.",
      itemArchived: "Archived items cannot be edited.",
      itemAlreadyArchived: "Item is already archived.",
      itemAlreadyActive: "Item is already active.",
      locationIdRequired: "A valid location ID is required.",
      categoryIdRequired: "A valid category ID is required.",
      quantityNegative: "Quantity cannot be less than zero.",
      deltaMustBeInteger: "Quantity change must be an integer.",
      quantityMustBeNonnegativeInteger:
        "Quantity must be a non-negative integer.",
      invalidItemId: "A valid item ID is required.",
      operationFailed: "The operation could not be completed.",
    },
    history: {
      created: "Item created",
      nameChanged: "Name changed",
      descriptionChanged: "Description changed",
      unitChanged: "Unit changed",
      categoryChanged: "Category changed",
      locationChanged: "Location changed",
      quantityChanged: "Quantity changed",
      archived: "Item archived",
      restored: "Item restored",
      types: {
        itemCreated: "Item created",
        itemUpdated: "Item updated",
        quantityChanged: "Quantity changed",
        locationChanged: "Location changed",
        itemArchived: "Item archived",
        itemRestored: "Item restored",
      },
    },
    api: {
      unauthorized: "Unauthorized",
      barcodeRequired: "Barcode is required.",
      noActiveWarehouse: "No active warehouse.",
      itemNotFound: "Item not found.",
      invalidItemId: "Invalid item ID.",
      unsupportedBarcodeFormat: "Unsupported barcode format.",
      barcodeGenerationFailed: "Could not generate the barcode.",
    },
  },
  pl: {
    list: {
      section: "Magazyn",
      title: "Przedmioty",
      activeDescription: "Przeglądaj wszystkie aktywne przedmioty.",
      archivedDescription: "Przeglądaj przedmioty znajdujące się w archiwum.",
      emptyTitle: "Brak przedmiotów",
      emptyManage: "Dodaj pierwszy przedmiot, aby pojawił się na liście.",
      emptyReadOnly: "W tym magazynie nie ma przedmiotów.",
      noCategory: "Bez kategorii",
    },
    detail: {
      section: "Przedmiot",
      backToLocation: "Wróć do lokalizacji",
      backToItems: "Wróć do przedmiotów",
      archived: "Przedmiot zarchiwizowany",
      missingDescription: "Brak opisu",
      information: "Informacje",
      quantity: "Ilość",
      barcode: "Kod kreskowy",
      lastChanged: "Ostatnia zmiana",
      description: "Opis",
      location: "Lokalizacja",
      goToLocation: "Przejdź do strony lokalizacji",
      category: "Kategoria",
      goToCategory: "Przejdź do strony kategorii",
      history: "Historia zmian",
      noHistory: "Brak historii zmian.",
      noValue: "brak",
    },
    filters: {
      summary: "Filtry i wyszukiwanie",
      searchLabel: "Szukaj przedmiotu",
      searchPlaceholder: "Szukaj przedmiotu...",
      locationLabel: "Filtruj według lokalizacji",
      allLocations: "Wszystkie lokalizacje",
      categoryLabel: "Filtruj według kategorii",
      allCategories: "Wszystkie kategorie",
      noCategory: "Bez kategorii",
      sortLabel: "Sortowanie",
      nameAsc: "Nazwa A-Z",
      nameDesc: "Nazwa Z-A",
      quantityAsc: "Ilość rosnąco",
      quantityDesc: "Ilość malejąco",
      recentlyUpdated: "Ostatnio zmienione",
      leastRecentlyUpdated: "Najdawniej zmienione",
      archiveState: "Stan archiwizacji",
      active: "Aktywne",
      archived: "Zarchiwizowane",
      search: "Szukaj",
      clear: "Wyczyść",
    },
    create: {
      open: "Dodaj przedmiot",
      title: "Dodaj przedmiot",
      close: "Zamknij",
      name: "Nazwa",
      description: "Opis",
      optional: "(opcjonalnie)",
      namePlaceholder: "np. Wiertarka",
      quantity: "Ilość",
      unit: "Jednostka",
      unitPlaceholder: "np. szt.",
      location: "Lokalizacja",
      chooseLocation: "Wybierz lokalizację",
      category: "Kategoria",
      noCategory: "Bez kategorii",
      cancel: "Anuluj",
      saving: "Zapisywanie...",
      submit: "Dodaj przedmiot",
    },
    edit: {
      open: "Edytuj",
      title: "Edytuj przedmiot",
      name: "Nazwa",
      description: "Opis",
      unit: "Jednostka",
      location: "Lokalizacja",
      category: "Kategoria",
      noCategory: "Bez kategorii",
      cancel: "Anuluj",
      saving: "Zapisywanie...",
      save: "Zapisz zmiany",
      close: "Zamknij",
    },
    archive: {
      open: "Archiwizuj",
      title: "Archiwizuj przedmiot",
      confirmation: "Czy na pewno chcesz zarchiwizować przedmiot",
      confirmationEnd:
        "Zniknie z aktywnej listy przedmiotów, ale historia zostanie zachowana.",
      cancel: "Anuluj",
      inProgress: "Archiwizowanie...",
      submit: "Archiwizuj",
    },
    restore: {
      open: "Przywróć",
      title: "Przywróć przedmiot",
      confirmation: "Czy na pewno chcesz przywrócić przedmiot",
      confirmationEnd: "Pojawi się ponownie na aktywnej liście.",
      cancel: "Anuluj",
      inProgress: "Przywracanie...",
      submit: "Przywróć",
    },
    quantityControl: {
      title: "Ilość",
      instructions:
        "Użyj przycisków podczas pracy w terenie albo wpisz nową ilość.",
      newQuantity: "Nowa ilość",
      decrease: "Zmniejsz ilość o jeden",
      increase: "Zwiększ ilość o jeden",
      set: "Ustaw",
    },
    barcode: {
      imageAlt: "Kod kreskowy przedmiotu",
      downloadSvg: "Pobierz SVG",
      downloadPng: "Pobierz PNG",
      copyTitle: "Kopiuj kod kreskowy",
      copied: "Skopiowano",
      copyFailed: "Nie udało się skopiować",
    },
    actions: {
      createSuccess: "Przedmiot został utworzony.",
      createFailure: "Nie udało się utworzyć przedmiotu.",
      updateSuccess: "Przedmiot został zaktualizowany.",
      updateFailure: "Nie udało się zaktualizować przedmiotu.",
      archiveSuccess: "Przedmiot został zarchiwizowany.",
      archiveFailure: "Nie udało się zarchiwizować przedmiotu.",
      restoreSuccess: "Przedmiot został przywrócony.",
      restoreFailure: "Nie udało się przywrócić przedmiotu.",
      quantitySuccess: "Ilość została zmieniona.",
      quantityFailure: "Nie udało się zmienić ilości.",
    },
    errors: {
      invalidInput: "Nieprawidłowe dane wejściowe.",
      invalidCreateNumbers: "Ilość, lokalizacja lub kategoria ma nieprawidłową wartość.",
      invalidId: "Nieprawidłowe ID przedmiotu.",
      invalidNumber: "Nieprawidłowa wartość liczby lub identyfikatora.",
      invalidQuantity: "Nieprawidłowa ilość.",
      nameRequired: "Nazwa jest wymagana.",
      quantityPositive: "Ilość musi być nieujemną liczbą całkowitą.",
      descriptionMustBeText: "Opis musi być tekstem.",
      unitRequired: "Jednostka jest wymagana.",
      locationIdInvalid: "ID lokalizacji musi być liczbą dodatnią.",
      categoryIdInvalid: "ID kategorii musi być liczbą dodatnią.",
      locationNotFound: "Lokalizacja nie istnieje.",
      categoryNotFound: "Kategoria nie istnieje.",
      barcodeGenerationFailed: "Nie udało się wygenerować kodu kreskowego.",
      barcodeRetriesFailed:
        "Nie udało się wygenerować unikalnego kodu kreskowego po 10 próbach.",
      itemNotFound: "Przedmiot nie istnieje.",
      itemArchived: "Nie można edytować zarchiwizowanego przedmiotu.",
      itemAlreadyArchived: "Przedmiot jest już zarchiwizowany.",
      itemAlreadyActive: "Przedmiot jest już aktywny.",
      locationIdRequired: "Prawidłowe ID lokalizacji jest wymagane.",
      categoryIdRequired: "Prawidłowe ID kategorii jest wymagane.",
      quantityNegative: "Ilość nie może być mniejsza niż zero.",
      deltaMustBeInteger: "Zmiana ilości musi być liczbą całkowitą.",
      quantityMustBeNonnegativeInteger:
        "Ilość musi być nieujemną liczbą całkowitą.",
      invalidItemId: "Prawidłowe ID przedmiotu jest wymagane.",
      operationFailed: "Nie udało się wykonać tej czynności.",
    },
    history: {
      created: "Utworzono przedmiot",
      nameChanged: "Zmieniono nazwę",
      descriptionChanged: "Zmieniono opis",
      unitChanged: "Zmieniono jednostkę",
      categoryChanged: "Zmieniono kategorię",
      locationChanged: "Zmieniono lokalizację",
      quantityChanged: "Zmieniono ilość",
      archived: "Zarchiwizowano przedmiot",
      restored: "Przywrócono przedmiot z archiwum",
      types: {
        itemCreated: "Utworzono przedmiot",
        itemUpdated: "Zaktualizowano przedmiot",
        quantityChanged: "Zmieniono ilość",
        locationChanged: "Zmieniono lokalizację",
        itemArchived: "Zarchiwizowano przedmiot",
        itemRestored: "Przywrócono przedmiot z archiwum",
      },
    },
    api: {
      unauthorized: "Brak autoryzacji",
      barcodeRequired: "Kod kreskowy jest wymagany.",
      noActiveWarehouse: "Brak aktywnego magazynu.",
      itemNotFound: "Przedmiot nie istnieje.",
      invalidItemId: "Nieprawidłowe ID przedmiotu.",
      unsupportedBarcodeFormat: "Nieobsługiwany format kodu kreskowego.",
      barcodeGenerationFailed: "Nie udało się wygenerować kodu kreskowego.",
    },
  },
} satisfies Record<Locale, ItemMessages>;
