import type { Locale } from "./locale";
import type { messages } from "./messages";
import type { WidenMessages } from "./messages/shape";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: WidenMessages<(typeof messages)["en"]>;
  }
}
