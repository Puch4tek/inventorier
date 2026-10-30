import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { resolveLocale, localeCookieName } from "./locale";
import { messages } from "./messages";

function getMessages(locale: "pl" | "en") {
  return messages[locale] as (typeof messages)["en"];
}

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  if (explicitLocale === "pl" || explicitLocale === "en") {
    return {
      locale: explicitLocale,
      messages: getMessages(explicitLocale),
    };
  }

  const [cookieStore, requestHeaders] = await Promise.all([
    cookies(),
    headers(),
  ]);
  const locale = resolveLocale({
    cookie: cookieStore.get(localeCookieName)?.value,
    acceptLanguage: requestHeaders.get("accept-language"),
  });

  return {
    locale,
    messages: getMessages(locale),
  };
});
