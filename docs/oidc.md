# Logowanie OpenID Connect (OIDC)

## OAuth 2.0 a OIDC

OAuth 2.0 określa delegowanie dostępu do zasobów. Sam token OAuth nie potwierdza tożsamości użytkownika. OpenID Connect (OIDC) dodaje do OAuth warstwę uwierzytelniania: dostawca tożsamości (IdP) wydaje token ID z identyfikatorem użytkownika i standardowymi claimami, a aplikacja weryfikuje podpis i te claimy. Ta aplikacja używa OIDC do logowania; nie pobiera ani nie synchronizuje grup, ról czy uprawnień magazynowych z IdP.

## Jak działa implementacja

Better Auth `genericOAuth` jest tworzony dynamicznie dla konfiguracji zapisanej w bazie. Dostawca ma identyfikator `oidc-<revision>`, a adres discovery wynika z konfiguracji issuer:

```text
<issuer>/.well-known/openid-configuration
```

Wartość issuer musi więc być dokładnym issuerem z dokumentu discovery, łącznie z końcowym ukośnikiem, jeśli dostawca go podaje. Kod żąda zakresów `openid`, `email`, `profile`, włącza PKCE i wymaga weryfikacji tokenu ID. Nie używa osobnego endpointu UserInfo — profil jest odczytywany z tokenu ID po jego weryfikacji. Wymaga też `sub`, niepustego adresu e-mail i `email_verified: true`.

1. Przeglądarka otwiera `GET /api/auth/oidc/sign-in`. Aplikacja tworzy żądanie logowania i przekierowuje do IdP. Dozwolony adres powrotu jest ograniczony do ścieżki lokalnej aplikacji.
2. Better Auth zapisuje i sprawdza stan OAuth (`state`), generuje `nonce` OIDC i weryfikator PKCE. Żądanie używa metody PKCE `S256`.
3. IdP uwierzytelnia użytkownika i zwraca kod autoryzacyjny na callback aplikacji. Serwer wymienia kod na tokeny, używając client ID i client secret oraz weryfikatora PKCE.
4. Better Auth pobiera JWKS wskazane w metadanych discovery i sprawdza podpis tokenu ID. Weryfikuje issuer z discovery, audience równy client ID, wymagane claimy `iss`, `sub`, `aud`, `exp`, `iat`, ważność czasową (tolerancja zegara biblioteki wynosi 30 sekund) oraz zgodność `nonce`. Kod dodatkowo porównuje claim `iss` profilu z issuer zapisanym w ustawieniach i wymaga zweryfikowanego e-maila.
5. Przy powodzeniu Better Auth tworzy albo łączy konto i sesję. Callback dla nieaktualnej rewizji lub wyłączonego OIDC jest odrzucany. Błędy callbacku są zamykane bezpiecznie; szczegóły nie są zwracane w odpowiedzi HTTP.

Stan i PKCE chronią odpowiednio callback i wymianę kodu; nonce wiąże token ID z rozpoczętym logowaniem. Wymaganie podpisu, issuer, audience, czasu i nonce nie zastępuje walidacji poprawności oraz aktualności konfiguracji IdP.

## Konta i uprawnienia

- Konto OIDC jest identyfikowane przez `sub` dostawcy. Istniejące konto lokalne może zostać automatycznie połączone po zgodności adresu e-mail tylko wtedy, gdy adres jest zweryfikowany zarówno w tokenie OIDC, jak i w lokalnym koncie. Jeśli lokalne `emailVerified` jest `false`, samo podobieństwo adresów nie wystarczy. Połączenie dodaje konto dostawcy do istniejącego użytkownika — nie usuwa jego lokalnego konta `credential` ani hasła.
- Przy nowym koncie aplikacja zapisuje imię z claimu `name` (lub adres e-mail, jeśli brak imienia) i oznacza adres jako zweryfikowany na podstawie wymaganego claimu dostawcy. Nie tworzy lokalnego konta `credential` ani hasła. Użytkownik OIDC nie może zalogować się lokalnym hasłem, dopóki administrator nie utworzy mu takiego poświadczenia osobno.
- Nowe konta OIDC otrzymują rolę `USER`. Tylko lokalny proces pierwszej rejestracji tworzy pierwszego administratora, dlatego przed włączeniem OIDC skonfiguruj lokalne konto administratora i zaloguj się nim do **Administracja → OIDC**. Pierwszy użytkownik logujący się przez IdP nie zostaje administratorem.
- Logowanie OIDC może tworzyć konta również wtedy, gdy wyłączono samodzielną rejestrację aplikacji. W kodzie callback OIDC omija kontrolę rejestracji; ustawienie rejestracji nie jest kontrolą dopuszczonych użytkowników IdP. Dostęp ograniczaj polityką i przypisaniami po stronie IdP oraz zarządzaniem kontami w aplikacji.
- Aplikacja nie synchronizuje ról `ADMIN`/`USER`, ról magazynowych, członkostw, grup ani statusu konta z claimów lub grup IdP. Uprawnienia i członkostwa nadaje się w aplikacji. Konto oznaczone jako nieaktywne nie dostanie sesji, także przez OIDC.
- Polityka MFA dla OIDC należy do IdP. Aplikacja nie wymaga ani nie mapuje claimów `amr`/`acr` i nie przekazuje polityki MFA do IdP. Nie zakładaj, że lokalne TOTP lub passkey stanowi drugi składnik logowania OIDC; skonfiguruj wymagane MFA w przepływie IdP.

## Ustawienia i ochrona sekretów

Administrator z aktywną sesją zapisuje issuer, client ID, client secret i stan włączenia na stronie `/admin/oidc`. Formularz nigdy nie odczytuje ani nie wyświetla client secret. Puste pole sekretu zachowuje dotychczasową wartość; ustawienia są odczytywane bez odszyfrowywania do przeglądarki. Każdy udany zapis tworzy nową UUID `oidcRevision`, także zapis bez zmian i wyłączenie OIDC. Rewizja staje się częścią identyfikatora dostawcy, więc stary callback przestaje działać; konfigurację URI callbacku IdP należy dopasować do aktualnej rewizji albo zastosować ograniczony wzorzec URI (szczegóły niżej).

Client secret OIDC oraz hasło SMTP są szyfrowane po stronie aplikacji przez AES-256-GCM i przechowywane jako szyfrogram w bazie. Do tego służy `APP_ENCRYPTION_KEY`: kanoniczny Base64 dokładnie 32 bajtów. W produkcji klucz musi być identyczny na wszystkich instancjach i przechowywany poza bazą oraz jej kopiami zapasowymi.

`APP_ENCRYPTION_KEY` jest również sekretem Better Auth, używanym przez tę bibliotekę do jej mechanizmów kryptograficznych, w tym szyfrowania przechowywanych tokenów OAuth (`encryptOAuthTokens: true`). Hook aplikacji celowo zapisuje `idToken` kont OIDC jako `null`; token ID służy do weryfikacji logowania i nie jest zachowywany. Pozostałe tokeny dostarczone przez IdP są przechowywane jako zaszyfrowane tokeny OAuth Better Auth. Aplikacja nie używa ich do pobierania profilu ani synchronizacji uprawnień.

Utratę, zmianę i migrację `APP_ENCRYPTION_KEY` należy traktować jako operację odzyskiwania sekretów — patrz [procedury operacyjne](operations.md#klucze-szyfrujące-i-migracja-starego-klucza-smtp). Nie przechowuj wartości kluczy ani client secret w dokumentacji, logach, zgłoszeniach lub repozytorium.

## Konfiguracja Authentik

1. Przygotuj publiczny, kanoniczny adres aplikacji w `BETTER_AUTH_URL`, np. `https://inventory.example`. Aplikacja zakłada endpoint auth pod `/api/auth` i wdrożenie aplikacji w katalogu głównym hosta.
2. W Authentik utwórz aplikację i dostawcę **OAuth2/OIDC**. Wybierz przepływ **Authorization Code** oraz klienta poufnego z client ID i client secret. Wymagane zakresy to dokładnie `openid`, `email`, `profile`; aplikacja nie żąda `offline_access`.
3. Użyj domyślnego trybu issuer Authentik, w którym issuer jest osobny dla dostawcy i zawiera slug aplikacji. Typowa wartość to `https://auth.example/application/o/<slug>/`; wpisz dokładny `issuer` zwrócony przez jego dokument discovery. Nie używaj trybu globalnego issuer Authentik: jego discovery pozostaje pod ścieżką dostawcy, podczas gdy aplikacja wyprowadza adres discovery bezpośrednio z issuer.
4. Skonfiguruj redirect URI. Aktualny adres callbacku jest wyświetlany w **Administracja → OIDC**. Kod callbacku ma postać:

   ```text
   https://<publiczny-host-aplikacji>/api/auth/callback/oidc-<oidcRevision>
   ```

   `oidcRevision` jest UUID zapisanym w `AppSettings` i zmienia się po każdym udanym zapisie ustawień OIDC. Aby sprawdzić bieżącą rewizję w PostgreSQL (to nie jest sekret):

   ```sql
   SELECT "oidcRevision" FROM "AppSettings" WHERE "id" = 1;
   ```

   W Authentik można zamiast pojedynczego URI użyć zakotwiczonego wyrażenia regularnego, ograniczonego do dokładnego hosta i ścieżki, np.:

   ```text
   ^https://inventory\.example/api/auth/callback/oidc-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
   ```

   Dopasuj host i użyj mechanizmu regex obsługiwanego przez skonfigurowaną wersję Authentik. Nie stosuj szerokiego wildcardu. Po zapisaniu ustawień ponownie sprawdź URI — kolejny zapis wygeneruje inną rewizję.
5. Na świeżej instalacji najpierw utwórz i sprawdź lokalne konto administratora przez rejestrację aplikacji; nie polegaj na pierwszym logowaniu OIDC, które tworzy zwykłego użytkownika. Następnie jako ten administrator otwórz **Administracja → OIDC**, wpisz dokładny issuer discovery, client ID i client secret, zaznacz włączenie i zapisz. Zachowaj `APP_ENCRYPTION_KEY` w środowisku aplikacji. Jeśli zapisujesz ponownie ustawienia po tej czynności, odśwież dokładny redirect URI, chyba że regex obejmuje nową rewizję.
6. W Authentik ogranicz dostęp do aplikacji i skonfiguruj żądane MFA w politykach/przepływie IdP. Następnie przetestuj logowanie nowym użytkownikiem i połączenie z lokalnym kontem, którego e-mail jest zweryfikowany po obu stronach.

`BETTER_AUTH_URL` musi wskazywać zewnętrzny adres HTTPS widziany przez przeglądarkę; proxy powinno zachować host, schemat i ścieżki `/api/auth/*`, w tym callback. Discovery, endpoint tokenów i JWKS muszą być osiągalne z serwera aplikacji. Adres issuer musi działać także w przeglądarce (dla przekierowania do autoryzacji). Wewnętrzny/prywatny IdP jest obsługiwany pod warunkiem, że używa HTTPS, a jego certyfikat i łańcuch CA są zaufane zarówno przez przeglądarkę, jak i środowisko Node aplikacji. Nie wyłączaj weryfikacji TLS. Równoważenie ruchu powinno kierować callback do tej samej wersji konfiguracji na wszystkich instancjach.

## Mapa kodu

- Konfiguracja biblioteki i hooki kont/sesji: [`src/lib/auth.ts`](../src/lib/auth.ts).
- Dynamiczny provider, issuer, zakresy, PKCE i mapowanie profilu: [`src/lib/oidc-provider-config.ts`](../src/lib/oidc-provider-config.ts).
- Konfiguracja admina, szyfrowanie sekretu i rewizja: [`src/server/settings/oidc.ts`](../src/server/settings/oidc.ts).
- Początek logowania, callback i fail-closed: [`src/app/api/auth/[...all]/route.ts`](../src/app/api/auth/%5B...all%5D/route.ts).
- Formularz admina: [`src/app/admin/oidc/`](../src/app/admin/oidc/).

Uruchom `npm test`, aby wykonać ograniczony zestaw smoke testów opisany w [Development — Testy](development.md#tests). Nie obejmuje on integracji z OIDC ani kompatybilności z działającym dostawcą Authentik.

## Ograniczenia i diagnostyka

- Zmiana dowolnego ustawienia tworzy nową rewizję providera. Callback rozpoczęty przed zapisem jest odrzucany; zmiana issuer/client ID/sekretu może wymagać zaktualizowania konfiguracji klienta w IdP.
- Konto OIDC starej rewizji nie ma już tego samego identyfikatora providera. Przy kolejnym logowaniu po zmianie rewizji połączenie z kontem jest możliwe przez zgodny, zweryfikowany e-mail; kod nie migruje powiązań ani nie gwarantuje dopasowania po `sub`, gdy e-mail się zmienił.
- Nieprawidłowy issuer, niedostępne discovery/JWKS, błędny client secret lub brak `email_verified: true` uniemożliwia zakończenie logowania. Sprawdź najpierw dokładny issuer z discovery, trasę sieciową z kontenera aplikacji, zaufanie TLS, client ID/secret, zakresy i URI callbacku.
- Odpowiedzi startu/callbacku nie ujawniają szczegółów wewnętrznych (np. błędu TLS lub weryfikacji claimów). Diagnozuj konfigurację po stronie IdP i bezpieczne logi serwera; nie wklejaj do logów tokenów, kodów autoryzacyjnych ani sekretów.

Dokumentacja Authentik: [OAuth2/OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/) i [tworzenie dostawcy OAuth2/OIDC](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/create-oauth2-provider/).
