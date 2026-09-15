import LegalSidebar from '@/widgets/LegalSidebar/LegalSidebar';
import LegalSearch from '@/widgets/LegalSearch/LegalSearch';

export default function LegalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <div className="min-h-[60vh] bg-[var(--bg)] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Search bar — visible on all screen sizes */}
        <div className="mb-8 flex justify-center">
          <LegalSearchWrapper params={params} />
        </div>
        <div className="flex gap-10">
          <LegalSidebar />
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

async function LegalSearchWrapper({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LegalSearch locale={locale} />;
}
