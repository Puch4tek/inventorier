# Localization

The application uses `next-intl` with language-specific TypeScript dictionaries. Supported locales are Polish (`pl`, the default) and English (`en`). The selected language is stored in the `NEXT_LOCALE` browser cookie; without a valid cookie, the app negotiates `Accept-Language` and falls back to Polish. URLs and database records are not localized.

## Dictionary structure

Each locale has one file under `src/i18n/messages/`:

- `en.ts` — English source dictionary and the reference structure for type checking.
- `pl.ts` — Polish translation with the same namespaces and keys.

The dictionaries contain the same top-level namespaces, such as `common`, `auth`, `items`, `organization`, and `admin`. Email templates live under `auth.email` in the same locale files as the rest of the translations. `src/i18n/messages/index.ts` registers dictionaries and checks that every locale has the same keys and string values as English. Missing or extra keys should fail the TypeScript build.

## Translating existing text

1. Find the relevant key in `src/i18n/messages/en.ts`.
2. Update that English value and the matching key in `src/i18n/messages/pl.ts`.
3. Keep the key and its nesting unchanged. Keys describe where a message is used; they are not translated.
4. Preserve ICU placeholders and formatting syntax exactly. For example, `{name}` and `{count, plural, one {...} other {...}}` must remain valid in both dictionaries. Placeholder names must match the values passed by the component.
5. Keep user-entered names, item descriptions, warehouse names, and other database content as-is. Translate only application-provided labels and messages. Existing history descriptions remain unchanged; new history event identifiers are translated at display time.

Avoid embedding localized text in components, Server Actions, or server services. Use the `next-intl` API instead:

```tsx
// Server Component or Server Action
import { getTranslations } from "next-intl/server";

const t = await getTranslations("items");
const title = t("list.title");
```

```tsx
// Client Component
import { useTranslations } from "next-intl";

const t = useTranslations("items");
return <button>{t("create.submit")}</button>;
```

Use the existing domain namespace for new keys. For translated dates and numbers, prefer `getFormatter()` in Server Components or `useFormatter()` in Client Components rather than hardcoded locale strings such as `pl-PL`.

## Adding a language

1. Add its locale code and native-language label to `localeNames` in `src/i18n/locale.ts`. This list also supplies the options in the language switcher. Keep `defaultLocale` unchanged unless the application's default should change.
2. Add `src/i18n/messages/<locale>.ts`, using `en.ts` as the structural reference and translating every namespace, including `auth.email`.
3. Register the imported dictionary in `src/i18n/messages/index.ts`. The type check will flag missing or extra keys.
4. Add or update tests for locale negotiation and dictionary coverage, then run:

   ```sh
   node --conditions=react-server --experimental-strip-types \
     --import ./tests/register-ts-runtime-loader.mjs --test \
     tests/*i18n*.test.mjs tests/admin-error-localization.test.mjs
   npm run lint
   npm run build
   ```

Locale codes must match between `localeNames`, the dictionary filename, and the registry. Regional browser preferences (for example `en-GB`) resolve to a supported base language.

## Errors and email

For user-facing failures, add a translation key and map known error codes or error types to it. Do not display arbitrary exception messages; unexpected failures should use a translated safe fallback while technical details remain in server logs.

Email templates are translated in each locale dictionary under `auth.email`. When sending deferred email, capture the request locale before scheduling the work and pass it explicitly to the mail function; do not read request cookies or headers later in the background task. Keep text and HTML email content consistent, and preserve existing URL validation and HTML escaping.
