import "server-only";

import { sendMail, type SmtpConfig } from "@/server/email/send-mail";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

export async function sendEmailVerificationMail(
  config: SmtpConfig,
  to: string,
  url: string,
): Promise<void> {
  const parsed = new URL(url);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    /[\u0000-\u001f\u007f]/.test(url)
  ) {
    throw new Error("Nieprawidłowy adres potwierdzenia.");
  }

  await sendMail(config, {
    to,
    subject: "Potwierdź adres e-mail",
    text: `Aby potwierdzić adres e-mail konta, otwórz poniższy link:\n\n${url}\n\nJeśli nie wysłano tej prośby, zignoruj tę wiadomość.`,
    html: `<p>Aby potwierdzić adres e-mail konta, otwórz poniższy link:</p><p><a href="${escapeHtml(url)}">Potwierdź adres e-mail</a></p><p>Jeśli nie wysłano tej prośby, zignoruj tę wiadomość.</p>`,
  });
}
