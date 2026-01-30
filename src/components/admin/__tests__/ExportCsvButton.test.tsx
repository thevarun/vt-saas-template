import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ExportCsvButton } from '../ExportCsvButton';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => {
      const translations: Record<string, string> = {
        'export.button': 'Export CSV',
        'export.exporting': 'Exporting...',
        'export.success': 'CSV exported successfully',
        'export.error': 'Failed to export CSV',
      };
      return translations[key] || key;
    };
    return t;
  },
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('ExportCsvButton', () => {
  it('renders the export button', () => {
    render(<ExportCsvButton />);

    expect(screen.getByTestId('export-csv-btn')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('renders with filter props', () => {
    render(<ExportCsvButton type="bug" status="pending" />);

    expect(screen.getByTestId('export-csv-btn')).toBeInTheDocument();
  });
});
