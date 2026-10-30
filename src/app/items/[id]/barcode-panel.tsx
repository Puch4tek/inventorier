"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function BarcodePanel({ itemId }: { itemId: number }) {
  const t = useTranslations("items");
  const svgUrl = `/api/items/${itemId}/barcode?format=svg`;

  return (
    <div className="mt-2">
      <div className="rounded-2xl bg-app-surface-muted p-3 hidden sm:block">
        <img
          src={svgUrl}
          alt={t("barcode.imageAlt")}
          className="mx-auto h-auto max-h-40 max-w-full object-contain"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={svgUrl}
          download
          className="rounded-lg border border-app-border-strong px-3 py-2 text-xs font-semibold transition hover:bg-app-surface-muted"
        >
          {t("barcode.downloadSvg")}
        </a>
        <a
          href={`/api/items/${itemId}/barcode?format=png`}
          download
          className="rounded-lg border border-app-border-strong px-3 py-2 text-xs font-semibold transition hover:bg-app-surface-muted"
        >
          {t("barcode.downloadPng")}
        </a>
      </div>
    </div>
  );
}

export function CopyBarcode({
  barcode,
}: {
  barcode: string;
}) {
  const t = useTranslations("items");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copyBarcode() {
    setCopyError(false);

    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(barcode);
        } catch {
          copyWithFallback(barcode);
        }
      } else {
        copyWithFallback(barcode);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyError(true);
    }
  }

  function copyWithFallback(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    textarea.remove();

    if (!copied) {
      throw new Error("Nie udało się skopiować kodu.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copyBarcode}
        title={t("barcode.copyTitle")}
        aria-label={t("barcode.copyTitle")}
        className="group inline-flex items-center gap-2 rounded-lg px-2 py-1 -ml-2 font-mono text-sm transition hover:bg-app-surface-muted"
      >
        <span>{barcode}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 text-app-muted transition group-hover:text-app-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="8" y="8" width="11" height="11" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      </button>
      {copied ? (
        <span className="text-xs font-medium text-app-success" role="status" aria-live="polite">
          {t("barcode.copied")}
        </span>
      ) : copyError ? (
        <span className="text-xs font-medium text-app-danger" role="alert" aria-live="assertive">
          {t("barcode.copyFailed")}
        </span>
      ) : null}
    </div>
  );
}
