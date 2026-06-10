import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Матчим всё, КРОМЕ: api, статики Next.js, файлов с расширениями
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};