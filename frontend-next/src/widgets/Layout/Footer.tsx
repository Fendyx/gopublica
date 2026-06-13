import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SiInstagram, SiTiktok, SiTelegram, SiYoutube } from 'react-icons/si';
import { solutions } from '@/content/solutions/modules';

export default async function Footer() {
  const t = await getTranslations();

  const currentYear = new Date().getFullYear();

  // Группируем модули по категориям
  const foodModules = solutions.filter((m) => m.category === 'food');
  const beautyModules = solutions.filter((m) => m.category === 'beauty');
  const autoModules = solutions.filter((m) => m.category === 'auto');

  const socialLinks = [
    { href: 'https://instagram.com/gopublica', icon: SiInstagram, label: t('footer.socialAriaLabels.instagram') },
    { href: 'https://tiktok.com/@gopublica', icon: SiTiktok, label: t('footer.socialAriaLabels.tiktok') },
    { href: 'https://t.me/gopublica', icon: SiTelegram, label: t('footer.socialAriaLabels.telegram') },
    { href: 'https://youtube.com/@gopublica', icon: SiYoutube, label: t('footer.socialAriaLabels.youtube') },
  ];

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] mt-auto">
      <div className="max-w-7xl mx-auto py-16 px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Колонка 1: Бренд */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-[var(--text)]">
              GoPublica
            </Link>
            <p className="text-sm text-[var(--text-muted)] mt-4 leading-relaxed max-w-xs">
              {t('footer.description')}
            </p>
          </div>

          {/* Колонка 2: Restaurants */}
          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">
              {t('solutions.categories.food')}
            </h4>
            <ul className="space-y-2">
              {foodModules.map((mod) => (
                <li key={mod.id}>
                  <Link
                    href={`/solutions/${mod.slug}`}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                  >
                    {t(`solutions.modules.${mod.id}.title` as any)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Колонка 3: Beauty */}
          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">
              {t('solutions.categories.beauty')}
            </h4>
            <ul className="space-y-2">
              {beautyModules.map((mod) => (
                <li key={mod.id}>
                  <Link
                    href={`/solutions/${mod.slug}`}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                  >
                    {t(`solutions.modules.${mod.id}.title` as any)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Колонка 4: Auto */}
          <div>
            <h4 className="font-semibold text-[var(--text)] mb-4">
              {t('solutions.categories.auto')}
            </h4>
            <ul className="space-y-2">
              {autoModules.map((mod) => (
                <li key={mod.id}>
                  <Link
                    href={`/solutions/${mod.slug}`}
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                  >
                    {t(`solutions.modules.${mod.id}.title` as any)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Колонка 5: Company + Legal + Contact + Social */}
          <div className="flex flex-col gap-6">
            <div>
              <h4 className="font-semibold text-[var(--text)] mb-4">
                {t('footer.companyTitle')}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/solutions"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                  >
                    {t('footer.solutionsOverview')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/presentation"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                  >
                    {t('footer.howItWorks')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                  >
                    {t('footer.pricing')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                  >
                    {t('footer.contact')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-[var(--text)] mb-4">
                {t('footer.legalTitle')}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                  >
                    {t('footer.terms')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                  >
                    {t('footer.privacy')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm text-[var(--text-muted)]">
                {t('footer.email')}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                {t('footer.location')}
              </p>
              <div className="flex gap-3 mt-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--text-muted)]">
          &copy; {currentYear} GoPublica. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}