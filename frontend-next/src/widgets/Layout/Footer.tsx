import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <Link
              href="/"
              className="text-xl font-bold text-[var(--text)]"
            >
              GoPublica
            </Link>
            <p className="text-sm text-[var(--text-muted)] mt-4 max-w-xs">
              {t("description")}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">
              {t("links.title")}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                >
                  {t("links.home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                >
                  {t("links.pricing")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">
              {t("legal.title")}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                >
                  {t("legal.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                >
                  {t("legal.privacy")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">
              {t("contacts.title")}
            </h4>
            <p className="text-sm text-[var(--text-muted)]">
              {t("contacts.email")}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              {t("contacts.location")}
            </p>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6 text-center text-sm text-[var(--text-muted)]">
          &copy; {currentYear} GoPublica. {t("rights")}
        </div>
      </div>
    </footer>
  );
}