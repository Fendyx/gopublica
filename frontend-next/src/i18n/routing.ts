import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de", "pl", "ru", "ua", "es"],
  defaultLocale: "en",
  localePrefix: "always", // было "as-needed"
});