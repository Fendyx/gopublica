import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Подключаем наши новые стили
import './PublicGrid.css';

// Импортируем картинки
import portfolio1 from "@/assets/portfolio-1.png";
import portfolio2 from "@/assets/portfolio-2.png";
import portfolio3 from "@/assets/portfolio-3.png";
import portfolio4 from "@/assets/portfolio-4.png";
import portfolio5 from "@/assets/portfolio-5.png";
import portfolio6 from "@/assets/portfolio-6.png";

export default function PublicGrid() {
  const projects = [
    { img: portfolio1, title: "Modern Barbershop in Warsaw", tag: "Barbershop" },
    { img: portfolio2, title: "Fine Dining in Barcelona", tag: "Restaurant" },
    { img: portfolio3, title: "Cocktail Bar in Amsterdam", tag: "Hospitality" },
    { img: portfolio4, title: "Boutique Bakery in Paris", tag: "Bakery" },
    { img: portfolio5, title: "Artisanal Coffee Shop in Berlin", tag: "Cafe" },
    { img: portfolio6, title: "Premium Spa in Milan", tag: "Wellness" }
  ];

  return (
    <section id="work" className="portfolio-section">
      <div className="portfolio-container">
        
        {/* Шапка */}
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

        {/* Сетка */}
        <div className="portfolio-grid">
          {projects.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i % 2 === 0 ? 0 : 0.2 }}
              className="portfolio-card"
            >
              <div className="portfolio-img-wrapper">
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="portfolio-img"
                />
                <div className="portfolio-overlay" />
              </div>
              
              <div className="portfolio-info">
                <span className="portfolio-tag">{item.tag}</span>
                <h3 className="portfolio-card-title">{item.title}</h3>
                <span className="portfolio-link">
                  View Case Study 
                  <ArrowRight className="portfolio-link-icon" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Кнопка для мобильных устройств */}
        <div className="portfolio-mobile-btn">
          <Button variant="outline" size="lg" style={{ width: '100%', borderRadius: '50px' }}>
            View all projects
          </Button>
        </div>

      </div>
    </section>
  );
}