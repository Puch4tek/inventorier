import type { Locale } from "./locale";
import type { messages } from "./messages";

type WidenMessages<T> = T extends string
  ? string
  : { readonly [K in keyof T]: WidenMessages<T[K]> };

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: WidenMessages<(typeof messages)["en"]>;
  }
}
