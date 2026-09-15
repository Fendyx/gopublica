import {
  QrCode,
  CalendarCheck,
  ShoppingBag,
  CalendarClock,
  UserCog,
  Camera,
  Calculator,
  Columns2,
  ImagePlus,
  ShieldCheck,
  Contact,
  Send,
  Briefcase,
  Star,
  ChartColumn,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Статический маппинг: id модуля → иконка Lucide.
 * Обёрнут в Map, чтобы быстро искать по id и легко расширять.
 */
export const solutionIcons: ReadonlyMap<string, LucideIcon> = new Map<
  string,
  LucideIcon
>([
  ['qr-menu', QrCode],
  ['reservations', CalendarCheck],
  ['online-ordering', ShoppingBag],
  ['appointments', CalendarClock],
  ['staff-management', UserCog],
  ['portfolio', Camera],
  ['quote-estimator', Calculator],
  ['before-after', Columns2],
  ['service-request', ImagePlus],
  ['data-compliance', ShieldCheck],
  ['client-crm', Contact],
  ['telegram-bot', Send],
  ['careers', Briefcase],
  ['review-booster', Star],
  ['analytics', ChartColumn],
]);

/** Безопасный геттер: если для id нет иконки — вернёт undefined. */
export function getSolutionIcon(id: string): LucideIcon | undefined {
  return solutionIcons.get(id);
}
