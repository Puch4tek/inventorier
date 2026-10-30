"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/button";
import type { EmailSettings } from "@/server/settings/email";
import { saveEmailSettingsAction, sendTestEmailAction } from "./actions";
import type { EmailActionState } from "./action-core";

const initialState: EmailActionState = {};

function Message({ state }: { state: EmailActionState }) {
  return (
    <>
      {state.error ? <p role="alert" className="status-error">{state.error}</p> : null}
      {state.success ? <p role="status" className="status-success">{state.success}</p> : null}
    </>
  );
}

export function EmailSettingsForm({ settings }: { settings: EmailSettings }) {
  const t = useTranslations("admin.emailSettings");
  const [values, setValues] = useState(settings);
  const [password, setPassword] = useState("");
  const [state, action, pending] = useActionState(async (previous: EmailActionState, data: FormData) => {
    const result = await saveEmailSettingsAction(previous, data);
    if (result.success) {
      setPassword("");
    }
    return result;
  }, initialState);

  return (
    <form action={action} className="mt-5 space-y-8">
      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold">{t("connectionLegend")}</legend>
      <div>
        <label htmlFor="smtp-host" className="field-label">{t("host")}</label>
        <input id="smtp-host" name="host" className="field-input" value={values.host} onChange={(event) => setValues({ ...values, host: event.target.value })} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="smtp-port" className="field-label">{t("port")}</label>
        <input id="smtp-port" name="port" type="number" min="1" max="65535" required className="field-input" value={values.port} onChange={(event) => setValues({ ...values, port: Number(event.target.value) })} />
      </div>
      <div>
        <label htmlFor="smtp-tls" className="field-label">{t("encryption")}</label>
        <select id="smtp-tls" name="tls" className="field-input" value={values.tls} onChange={(event) => setValues({ ...values, tls: event.target.value as EmailSettings["tls"] })}>
          <option value="implicit">TLS (implicit)</option>
          <option value="starttls">STARTTLS</option>
        </select>
      </div>
      <div>
        <label htmlFor="smtp-username" className="field-label">{t("username")}</label>
        <input id="smtp-username" name="username" className="field-input" value={values.username} onChange={(event) => setValues({ ...values, username: event.target.value })} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="smtp-password" className="field-label">{t("password")}</label>
        <input id="smtp-password" name="password" type="password" autoComplete="new-password" className="field-input" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="smtp-password-help" />
        <p id="smtp-password-help" className="mt-2 text-sm text-app-muted">
          {settings.passwordUnreadable
            ? t("passwordUnreadable")
            : settings.hasPassword ? t("passwordSaved") : t("passwordMissing")}
          {t("passwordUnchanged")}
        </p>
      </div>
      <div>
        <label htmlFor="smtp-from-email" className="field-label">{t("senderAddress")}</label>
        <input id="smtp-from-email" name="fromEmail" type="email" className="field-input" value={values.fromEmail} onChange={(event) => setValues({ ...values, fromEmail: event.target.value })} />
      </div>
      <div>
        <label htmlFor="smtp-from-name" className="field-label">{t("senderName")}</label>
        <input id="smtp-from-name" name="fromName" className="field-input" value={values.fromName} onChange={(event) => setValues({ ...values, fromName: event.target.value })} />
      </div>
      </fieldset>
      <fieldset className="space-y-5">
        <legend className="text-lg font-semibold">{t("resetLegend")}</legend>
      <div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="resetEnabled" checked={values.resetEnabled} onChange={(event) => setValues({ ...values, resetEnabled: event.target.checked })} />
          {t("enableReset")}
        </label>
        <p className="mt-2 text-sm text-app-muted">
          {t("resetWarning")}
        </p>
      </div>
      <div>
        <label htmlFor="reset-expiry" className="field-label">{t("linkExpiry")}</label>
        <input id="reset-expiry" name="resetExpiryMinutes" type="number" min="15" max="1440" required className="field-input" value={values.resetExpiryMinutes} onChange={(event) => setValues({ ...values, resetExpiryMinutes: Number(event.target.value) })} />
        <p className="mt-2 text-sm text-app-muted">{t("expiryDescription")}</p>
      </div>
      {!settings.hasPassword && !settings.host ? (
        <p className="text-sm text-app-muted">{t("smtpRequired")}</p>
      ) : null}
      </fieldset>
      <Message state={state} />
      <Button type="submit" disabled={pending} className="px-5 py-3 text-sm disabled:opacity-50">
        {pending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}

export function TestEmailForm() {
  const t = useTranslations("admin.emailSettings");
  const [state, action, pending] = useActionState(sendTestEmailAction, initialState);
  const [to, setTo] = useState("");
  return (
    <form action={action} className="mt-5 space-y-5">
      <div>
        <label htmlFor="smtp-test-to" className="field-label">{t("recipient")}</label>
        <input id="smtp-test-to" name="to" type="email" required maxLength={254} className="field-input" value={to} onChange={(event) => setTo(event.target.value)} />
      </div>
      <Message state={state} />
      <Button variant="secondary" type="submit" disabled={pending} className="px-5 py-3 text-sm disabled:opacity-50">
        {pending ? t("sending") : t("sendTest")}
      </Button>
    </form>
  );
}
