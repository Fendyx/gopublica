import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (
    requestLocale && routing.locales.includes(requestLocale as any)
      ? requestLocale
      : routing.defaultLocale
  ) as string;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});