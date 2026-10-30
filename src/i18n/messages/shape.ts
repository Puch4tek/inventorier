export type WidenMessages<T> = T extends string
  ? string
  : { readonly [K in keyof T]: WidenMessages<T[K]> };
