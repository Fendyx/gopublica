import { useTranslation } from 'react-i18next';
import PublicGrid from '@/features/portfolio/PublicGrid';
import HeroSection from '@/features/home/HeroSection';
import ServicesSection from '@/features/home/ServicesSection'; // <-- Импортируем наш новый компонент

export default function HomePage() {
  // const { t } = useTranslation();

  return (
    <div>
      <HeroSection />
      
      {/* Portfolio Section */}
      {/* <PublicGrid /> */}

      {/* Services Section */}
      <ServicesSection />
    </div>
  );
}