import type { SaveEmailSettingsInput } from "@/server/settings/email";
import type { Locale } from "@/i18n/locale";
import { messages } from "@/i18n/messages";

export type EmailActionState = { error?: string; success?: string };

type Dependencies<Config> = {
  requireAdmin: () => Promise<{ id: string; sessionId: string }>;
  save: (input: SaveEmailSettingsInput, actorId: string, sessionId: string) => Promise<unknown>;
  consumeTestLimit: (actorId: string) => Promise<boolean>;
  getConfig: (actorId: string, sessionId: string) => Promise<Config>;
  sendTest: (config: Config, to: string, locale: Locale) => Promise<unknown>;
  revalidate: () => void;
  settingsError: (error: unknown, locale: Locale) => string | undefined;
};

function text(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value : null;
}

function integer(value: string | null, min: number, max: number) {
  if (!value || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= min && number <= max ? number : null;
}

export function createEmailActions<Config>(deps: Dependencies<Config>) {
  return {
    async save(
      _previous: EmailActionState,
      data: FormData,
      locale: Locale = "pl",
    ): Promise<EmailActionState> {
      const t = messages[locale].admin;
      let actor: { id: string; sessionId: string };
      try {
        actor = await deps.requireAdmin();
      } catch {
        return { error: t.emailActions.errors.unauthorized };
      }

      const host = text(data, "host");
      const port = integer(text(data, "port"), 1, 65535);
      const tls = text(data, "tls");
      const username = text(data, "username");
      const fromEmail = text(data, "fromEmail");
      const fromName = text(data, "fromName");
      const password = text(data, "password");
      const resetEnabled = text(data, "resetEnabled");
      const resetExpiryMinutes = integer(text(data, "resetExpiryMinutes"), 15, 1440);
      if (
        host === null || port === null || (tls !== "implicit" && tls !== "starttls") ||
        username === null || fromEmail === null || fromName === null || password === null ||
        (resetEnabled !== null && resetEnabled !== "on") || resetExpiryMinutes === null
      ) {
        return { error: t.emailActions.errors.invalidForm };
      }
      try {
        await deps.save({
          host, port, tls, username, fromEmail, fromName,
          password: password || undefined,
          resetEnabled: resetEnabled === "on",
          resetExpiryMinutes,
        }, actor.id, actor.sessionId);
        deps.revalidate();
        return { success: t.emailActions.saved };
      } catch (error) {
        return {
          error:
            deps.settingsError(error, locale) ??
            t.emailActions.errors.saveFailed,
        };
      }
    },
    async send(
      _previous: EmailActionState,
      data: FormData,
      locale: Locale = "pl",
    ): Promise<EmailActionState> {
      const t = messages[locale].admin;
      let actor: { id: string; sessionId: string };
      try {
        actor = await deps.requireAdmin();
      } catch {
        return { error: t.emailActions.errors.unauthorized };
      }
      const to = text(data, "to")?.trim();
      if (!to || to.length > 254 || !/^[^\s@<>(),;:"\\]+@[^\s@<>(),;:"\\]+\.[^\s@<>(),;:"\\]+$/.test(to)) {
        return { error: t.emailActions.errors.recipient };
      }
      try {
        if (!await deps.consumeTestLimit(actor.id)) {
          return { error: t.emailActions.errors.testUnavailable };
        }
        const config = await deps.getConfig(actor.id, actor.sessionId);
        await deps.sendTest(config, to, locale);
        return { success: t.emailActions.testSent };
      } catch (error) {
        return {
          error:
            deps.settingsError(error, locale) ??
            t.emailActions.errors.testFailed,
        };
      }
    },
  };
}
