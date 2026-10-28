import type { SaveEmailSettingsInput } from "@/server/settings/email";

export type EmailActionState = { error?: string; success?: string };

type Dependencies<Config> = {
  requireAdmin: () => Promise<{ id: string; sessionId: string }>;
  save: (input: SaveEmailSettingsInput, actorId: string, sessionId: string) => Promise<unknown>;
  consumeTestLimit: (actorId: string) => Promise<boolean>;
  getConfig: (actorId: string, sessionId: string) => Promise<Config>;
  sendTest: (config: Config, to: string) => Promise<unknown>;
  revalidate: () => void;
  settingsError: (error: unknown) => string | undefined;
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
    async save(_previous: EmailActionState, data: FormData): Promise<EmailActionState> {
      let actor: { id: string; sessionId: string };
      try {
        actor = await deps.requireAdmin();
      } catch {
        return { error: "Nie masz uprawnień do wykonania tej operacji." };
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
        return { error: "Sprawdź dane formularza, port (1–65535) i czas ważności (15–1440 minut)." };
      }
      try {
        await deps.save({
          host, port, tls, username, fromEmail, fromName,
          password: password || undefined,
          resetEnabled: resetEnabled === "on",
          resetExpiryMinutes,
        }, actor.id, actor.sessionId);
        deps.revalidate();
        return { success: "Ustawienia e-mail zostały zapisane." };
      } catch (error) {
        return { error: deps.settingsError(error) ?? "Nie udało się zapisać ustawień. Sprawdź dane, kompletność konfiguracji i klucz szyfrowania SMTP." };
      }
    },
    async send(_previous: EmailActionState, data: FormData): Promise<EmailActionState> {
      let actor: { id: string; sessionId: string };
      try {
        actor = await deps.requireAdmin();
      } catch {
        return { error: "Nie masz uprawnień do wykonania tej operacji." };
      }
      const to = text(data, "to")?.trim();
      if (!to || to.length > 254 || !/^[^\s@<>(),;:"\\]+@[^\s@<>(),;:"\\]+\.[^\s@<>(),;:"\\]+$/.test(to)) {
        return { error: "Podaj poprawny adres odbiorcy." };
      }
      try {
        if (!await deps.consumeTestLimit(actor.id)) {
          return { error: "Wysyłka testowa jest obecnie niedostępna lub przekroczono limit. Spróbuj później." };
        }
        const config = await deps.getConfig(actor.id, actor.sessionId);
        await deps.sendTest(config, to);
        return { success: "Wiadomość testowa została wysłana." };
      } catch (error) {
        return { error: deps.settingsError(error) ?? "Nie udało się wysłać wiadomości testowej. Sprawdź zapisane ustawienia SMTP i klucz szyfrowania." };
      }
    },
  };
}
