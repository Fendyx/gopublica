import React from 'react';
import { useTranslation } from 'react-i18next';
// Картинки оставляем те же, они отлично подойдут как заглушки,
// пока ты не добавишь реальные фото ресторанов и салонов.
import imgBarbershop from '@/assets/portfolio-1.png';
import imgRestaurant from '@/assets/portfolio-2.png';
import imgBeautySalon from '@/assets/portfolio-6.png';

import './ServicesSection.css';

export default function ServicesSection() {
  const { t } = useTranslation(); // Подключаем переводы

  // Массив внутри компонента, чтобы t() срабатывал при смене языка
  const services = [
    { 
      title: t('services.items.restaurants.title'), 
      desc: t('services.items.restaurants.desc'),
      image: imgRestaurant 
    },
    { 
      title: t('services.items.barbershops.title'), 
      desc: t('services.items.barbershops.desc'),
      image: imgBarbershop 
    },
    { 
      title: t('services.items.beautySalons.title'), 
      desc: t('services.items.beautySalons.desc'),
      image: imgBeautySalon 
    },
  ];

  return (
    <section className="ses-section">
      <div className="ses-container">
        <h2 className="ses-title">{t('services.mainTitle')}</h2>

        <div className="ses-grid">
          {services.map(({ title, desc, image }, index) => (
            <div key={index} className="ses-card">
              <div className="ses-image-wrapper">
                <img src={image} alt={title} className="ses-image" />
              </div>

              <div className="ses-content">
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}