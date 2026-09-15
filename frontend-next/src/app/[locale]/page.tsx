import { headers } from 'next/headers';
import HeroSection from "@/widgets/HomePage/HeroSection";
import HomeSolutionsSection from "@/widgets/HomePage/HomeSolutionsSection";
import TrustMarquee from "@/widgets/HomePage/TrustMarquee";
import InfrastructureSection from "@/widgets/HomePage/InfrastructureSection";
import HomeNewsSection from "@/widgets/HomePage/HomeNewsSection";
import HomeServicesSection from "@/widgets/HomePage/HomeServicesSection";
import PricingTeaserSection from "@/widgets/HomePage/PricingTeaserSection";

const COUNTRY_CURRENCY: Record<string, string> = {
  PL: 'PLN', DE: 'EUR', CZ: 'CZK', ES: 'EUR', FR: 'EUR', IT: 'EUR', NL: 'EUR',
  UA: 'UAH', US: 'USD', GB: 'GBP', CH: 'CHF',
};

const PLAN_PRICES: Record<string, Record<string, number>> = {
  starter: { EUR: 29, PLN: 59, UAH: 399, USD: 39 },
  growth:  { EUR: 39, PLN: 79, UAH: 599, USD: 59 },
  scale:   { EUR: 89, PLN: 199, UAH: 1599, USD: 99 },
};

export default async function HomePage() {
  const headersList = await headers();
  const countryCode = (headersList.get('x-vercel-ip-country') || headersList.get('cf-ipcountry') || 'PL').toUpperCase();
  const currency = COUNTRY_CURRENCY[countryCode] || 'EUR';

  const plans = [
    { id: 'starter', price: PLAN_PRICES.starter[currency] || 39 },
    { id: 'growth',  price: PLAN_PRICES.growth[currency] || 69,  popular: true },
    { id: 'scale',   price: PLAN_PRICES.scale[currency] || 129 },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GoPublica",
    url: "https://gopublica.com",
    logo: "https://gopublica.com/logo.png",
    description: "Custom websites, NFC cards, and video production for businesses. Built on a platform with CRM, booking, and online ordering.",
    sameAs: [
      "https://twitter.com/gopublica",
      "https://linkedin.com/company/gopublica",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroSection />
      <TrustMarquee />
      <HomeServicesSection />
      <HomeSolutionsSection />
      <HomeNewsSection />
      <InfrastructureSection />
      <PricingTeaserSection currency={currency} plans={plans} />
    </>
  );
}