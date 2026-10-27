"use client";

import { Button } from "@/components/button";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function Scanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [error, setError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const hasResultRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  async function lookupBarcode(barcode: string) {
    const normalizedBarcode = barcode.trim();
    if (!normalizedBarcode) {
      setError("Wpisz kod kreskowy.");
      return;
    }

    setIsLookingUp(true);
    setError("");
    try {
      const response = await fetch(
        `/api/items/by-barcode?barcode=${encodeURIComponent(normalizedBarcode)}`,
      );
      if (!response.ok) {
        setError(
          response.status === 404
            ? "Nie znaleziono przedmiotu o tym kodzie."
            : "Nie udało się wyszukać przedmiotu.",
        );
        return;
      }

      const item = (await response.json()) as { id: number };
      router.push(`/items/${item.id}`);
    } catch {
      setError("Nie udało się połączyć z serwerem.");
    } finally {
      setIsLookingUp(false);
    }
  }

  async function startCamera() {
    setError("");
    setScanStatus("Uruchamianie kamery...");
    hasResultRef.current = false;
    setIsScanning(true);

    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 100,
        delayBetweenScanSuccess: 100,
      });
      const video = videoRef.current;
      if (!video) {
        throw new Error("NO_CAMERA");
      }

      controlsRef.current = await reader.decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        video,
        (result) => {
          if (result && !hasResultRef.current) {
            hasResultRef.current = true;
            controlsRef.current?.stop();
            setIsScanning(false);
            setScanStatus("Kod rozpoznany. Otwieranie przedmiotu...");
            void lookupBarcode(result.getText());
          }
        },
      );
      setScanStatus("Kamera aktywna — ustaw kod w ramce.");
    } catch (cameraError) {
      setIsScanning(false);
      setScanStatus("");
      setError(
        cameraError instanceof Error && cameraError.message === "NO_CAMERA"
          ? "Nie znaleziono elementu podglądu kamery."
          : "Nie udało się uruchomić kamery. Sprawdź uprawnienia i połączenie HTTPS.",
      );
    }
  }

  function stopCamera() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
    setScanStatus("");
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-app-background">
        <video
          ref={videoRef}
          className={`aspect-video w-full object-cover ${
            isScanning ? "block" : "hidden"
          }`}
          muted
          playsInline
        />
        {isScanning ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-28 w-[80%] rounded-xl border-2 border-app-inverse/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)] sm:h-36" />
          </div>
        ) : null}
        {!isScanning ? (
          <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-app-accent/70">
            Kamera jest wyłączona
          </div>
        ) : null}
      </div>
      {scanStatus ? (
        <p aria-live="polite" className="text-center text-sm text-app-muted">
          {scanStatus}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {isScanning ? (
          <Button variant="secondary"
            type="button"
            onClick={stopCamera}
            className="px-5 py-3 text-sm font-semibold transition"
          >
            Zatrzymaj kamerę
          </Button>
        ) : (
          <Button
            variant="primary"
            type="button"
            onClick={() => void startCamera()}
            disabled={isLookingUp}
            className="px-5 py-3 text-sm disabled:opacity-50"
          >
            Uruchom kamerę
          </Button>
        )}
      </div>

      <div className="border-t border-app-border pt-5">
        <label htmlFor="manual-barcode" className="field-label">
          Wpisz kod ręcznie
        </label>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void lookupBarcode(manualBarcode);
          }}
        >
          <input
            id="manual-barcode"
            value={manualBarcode}
            onChange={(event) => setManualBarcode(event.target.value)}
            placeholder="np. INV-ABC123"
            className="field-input mt-0 flex-1 font-mono"
            autoComplete="off"
          />
          <Button variant="secondary"
            type="submit"
            disabled={isLookingUp}
            className="px-5 py-3 text-sm font-semibold transition disabled:opacity-50"
          >
            {isLookingUp ? "Szukam..." : "Otwórz"}
          </Button>
        </form>
      </div>

      {error ? (
        <p role="alert" className="status-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
