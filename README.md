This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Samodzielna rejestracja

Administrator systemu może w panelu administracji, w sekcji użytkowników,
włączyć lub wyłączyć samodzielną rejestrację. Jest ona domyślnie włączona.
Po jej wyłączeniu administratorzy nadal mogą tworzyć konta, a istniejący
użytkownicy mogą się logować. Nowe konto nie uzyskuje automatycznie dostępu do
magazynów. Administrator lub menedżer z dostępem do danego magazynu musi nadać
użytkownikowi rolę osobno dla tego magazynu.

## E-mail i resetowanie hasła

Administrator może w zakładce **Administracja → E-mail** skonfigurować
serwer SMTP i wysłać wiadomość testową na wskazany adres. Hasło jest
szyfrowane w bazie AES-256-GCM. Przed jego zapisaniem ustaw
`SMTP_ENCRYPTION_KEY` na losowy 32-bajtowy klucz zakodowany w base64:

```bash
openssl rand -base64 32
```

Wynik przechowuj w bezpiecznym magazynie sekretów, nie w repozytorium. Wszystkie
procesy jednej instancji muszą używać tego samego klucza. Zachowuj go osobno
od kopii bazy. Po utracie klucza trzeba podać hasło SMTP ponownie; przy zmianie
klucza zaktualizuj szyfrowane ustawienie zgodnie z procedurą operacyjną.
W ustawieniach puste pole hasła zachowuje zapisane hasło; wpisanie nowego
zastępuje je.

Włączenie resetowania wymaga prawidłowej konfiguracji SMTP. Link jest ważny
domyślnie 60 minut; administrator może wybrać od 15 minut do 24 godzin.
Przy pierwszej konfiguracji SMTP reset jest domyślnie zaznaczony i włączy się
dopiero po zapisaniu kompletnej konfiguracji poczty. Odczyt lub aktualizacja
istniejącej konfiguracji nie zmienia automatycznie zapisanej flagi resetu.
Wyłączenie blokuje nowe prośby, ale wcześniej wystawione linki pozostają ważne
do wygaśnięcia. Reset unieważnia wszystkie sesje, lecz zachowuje TOTP i
passkeys. Zablokowane konto nie może otrzymać linku ani zresetować hasła.
Limit wysyłek testowych wynosi 5 na administratora na godzinę.

Użytkownik może zmienić adres z aktywnej sesji w **Ustawienia konta → E-mail**.
Better Auth wysyła link weryfikacyjny na nowy adres; otwarcie go zatwierdza
zmianę. Link wygasa po godzinie. Nie jest wymagane ponowne podanie hasła ani
passkey, a poprzedni adres nie otrzymuje powiadomienia.

W produkcji używaj HTTPS i ustaw `BETTER_AUTH_URL` na zaufany publiczny adres
instancji. Reset wymaga reverse proxy, które **nadpisuje** `x-real-ip`
wartością IP klienta; ustaw wtedy `TRUSTED_PROXY_IP_HEADER=x-real-ip`.
Bez tego ustawienia aplikacja nie będzie wystawiać linków ani przyjmować prób
ich użycia w środowisku produkcyjnym. Limity resetowania to 5 próśb na adres
e-mail na godzinę, 20 próśb na adres IP na godzinę i 100 prób użycia tokenu na
adres IP w ciągu 15 minut.

Żądania resetu są przetwarzane po wysłaniu neutralnej odpowiedzi, aby czas
odpowiedzi nie zdradzał istnienia konta. Mechanizm `after` podlega limitowi
czasu platformy i nie jest trwałą kolejką: przerwanie procesu lub limitu może
uniemożliwić wysłanie wiadomości; w takim przypadku należy ponowić żądanie.

Zastosuj nową migrację aplikacji zgodnie z istniejącą procedurą wdrożenia
migracji i wyślij wiadomość testową przed włączeniem resetowania.

## Nowa instalacja

Każda instancja aplikacji jest osobną przestrzenią z własną bazą danych.
Istniejących baz i danych organizacyjnych nie można aktualizować tą ścieżką.
Przed instalacją utwórz nową, pustą bazę i jawnie ustaw `DATABASE_URL` na tę
bazę. Nie używaj adresu bazy istniejącej instancji:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/NEW_EMPTY_DATABASE" \
  npx prisma migrate deploy --config prisma-bootstrap.config.ts
npx prisma generate --config prisma-bootstrap.config.ts
```

Nie uruchamiaj `migrate reset` ani `db push --force-reset` na istniejącej bazie.
Bootstrap używa tej samej historii migracji co zwykły `migrate deploy`; przy
następnych wdrożeniach użyj `npx prisma migrate deploy --config prisma7.config.ts`.
Pierwsze konto utworzone na pustej instalacji zostaje administratorem;
administrator tworzy pierwszy magazyn ręcznie.

### Instalacje z wcześniejszego snapshotu bootstrap

Jeżeli baza została utworzona poprzednią wersją bootstrapu zawierającą wyłącznie
migrację `20261028115504_initial_snapshot`, zatrzymaj aplikację, wykonaj kopię
zapasową i potwierdź, że jej schemat odpowiada temu snapshotowi. Wyłącznie dla
takiej bazy ustaw `DATABASE_URL` i oznacz trzy migracje jako już zastosowane:

```bash
npx prisma migrate resolve --config prisma7.config.ts --applied 20261027115504_apply_the_schema
npx prisma migrate resolve --config prisma7.config.ts --applied 20261027160000_reset_legacy_two_factor
npx prisma migrate resolve --config prisma7.config.ts --applied 20261028180000_email_settings
npx prisma migrate deploy --config prisma7.config.ts
```

Jeśli wcześniejsza próba `migrate deploy` pozostawiła nieudaną migrację
`20261027115504_apply_the_schema`, najpierw sprawdź jej stan i schemat bazy,
a następnie oznacz tę nieudaną próbę jako wycofaną poleceniem
`npx prisma migrate resolve --config prisma7.config.ts --rolled-back 20261027115504_apply_the_schema`.
Nie wykonuj tych poleceń dla innych historii ani bez potwierdzenia schematu:
`resolve` zmienia historię, nie wykonuje migracji. Zwłaszcza ponowne wykonanie
migracji MFA może usunąć nowo skonfigurowane czynniki.

## Uprawnienia i magazyny

Użytkownik może mieć różne uprawnienia w różnych magazynach. `USER` może
przeglądać dane i zmieniać ilości, `MANAGER` może dodatkowo zarządzać danymi
i dostępem do swojego magazynu, a `ADMIN` ma pełny dostęp do całej instancji.
Brak przypisania oznacza brak dostępu. Menedżer nie może zmieniać własnych
uprawnień; może zarządzać innymi użytkownikami i menedżerami w swoim magazynie.
Tylko administrator tworzy i usuwa magazyny, a ostatni magazyn nie może zostać
usunięty. Administrator może nadać pierwszego menedżera; magazyn nie musi mieć
menedżera.

Rejestracja jest domyślnie włączona. Nowe konto nie otrzymuje dostępu do
żadnego magazynu, dopóki administrator lub menedżer właściwego magazynu go nie
przydzieli. Każda instancja musi mieć oddzielną bazę; wiele instancji pozwala
utrzymywać odrębne przestrzenie organizacyjne.

## Historia i logowanie

Historia przedmiotów zachowuje nazwę użytkownika z chwili zdarzenia również po
usunięciu jego konta. Migracja bootstrapu tworzy pustą bazę; istniejące dane
nie są migrowane. Wcześniejsze zmiany nazwy nie są dostępne do odtworzenia.

Użytkownik może w ustawieniach konta włączyć TOTP z aplikacji
uwierzytelniającej, zapisać jednorazowe kody zapasowe i zarządzać swoimi
passkeys. Logowanie hasłem z aktywnym TOTP wymaga kodu z aplikacji albo kodu
zapasowego; passkey jest osobną metodą logowania bez hasła i może być używany,
nawet jeśli TOTP jest włączone. Zaufanie temu urządzeniu jest opcjonalne i
trwa do 30 dni, odnawiane przy kolejnym logowaniu. Administrator może zresetować
czynniki MFA/passkeys użytkownika, co unieważnia jego sesje.

WebAuthn w produkcji wymaga HTTPS i stabilnej domeny. Ustaw
`PASSKEY_RP_ID` na domenę bez schematu ani portu (np. `example.com`),
`PASSKEY_ORIGIN` na dokładny origin aplikacji (np.
`https://inventory.example.com`) oraz `BETTER_AUTH_URL` na ten sam origin.
RP ID musi być hostem originu albo jego nadrzędną domeną. W środowisku lokalnym
domyślne ustawienia używają `http://localhost:3000` i RP ID `localhost`.
Zmiana RP ID uniemożliwi używanie wcześniej zarejestrowanych passkeys.

Przed wdrożeniem w istniejącej instalacji zastosuj migrację
`20261027160000_reset_legacy_two_factor`: resetuje ona stare konfiguracje TOTP,
wyzwania, zaufane urządzenia i sesje użytkowników z `twoFactorEnabled = true`.
Zachowuje istniejące passkeys. Zatrzymaj poprzednią wersję aplikacji, wykonaj
kopię zapasową i zastosuj migrację przed uruchomieniem nowego kodu. Nie
uruchamiaj ponownie tej migracji ręcznie po ponownej aktywacji TOTP.
Nowa instalacja i kolejne wdrożenia korzystają z tej samej historii migracji.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
