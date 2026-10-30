"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Theme = "light" | "dark" | "system";

const themeOrder: Theme[] = ["system", "light", "dark"];
const themeDetails: Record<Theme, { path: string }> = {
  light: {
    path: "M12 3v2m0 14v2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M3 12h2m14 0h2M5.64 18.36l1.42-1.42m9.88-9.88 1.42-1.42M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  },
  dark: {
    path: "M20.7 15.3A8.5 8.5 0 0 1 8.7 3.3 8.5 8.5 0 1 0 20.7 15.3",
  },
  system: {
    path: "M4 5h16v11H4zM2 19h20M9 16v3m6-3v3",
  },
};

export function ThemeToggle() {
  const t = useTranslations("common.theme");
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const stored = window.localStorage.getItem("inventory-theme");
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
  });

  useEffect(() => {
    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const update = () => {
        document.documentElement.classList.toggle("dark", media.matches);
      };
      update();
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function changeTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    window.localStorage.setItem("inventory-theme", nextTheme);
  }

  function cycleTheme() {
    const currentIndex = themeOrder.indexOf(theme);
    const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length];
    changeTheme(nextTheme);
  }

  const currentTheme = themeDetails[theme];
  const themeLabel = t(theme);

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="theme-control"
      aria-label={t("ariaLabel", { theme: themeLabel })}
      title={t("title", { theme: themeLabel })}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={currentTheme.path} />
      </svg>
    </button>
  );
}
