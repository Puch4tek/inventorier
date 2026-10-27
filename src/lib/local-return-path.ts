export function localReturnPath(value: FormDataEntryValue | string | null | undefined): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) return "/dashboard";

  const url = new URL(value, "http://localhost");
  if (url.origin !== "http://localhost") return "/dashboard";
  return `${url.pathname}${url.search}${url.hash}`;
}
