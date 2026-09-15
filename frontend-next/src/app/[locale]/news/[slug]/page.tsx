import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchPublicNewsBySlugServer } from '@/entities/siteNews/api/siteNewsApi';
import type { GoPublicaNews } from '@/entities/siteNews/model/types';
import { resolveI18n } from '@/entities/siteNews/model/types';
import NewsDetailClient from './NewsDetailClient';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const item = await fetchPublicNewsBySlugServer(slug);
    const title = item.seoTitle || resolveI18n(item.title, item.titleI18n, locale);
    const description = item.seoDescription || resolveI18n(item.excerpt, item.excerptI18n, locale) || '';

    return {
      title,
      description,
      alternates: {
        canonical: `https://gopublica.com/${locale}/news/${item.slug}`,
      },
      openGraph: {
        title,
        description,
        url: `https://gopublica.com/${locale}/news/${item.slug}`,
        siteName: 'GoPublica',
        locale,
        type: 'article',
        ...(item.coverImage && { images: [{ url: item.coverImage, width: 1200, height: 630 }] }),
        publishedTime: item.publishedAt || undefined,
        authors: [item.author || 'GoPublica Team'],
      },
      twitter: {
        card: item.coverImage ? 'summary_large_image' : 'summary',
        title,
        description,
        ...(item.coverImage && { images: [item.coverImage] }),
      },
    };
  } catch {
    return { title: 'News – GoPublica' };
  }
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;

  let item: GoPublicaNews;
  try {
    item = await fetchPublicNewsBySlugServer(slug);
  } catch {
    notFound();
  }

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: resolveI18n(item.title, item.titleI18n, locale),
    description: resolveI18n(item.excerpt, item.excerptI18n, locale) || item.seoDescription || '',
    image: item.coverImage || undefined,
    datePublished: item.publishedAt || item.createdAt,
    dateModified: item.updatedAt,
    author: {
      '@type': 'Organization',
      name: item.author || 'GoPublica Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'GoPublica',
      url: 'https://gopublica.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://gopublica.com/${locale}/news/${item.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NewsDetailClient item={item} locale={locale} />
    </>
  );
}
