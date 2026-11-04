"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import { unlinkOidcAction, type OidcLinkActionState } from "./oidc-actions";

const initialState: OidcLinkActionState = {};

export function OidcSettings({
  enabled,
  connected,
  hasPassword,
  callbackStatus,
}: {
  enabled: boolean;
  connected: boolean;
  hasPassword: boolean;
  callbackStatus?: string;
}) {
  const t = useTranslations("auth.security.oidc");
  const [state, action, pending] = useActionState(unlinkOidcAction, initialState);
  return (
    <section className="panel-card p-6 sm:p-8">
      <h2 className="text-xl font-semibold">{t("heading")}</h2>
      <p className="mt-2 text-sm text-app-muted">{connected ? t("connected") : t("notConnected")}</p>
      {!enabled ? <p className="mt-2 text-sm text-app-muted">{t("disabled")}</p> : null}
      {callbackStatus === "connected" ? <p role="status" className="status-success mt-3">{t("linked")}</p> : null}
      {callbackStatus === "error" ? <p role="alert" className="status-error mt-3">{t("linkError")}</p> : null}
      {state.error ? <p role="alert" className="status-error mt-3">{state.error}</p> : null}
      {state.success ? <p role="status" className="status-success mt-3">{state.success}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {enabled && !connected ? (
          <form method="post" action="/api/auth/oidc/link">
            <Button type="submit" className="px-4 py-2 text-sm">{t("link")}</Button>
          </form>
        ) : null}
        {connected ? (
          <form action={action} onSubmit={(event) => {
            if (!window.confirm(t("confirmUnlink"))) event.preventDefault();
          }}>
            <Button variant="secondary" type="submit" disabled={!hasPassword || pending} className="px-4 py-2 text-sm">
              {t("unlink")}
            </Button>
          </form>
        ) : null}
      </div>
      {connected && !hasPassword ? <p className="mt-2 text-sm text-app-muted">{t("passwordRequired")}</p> : null}
    </section>
  );
}
