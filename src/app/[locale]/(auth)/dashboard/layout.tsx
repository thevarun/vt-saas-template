import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50/50 p-4 dark:bg-slate-950 md:p-8 lg:p-12">
      <div className="mx-auto max-w-screen-xl">
        {props.children}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
