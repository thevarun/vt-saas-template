'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type UserPreferences = {
  emailNotifications: boolean;
  language: string;
  username: string | null;
};

type UpdatePayload = Partial<Omit<UserPreferences, 'username'>>;

const QUERY_KEY = ['user-preferences'] as const;

// Integration seam: this route does NOT exist in the template yet. A fork
// implements `GET`/`PATCH /api/profile/preferences` reading & writing the
// `user_preferences` table (the server half's columns). Kept as a constant so
// the client hook reads as native and the seam is obvious.
const ENDPOINT = '/api/profile/preferences';

const DEFAULTS: UserPreferences = {
  emailNotifications: true,
  language: 'en',
  username: null,
};

async function fetchPreferences(): Promise<UserPreferences> {
  const response = await fetch(ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load preferences (${response.status})`);
  }

  const json = (await response.json()) as Partial<UserPreferences>;
  return {
    emailNotifications: json.emailNotifications ?? DEFAULTS.emailNotifications,
    language: json.language ?? DEFAULTS.language,
    username: json.username ?? DEFAULTS.username,
  };
}

async function patchPreferences(
  payload: UpdatePayload,
): Promise<UserPreferences> {
  const response = await fetch(ENDPOINT, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(message || `Failed to save preferences (${response.status})`);
  }

  const json = (await response.json()) as Partial<UserPreferences>;
  return {
    emailNotifications: json.emailNotifications ?? DEFAULTS.emailNotifications,
    language: json.language ?? DEFAULTS.language,
    username: json.username ?? DEFAULTS.username,
  };
}

export function useUserPreferences() {
  return useQuery<UserPreferences>({
    queryKey: QUERY_KEY,
    staleTime: 60 * 1000,
    queryFn: fetchPreferences,
  });
}

export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchPreferences,
    onSuccess: (data) => {
      // Optimistically write the canonical result into cache so consumers see
      // the saved value without a refetch round-trip.
      queryClient.setQueryData<UserPreferences>(QUERY_KEY, data);
    },
  });
}
