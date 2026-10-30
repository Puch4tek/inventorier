"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { setLocaleAction } from "@/i18n/actions";
import { isLocale } from "@/i18n/locale";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("common.language");
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.currentTarget.value;
    if (!isLocale(nextLocale)) return;

    startTransition(async () => {
      await setLocaleAction(nextLocale);
      window.location.reload();
    });
  }

  return (
    <select
      aria-label={t("label")}
      className="rounded-lg border border-app-border bg-app-surface px-2 py-2 text-xs text-app-muted sm:text-sm"
      disabled={isPending}
      onChange={handleChange}
      value={locale}
    >
      <option value="pl">Polski</option>
      <option value="en">English</option>
    </select>
  );
}
