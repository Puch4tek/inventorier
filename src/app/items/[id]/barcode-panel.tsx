"use client";

import { useState } from "react";

export function BarcodePanel({ itemId }: { itemId: number }) {
  const svgUrl = `/api/items/${itemId}/barcode?format=svg`;

  return (
    <div className="mt-2">
      <div className="rounded-2xl bg-[#f5f5f7] p-3">
        <img
          src={svgUrl}
          alt="Kod kreskowy przedmiotu"
          className="mx-auto h-auto max-h-40 max-w-full object-contain"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={svgUrl}
          download
          className="rounded-lg border border-black/[0.12] px-3 py-2 text-xs font-semibold transition hover:bg-[#f5f5f7]"
        >
          Pobierz SVG
        </a>
        <a
          href={`/api/items/${itemId}/barcode?format=png`}
          download
          className="rounded-lg border border-black/[0.12] px-3 py-2 text-xs font-semibold transition hover:bg-[#f5f5f7]"
        >
          Pobierz PNG
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
  const [copied, setCopied] = useState(false);

  async function copyBarcode() {
    await navigator.clipboard.writeText(barcode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copyBarcode}
      title="Kopiuj kod kreskowy"
      aria-label="Kopiuj kod kreskowy"
      className="group inline-flex items-center gap-2 rounded-lg px-2 py-1 -ml-2 font-mono text-sm transition hover:bg-[#f5f5f7]"
    >
      <span>{barcode}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4 text-[#6e6e73] transition group-hover:text-[#1d1d1f]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </svg>
      <span className="sr-only">{copied ? "Skopiowano" : "Kopiuj"}</span>
    </button>
  );
}
