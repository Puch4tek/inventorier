import { getButtonClassName } from "@/components/button";
import { AppHeader } from "@/components/app-header";
import { isRegistrationEnabled } from "@/server/settings/registration";
import { getCurrentUser } from "@/server/auth/get-current-user";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";

export const instant = false;

export default async function Home() {
  await connection();
  const [user, t] = await Promise.all([
    getCurrentUser(),
    getTranslations("organization.home"),
  ]);
  const highlights = [
    {
      number: "01",
      title: t("highlightInventoryTitle"),
      description: t("highlightInventoryDescription"),
    },
    {
      number: "02",
      title: t("highlightLocationsTitle"),
      description: t("highlightLocationsDescription"),
    },
    {
      number: "03",
      title: t("highlightSearchTitle"),
      description: t("highlightSearchDescription"),
    },
  ];

  if (user) {
    redirect("/dashboard");
  }

  const registrationEnabled = await isRegistrationEnabled();

  return (
    <main className="app-shell overflow-hidden">
      <AppHeader maxWidth="max-w-7xl" />

      <section className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-20">
        <div className="relative z-10">
          <p className="page-kicker">{t("kicker")}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
            {t("headline")}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-app-muted sm:text-lg sm:leading-8">
            {t("description")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {registrationEnabled ? (
              <Link
                href="/users/new"
                className={getButtonClassName("primary", "px-5 py-3 text-sm")}
              >
                {t("createAccount")}
              </Link>
            ) : null}
            <Link
              href="/login"
              className={getButtonClassName("secondary", "px-5 py-3 text-sm")}
            >
              {t("existingAccount")}
            </Link>
          </div>
          <p className="mt-5 text-xs text-app-subtle">
            {t("tip")}
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 rounded-full bg-app-info-surface/60 blur-3xl" />
          <div className="relative rounded-4xl border border-app-border bg-app-surface p-3 shadow-modal sm:p-5">
            <div className="rounded-3xl border border-app-border bg-app-surface-muted p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-app-muted">
                    {t("previewDashboard")}
                  </p>
                  <p className="mt-1 text-xl font-semibold tracking-[-0.03em]">
                    {t("previewWarehouse")}
                  </p>
                </div>
                <span className="rounded-full bg-app-success-surface px-2.5 py-1 text-xs font-medium text-app-success">
                  {t("current")}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <PreviewStat label={t("items")} value="128" tone="info" />
                <PreviewStat label={t("locations")} value="12" tone="success" />
                <PreviewStat label={t("categories")} value="8" tone="warning" />
                <PreviewStat label={t("toReview")} value="4" tone="neutral" />
              </div>

              <div className="mt-3 rounded-2xl border border-app-border bg-app-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-app-muted">
                    {t("recentlyAdded")}
                  </p>
                  <span className="text-xs text-app-subtle">3 {t("positions")}</span>
                </div>
                <div className="mt-4 space-y-3">
                  <PreviewItem name={t("exampleItemOne")} meta={t("previewItemOneMeta")} />
                  <PreviewItem name={t("exampleItemTwo")} meta={t("previewItemTwoMeta")} />
                  <PreviewItem name={t("exampleItemThree")} meta={t("previewItemThreeMeta")} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-app-border bg-app-surface">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <p className="page-kicker">{t("highlightKicker")}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tighter sm:text-5xl">
              {t("highlightTitle")}
            </h2>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3 sm:gap-5">
            {highlights.map((highlight) => (
              <article
                key={highlight.number}
                className="rounded-3xl border border-app-border bg-app-surface-muted p-6 sm:p-7"
              >
                <span className="text-sm font-semibold text-app-subtle">
                  {highlight.number}
                </span>
                <h3 className="mt-10 text-xl font-semibold tracking-[-0.03em]">
                  {highlight.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-app-muted">
                  {highlight.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-app-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-app-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>Inventorier</span>
          <span>{t("footerDescription")}</span>
        </div>
      </footer>
    </main>
  );
}

function PreviewStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "info" | "success" | "warning" | "neutral";
}) {
  const toneClasses = {
    info: "bg-app-info-surface",
    success: "bg-app-success-surface",
    warning: "bg-app-warning-surface",
    neutral: "bg-app-surface-muted",
  };

  return (
    <div className={`rounded-2xl p-4 ${toneClasses[tone]}`}>
      <p className="text-xs text-app-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
    </div>
  );
}

function PreviewItem({ name, meta }: { name: string; meta: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="mt-1 text-xs text-app-muted">{meta}</p>
      </div>
      <span className="h-2 w-2 shrink-0 rounded-full bg-app-success" />
    </div>
  );
}
