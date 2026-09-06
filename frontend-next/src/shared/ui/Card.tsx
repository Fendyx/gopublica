import { cn } from '@/shared/lib/utils';

export function Card({ className, premium, hover, ...props }: React.HTMLAttributes<HTMLDivElement> & { premium?: boolean; hover?: boolean }) {
  return (
    <div
      className={cn(
        'border border-[var(--border)] bg-[var(--surface)]',
        premium ? 'rounded-3xl p-8' : 'rounded-2xl p-6 shadow-sm',
        premium && 'shadow-[var(--shadow-card)]',
        hover && 'transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5',
        className
      )}
      {...props}
    />
  );
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold', className)} {...props} />;
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-[var(--text-muted)]', className)} {...props} />;
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}