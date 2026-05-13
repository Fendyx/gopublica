import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { portfolioApi } from '@/features/portfolio/api/portfolioApi';
import type { PortfolioCase } from '@/entities/case/types';
import './PublicGrid.css';

export default function PublicGrid() {
  const [cases, setCases] = useState<PortfolioCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portfolioApi.getAll()
      .then(setCases)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="portfolio-section">
        <div className="portfolio-container">
          <div style={{ textAlign: 'center', padding: '80px' }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="work" className="portfolio-section">
      <div className="portfolio-container">
        
        <div className="portfolio-header">
          <div className="portfolio-title-wrapper">
            <h2 className="portfolio-title">Selected Work</h2>
            <p className="portfolio-subtitle">
              Digital experiences crafted with precision for local brands that demand the best.
            </p>
          </div>
          <Button variant="ghost" className="portfolio-header-btn">
            View all projects
            <ArrowUpRight />
          </Button>
        </div>

        <div className="portfolio-grid">
          {cases.map((item, i) => (
            <motion.a
              key={item._id}
              href={`/case/${item.slug}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i % 2 === 0 ? 0 : 0.2 }}
              className="portfolio-card"
            >
              <div className="portfolio-img-wrapper">
                <img 
                  src={item.primaryImage?.url || item.heroImages[0]?.url} 
                  alt={item.title} 
                  className="portfolio-img"
                />
                <div className="portfolio-overlay" />
              </div>
              
              <div className="portfolio-info">
                <span className="portfolio-tag">{item.niche}</span>
                <h3 className="portfolio-card-title">{item.title}</h3>
                <span className="portfolio-link">
                  View Case Study 
                  <ArrowRight className="portfolio-link-icon" />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
        
        <div className="portfolio-mobile-btn">
          <Button variant="outline" size="lg">
            View all projects
          </Button>
        </div>

      </div>
    </section>
  );
}