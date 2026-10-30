import { AppHeader } from "@/components/app-header";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/get-current-user";
import { Scanner } from "./scanner";
import { MobileNav } from "@/app/dashboard/mobile-nav";
import { getTranslations } from "next-intl/server";

export const instant = false;

export default async function ScanPage() {
  if (!(await getCurrentUser())) {
    redirect("/login");
  }
  const t = await getTranslations("organization.scanner");

  return (
    <main className="app-shell pb-24 sm:pb-0">
      <AppHeader backHref="/dashboard" backLabel={t("backToDashboard")} />
      <section className="page-shell page-shell-narrow">
        <p className="page-kicker">{t("section")}</p>
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-description">
          {t("description")}
        </p>
        <section className="panel-card mt-8 p-5 sm:p-8">
          <Scanner />
        </section>
      </section>
      <MobileNav />
    </main>
  );
}
