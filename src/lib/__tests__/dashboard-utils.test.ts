import { describe, expect, it, vi } from 'vitest';

import { db } from '@/libs/DB';

import { isNewUser } from '../dashboard-utils';

// Mock the database
vi.mock('@/libs/DB', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('isNewUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when user has no threads', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ count: 0 }]),
    });

    vi.mocked(db.select).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await isNewUser('user-123');

    expect(result).toBe(true);
  });

  it('returns false when user has threads', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ count: 5 }]),
    });

    vi.mocked(db.select).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await isNewUser('user-123');

    expect(result).toBe(false);
  });

  it('returns false on database error', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error('Database error')),
    });

    vi.mocked(db.select).mockReturnValue({
      from: mockFrom,
    } as any);

    // Suppress console.error for this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await isNewUser('user-123');

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error checking if user is new:',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('handles edge case when count is undefined', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{}]),
    });

    vi.mocked(db.select).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await isNewUser('user-123');

    // When count is undefined, the comparison will be undefined === 0 which is false
    expect(result).toBe(false);
  });

  it('handles empty result array', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });

    vi.mocked(db.select).mockReturnValue({
      from: mockFrom,
    } as any);

    const result = await isNewUser('user-123');

    // Empty array means threadCount[0] is undefined, so count is undefined
    expect(result).toBe(false);
  });
});
