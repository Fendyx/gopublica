import Link from 'next/link';
import { useTranslations } from 'next-intl';

// Добавляем тип медиа и путь к файлу. 
// Для 'food' используем твое видео, для остальных — временные картинки-плейсхолдеры.
const solutions = [
  { 
    key: 'food', 
    href: '/agency-food', 
    mediaType: 'video', 
    mediaSrc: '/videos/food-demo.mp4' 
  },
  { 
    key: 'grooming', 
    href: '/agency-beauty-grooming', 
    mediaType: 'video', 
    mediaSrc: '/videos/grooming-demo.mp4' 
  },
  { 
    key: 'salon', 
    href: '/agency-beauty-salon', 
    mediaType: 'video', 
    mediaSrc: '/videos/beautysalon-demo.mp4' 
  },
  { 
    key: 'other', 
    href: '/agency-other', 
    mediaType: 'image', 
    mediaSrc: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop' 
  },
];

export default function HomeSolutionsSection() {
  const t = useTranslations('home');

  return (
    <section className="py-24 px-6 bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
          {t('solutionsTitle')}
        </h2>
        <p className="text-[var(--text-muted)] max-w-2xl mx-auto text-lg">
          {t('solutionsSubtitle')}
        </p>
      </div>

      {/* Меняем сетку на 1 колонку в мобилке и 2 колонки на десктопе */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {solutions.map(({ key, href, mediaType, mediaSrc }) => (
          <Link
            key={key}
            href={href}
            className="group relative block overflow-hidden rounded-3xl aspect-[4/3] lg:aspect-[16/10] bg-[var(--bg)] border border-[var(--border)] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
          >
            {/* Медиа-слой (видео или фото) */}
            <div className="absolute inset-0 w-full h-full">
              {mediaType === 'video' ? (
                <video 
                  src={mediaSrc} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                />
              ) : (
                <img 
                  src={mediaSrc} 
                  alt={t(`solutions.${key}.title`)} 
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                />
              )}
            </div>

            {/* Градиентный оверлей для читаемости текста */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

            {/* Контент: появляется снизу вверх при наведении */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                {/* Заметь, здесь цвет текста жестко белый, так как фон всегда затемнен градиентом */}
                <h3 className="font-semibold text-2xl md:text-3xl text-white mb-3">
                  {t(`solutions.${key}.title`)}
                </h3>
                <p className="text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-3">
                  {t(`solutions.${key}.desc`)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}