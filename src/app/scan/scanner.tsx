"use client";

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
      <div className="relative overflow-hidden rounded-2xl bg-[#1d1d1f]">
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
            <div className="h-28 w-[80%] rounded-xl border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)] sm:h-36" />
          </div>
        ) : null}
        {!isScanning ? (
          <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-white/70">
            Kamera jest wyłączona
          </div>
        ) : null}
      </div>
      {scanStatus ? (
        <p aria-live="polite" className="text-center text-sm text-[#6e6e73]">
          {scanStatus}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {isScanning ? (
          <button
            type="button"
            onClick={stopCamera}
            className="rounded-xl border border-black/[0.12] px-5 py-3 text-sm font-semibold transition hover:bg-[#f5f5f7]"
          >
            Zatrzymaj kamerę
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void startCamera()}
            disabled={isLookingUp}
            className="rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#424245] disabled:opacity-50"
          >
            Uruchom kamerę
          </button>
        )}
      </div>

      <div className="border-t border-black/[0.06] pt-5">
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
          <button
            type="submit"
            disabled={isLookingUp}
            className="rounded-xl border border-black/[0.12] px-5 py-3 text-sm font-semibold transition hover:bg-[#f5f5f7] disabled:opacity-50"
          >
            {isLookingUp ? "Szukam..." : "Otwórz"}
          </button>
        </form>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-[#fff2f2] px-4 py-3 text-sm text-[#b42318]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
