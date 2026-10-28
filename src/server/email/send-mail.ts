import "server-only";

import nodemailer from "nodemailer";

export type SmtpConfig = {
  host: string;
  port: number;
  tls: "implicit" | "starttls";
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
};

type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendMail(config: SmtpConfig, message: MailMessage): Promise<void> {
  if (config.tls !== "implicit" && config.tls !== "starttls") {
    throw new Error("Nieprawidłowy tryb zabezpieczenia SMTP.");
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.tls === "implicit",
    requireTLS: config.tls === "starttls",
    tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
    auth: { user: config.username, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });

  await transport.sendMail({
    from: { name: config.fromName, address: config.fromEmail },
    ...message,
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return character;
    }
  });
}

export async function sendTestEmail(config: SmtpConfig, to: string): Promise<void> {
  await sendMail(config, {
    to,
    subject: "Test konfiguracji poczty",
    text: "To jest wiadomość testowa. Konfiguracja poczty działa poprawnie.",
    html: "<p>To jest wiadomość testowa. Konfiguracja poczty działa poprawnie.</p>",
  });
}

export async function sendPasswordResetEmail(
  config: SmtpConfig,
  to: string,
  url: string,
): Promise<void> {
  // The caller must supply a URL produced from the trusted Better Auth configuration.
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Nieprawidłowy adres resetowania hasła.");
  }
  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.username ||
    parsedUrl.password ||
    /[\u0000-\u001f\u007f]/.test(url)
  ) {
    throw new Error("Nieprawidłowy adres resetowania hasła.");
  }

  await sendMail(config, {
    to,
    subject: "Resetowanie hasła",
    text: `Otrzymaliśmy prośbę o zresetowanie hasła. Aby ustawić nowe hasło, otwórz poniższy link:\n\n${url}\n\nJeśli nie wysłano tej prośby, zignoruj tę wiadomość.`,
    html: `<p>Otrzymaliśmy prośbę o zresetowanie hasła.</p><p><a href="${escapeHtml(url)}">Ustaw nowe hasło</a></p><p>Jeśli nie wysłano tej prośby, zignoruj tę wiadomość.</p>`,
  });
}
