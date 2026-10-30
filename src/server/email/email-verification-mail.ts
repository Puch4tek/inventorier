import "server-only";

import type { Locale } from "@/i18n/locale";
import { emailMessages } from "../../i18n/messages/email.mjs";
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
  locale: Locale = "pl",
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

  const t = emailMessages[locale].verification;
  await sendMail(config, {
    to,
    subject: t.subject,
    text: `${t.intro}\n\n${url}\n\n${t.ignore}`,
    html: `<p>${escapeHtml(t.intro)}</p><p><a href="${escapeHtml(url)}">${escapeHtml(t.link)}</a></p><p>${escapeHtml(t.ignore)}</p>`,
  });
}
