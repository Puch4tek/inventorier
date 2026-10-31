"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import type { OidcSettings } from "@/server/settings/oidc";
import { saveOidcSettingsAction, type OidcActionState } from "./actions";

const initialState: OidcActionState = {};

export function OidcSettingsForm({ settings }: { settings: OidcSettings }) {
  const t = useTranslations("admin.oidcSettings");
  const [values, setValues] = useState({
    enabled: settings.enabled,
    issuer: settings.issuer,
    clientId: settings.clientId,
  });
  const [clientSecret, setClientSecret] = useState("");
  const [state, action, pending] = useActionState(
    async (previous: OidcActionState, data: FormData) => {
      const result = await saveOidcSettingsAction(previous, data);
      if (result.success) setClientSecret("");
      return result;
    },
    initialState,
  );

  return (
    <form action={action} className="mt-5 space-y-5">
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="enabled"
          checked={values.enabled}
          onChange={(event) =>
            setValues({ ...values, enabled: event.target.checked })
          }
        />
        <span>{t("enabled")}</span>
      </label>
      <div>
        <label htmlFor="oidc-issuer" className="field-label">
          {t("issuer")}
        </label>
        <input
          id="oidc-issuer"
          name="issuer"
          type="url"
          maxLength={2048}
          className="field-input"
          value={values.issuer}
          onChange={(event) =>
            setValues({ ...values, issuer: event.target.value })
          }
          autoComplete="url"
        />
        <p className="mt-2 text-sm text-app-muted">{t("issuerDescription")}</p>
      </div>
      <div>
        <p className="field-label">{t("redirectUri")}</p>
        {settings.redirectUri ? (
          <code className="block break-all rounded-lg border border-app-border bg-app-surface-muted p-3 text-sm">
            {settings.redirectUri}
          </code>
        ) : (
          <p role="alert" className="status-error">
            {t("redirectUriUnavailable")}
          </p>
        )}
        <p className="mt-2 text-sm text-app-muted">{t("redirectUriDescription")}</p>
      </div>
      <div>
        <label htmlFor="oidc-client-id" className="field-label">
          {t("clientId")}
        </label>
        <input
          id="oidc-client-id"
          name="clientId"
          maxLength={512}
          className="field-input"
          value={values.clientId}
          onChange={(event) =>
            setValues({ ...values, clientId: event.target.value })
          }
          autoComplete="off"
        />
      </div>
      <div>
        <label htmlFor="oidc-client-secret" className="field-label">
          {t("clientSecret")}
        </label>
        <input
          id="oidc-client-secret"
          name="clientSecret"
          type="password"
          maxLength={4096}
          autoComplete="new-password"
          className="field-input"
          value={clientSecret}
          onChange={(event) => setClientSecret(event.target.value)}
          aria-describedby="oidc-client-secret-help"
        />
        <p id="oidc-client-secret-help" className="mt-2 text-sm text-app-muted">
          {settings.clientSecretUnreadable
            ? t("clientSecretUnreadable")
            : settings.hasClientSecret
              ? t("clientSecretSaved")
              : t("clientSecretMissing")}{" "}
          {t("clientSecretUnchanged")}
        </p>
      </div>
      {state.error ? (
        <p role="alert" className="status-error">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p role="status" className="status-success">
          {state.success}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="px-5 py-3 text-sm disabled:opacity-50"
      >
        {pending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
