import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // ✅ Нужно await!
  const requested = await requestLocale;

  const locale = (
    requested && routing.locales.includes(requested as any)
      ? requested
      : routing.defaultLocale
  ) as string;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});