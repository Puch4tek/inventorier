import type { Locale } from "../locale";
import type { WidenMessages } from "./shape";
import englishMessages from "./en";
import polishMessages from "./pl";

export const messages = {
  en: englishMessages,
  pl: polishMessages,
} satisfies Record<Locale, WidenMessages<typeof englishMessages>>;
