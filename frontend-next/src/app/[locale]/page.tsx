import HeroSection from "@/widgets/HomePage/HeroSection";
import HeroSectionV2 from "@/widgets/HomePage/HeroSectionV2";
import HomeSolutionsSection from "@/widgets/HomePage/HomeSolutionsSection";
import TrustMarquee from "@/widgets/HomePage/TrustMarquee";

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GoPublica",
    url: "https://gopublica.com",
    logo: "https://gopublica.com/logo.png",
    description: "SaaS for business digitalization",
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
      <HeroSectionV2 />
      <TrustMarquee />
      <HomeSolutionsSection />
    </>
  );
}