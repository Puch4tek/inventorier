"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
}

function subscribeToDisplayMode(callback: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", callback);
  window.addEventListener("appinstalled", callback);
  return () => {
    displayMode.removeEventListener("change", callback);
    window.removeEventListener("appinstalled", callback);
  };
}

function isIOSBrowser() {
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true);
  return isIOS && !standalone;
}

function serverSnapshot() {
  return false;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);
  const showIOSInstructions = useSyncExternalStore(
    subscribeToDisplayMode,
    isIOSBrowser,
    serverSnapshot,
  );

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      setInstallEvent(null);
      setDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function install() {
    if (!installEvent) return;
    setInstallEvent(null);
    try {
      await installEvent.prompt();
      setDismissed(true);
    } catch {
      setError(true);
    }
  }

  if (dismissed || (!installEvent && !showIOSInstructions && !error)) {
    return null;
  }

  return (
    <aside
      aria-label="Instalacja aplikacji"
      className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-app-border bg-app-surface p-4 shadow-modal sm:bottom-4 sm:left-auto sm:right-4"
    >
      <p className="font-semibold">Zainstaluj Inventorier</p>
      <p className="mt-1 text-sm text-app-muted">
        {error
          ? "Nie udało się uruchomić instalacji. Spróbuj ponownie z menu przeglądarki."
          : showIOSInstructions
            ? "Aby zainstalować aplikację, użyj przycisku Udostępnij, a następnie wybierz „Dodaj do ekranu początkowego”."
            : "Dodaj aplikację do urządzenia, aby mieć do niej szybki dostęp."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {installEvent && !error && (
          <Button type="button" className="px-4 py-2 text-sm" onClick={install}>
            Zainstaluj
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          className="px-4 py-2 text-sm"
          onClick={() => setDismissed(true)}
        >
          Nie teraz
        </Button>
      </div>
    </aside>
  );
}
