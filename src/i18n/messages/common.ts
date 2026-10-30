import type { Locale } from "../locale";

type CommonMessages = {
  header: {
    dashboard: string;
    signIn: string;
  };
  language: {
    label: string;
  };
  theme: {
    ariaLabel: string;
    title: string;
    light: string;
    dark: string;
    system: string;
  };
  metadata: {
    title: string;
    description: string;
  };
};

export const commonMessages = {
  en: {
    header: {
      dashboard: "Dashboard",
      signIn: "Sign in",
    },
    language: {
      label: "Language",
    },
    theme: {
      ariaLabel: "Theme: {theme}. Click to change.",
      title: "{theme} theme",
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    metadata: {
      title: "Inventorier",
      description: "Inventory and item location management system.",
    },
  },
  pl: {
    header: {
      dashboard: "Panel główny",
      signIn: "Zaloguj się",
    },
    language: {
      label: "Język",
    },
    theme: {
      ariaLabel: "Motyw: {theme}. Kliknij, aby zmienić.",
      title: "Motyw: {theme}",
      light: "Jasny",
      dark: "Ciemny",
      system: "Systemowy",
    },
    metadata: {
      title: "Inventorier",
      description: "System ewidencji i lokalizacji przedmiotów.",
    },
  },
} satisfies Record<Locale, CommonMessages>;
