import { getTranslations } from 'next-intl/server';

import { EmailTestForm } from '@/components/admin/EmailTestForm';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function EmailTestingPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'Admin.Email' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>{t('testEmail')}</CardTitle>
          <CardDescription>{t('testEmailDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmailTestForm />
        </CardContent>
      </Card>
    </div>
  );
}
