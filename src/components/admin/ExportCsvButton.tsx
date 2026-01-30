'use client';

import { Download } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type ExportCsvButtonProps = {
  type?: string;
  status?: string;
};

/**
 * ExportCsvButton Component
 * Downloads feedback data as CSV with current filter context.
 */
export function ExportCsvButton({ type, status }: ExportCsvButtonProps) {
  const t = useTranslations('Admin.Feedback');
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (type) {
        params.set('type', type);
      }
      if (status) {
        params.set('status', status);
      }

      const url = `/api/admin/feedback/export${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";\n]+)"?/);
      const filename = (match?.[1] || 'feedback.csv').replace(/[^\w.-]/g, '_');
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast({ title: t('export.success') });
    } catch {
      toast({ title: t('export.error'), variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      data-testid="export-csv-btn"
    >
      <Download className="mr-2 size-4" />
      {isExporting ? t('export.exporting') : t('export.button')}
    </Button>
  );
}
