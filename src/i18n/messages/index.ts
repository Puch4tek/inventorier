import { commonMessages } from "./common";
import { authMessages } from "./auth";
import { itemMessages } from "./items";
import { organizationMessages } from "./organization";
import { adminMessages } from "./admin";

type SameMessageShape<T> = {
  [K in keyof T]: T[K] extends string ? string : SameMessageShape<T[K]>;
};

const englishMessages = {
  common: commonMessages.en,
  auth: authMessages.en,
  items: itemMessages.en,
  organization: organizationMessages.en,
  admin: adminMessages.en,
} as const;
const polishMessages = {
  common: commonMessages.pl,
  auth: authMessages.pl,
  items: itemMessages.pl,
  organization: organizationMessages.pl,
  admin: adminMessages.pl,
} satisfies SameMessageShape<typeof englishMessages>;

export const messages = {
  en: englishMessages,
  pl: polishMessages,
} as const;
