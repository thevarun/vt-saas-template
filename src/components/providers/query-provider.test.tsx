import { useQuery } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QueryProvider } from './query-provider';

function Consumer() {
  const { data } = useQuery({
    queryKey: ['probe'],
    queryFn: () => Promise.resolve('ok'),
  });
  return <span>{data ?? 'loading'}</span>;
}

describe('QueryProvider', () => {
  it('provides a QueryClient so child useQuery does not throw', async () => {
    render(
      <QueryProvider>
        <Consumer />
      </QueryProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('ok')).toBeInTheDocument();
    });
  });
});
