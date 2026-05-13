import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, ExternalLink, Loader2 } from 'lucide-react';
import { portfolioApi } from '@/features/portfolio/api/portfolioApi';
import type { PortfolioCase } from '@/entities/case/types';
import './CaseDetailPage.css';

export default function CaseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [caseData, setCaseData] = useState<PortfolioCase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    portfolioApi.getBySlug(slug)
      .then(setCaseData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="case-loading">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  if (!caseData) return <div>Case not found</div>;

  return (
    <article className="case-study">
      {/* Hero с паралакс-эффектом */}
      <section className="case-hero">
        <div className="case-hero-image" style={{ backgroundImage: `url(${caseData.primaryImage?.url})` }} />
        <div className="case-hero-content">
          <span className="case-niche">{caseData.niche}</span>
          <h1>{caseData.title}</h1>
          <p className="case-short-desc">{caseData.shortDescription}</p>
          <div className="case-hero-actions">
            {/* Внешняя ссылка: используем <a> с классами кнопки */}
            <a 
              href={caseData.liveUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-default btn-lg btn-active case-hero-btn"
            >
              Visit Site <ExternalLink size={16} />
            </a>
            
            {/* Внутренняя ссылка: используем <Link> с классами кнопки */}
            <Link 
              to="/contact"
              className="btn btn-outline btn-lg btn-active case-hero-btn"
            >
              Order Similar
            </Link>
          </div>
        </div>
      </section>

      {/* Контент наезжает на изображение */}
      <div className="case-content-wrapper">
        <section className="case-section">
          <h2>Challenge & Solution</h2>
          <div className="case-grid-2">
            <div><strong>Problem:</strong> {caseData.challenge}</div>
            <div><strong>Solution:</strong> {caseData.solution}</div>
          </div>
        </section>

        <section className="case-section">
          <h2>Business Impact</h2>
          <div className="case-metrics">
            {caseData.metrics.map((m, i) => (
              <div key={i} className="case-metric-card">
                <span className="case-metric-value">{m.value}</span>
                <span className="case-metric-label">{m.label}</span>
                {m.description && <small>{m.description}</small>}
              </div>
            ))}
          </div>
        </section>

        <section className="case-section">
          <h2>Features → Business Value</h2>
          <ul className="case-features">
            {caseData.features.map((f, i) => (
              <li key={i}>
                <strong>{f.feature}</strong> → {f.benefit}
              </li>
            ))}
          </ul>
        </section>

        <section className="case-section">
          <h2>Visual Gallery</h2>
          <div className="case-gallery">
            {caseData.gallery.map((g, i) => (
              <img key={i} src={g.url} alt={g.caption || ''} className={g.isMobileView ? 'mobile-mockup' : ''} />
            ))}
          </div>
        </section>

        <section className="case-section">
          <h2>Tech Stack</h2>
          <div className="case-tech">
            {caseData.techStack.map((t, i) => (
              <span key={i} className="case-tech-badge">{t.name}</span>
            ))}
          </div>
        </section>

        {caseData.pricing.showPrice && (
          <section className="case-section case-pricing">
            <h2>Estimated Cost</h2>
            <div className="case-price-card">
              {caseData.pricing.range?.min && caseData.pricing.range?.max ? (
                <>
                  <span className="case-price-range">
                    {caseData.pricing.range.min}–{caseData.pricing.range.max} {caseData.pricing.currency}
                  </span>
                  <small>Similar project scope</small>
                </>
              ) : (
                <span>Contact for quote</span>
              )}
            </div>
          </section>
        )}

        <section className="case-cta">
          <h2>Want a site like this?</h2>
          <Link to="/contact" className="btn btn-default btn-lg btn-active">
            Start Your Project
          </Link>
        </section>
      </div>
    </article>
  );
}