import type { SupabaseClient } from '@supabase/supabase-js';

// Type matching the health_companion.threads table (snake_case from DB)
export type Thread = {
  id: string;
  user_id: string;
  conversation_id: string;
  title: string | null;
  last_message_preview: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

// Input types for create/update operations
export type CreateThreadInput = {
  conversation_id: string;
  title?: string | null;
  last_message_preview?: string | null;
  archived?: boolean;
};

export type UpdateThreadInput = {
  title?: string;
  last_message_preview?: string;
  archived?: boolean;
};

const THREADS_TABLE = 'threads';
const THREADS_SCHEMA = 'health_companion';

/**
 * Get all threads for the authenticated user (ordered by updated_at DESC)
 * RLS policy ensures only user's own threads are returned
 */
export async function getThreads(
  supabase: SupabaseClient,
): Promise<{ data: Thread[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .schema(THREADS_SCHEMA)
    .from(THREADS_TABLE)
    .select('*')
    .order('updated_at', { ascending: false });

  return { data, error };
}

/**
 * Get a single thread by ID
 * RLS policy ensures only user's own thread is returned
 */
export async function getThreadById(
  supabase: SupabaseClient,
  id: string,
): Promise<{ data: Thread | null; error: Error | null }> {
  const { data, error } = await supabase
    .schema(THREADS_SCHEMA)
    .from(THREADS_TABLE)
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Get a thread by conversation_id
 * RLS policy ensures only user's own thread is returned
 */
export async function getThreadByConversationId(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<{ data: Thread | null; error: Error | null }> {
  const { data, error } = await supabase
    .schema(THREADS_SCHEMA)
    .from(THREADS_TABLE)
    .select('*')
    .eq('conversation_id', conversationId)
    .maybeSingle();

  return { data, error };
}

/**
 * Create a new thread
 * RLS policy ensures user_id matches auth.uid()
 */
export async function createThread(
  supabase: SupabaseClient,
  userId: string,
  input: CreateThreadInput,
): Promise<{ data: Thread | null; error: Error | null }> {
  const { data, error } = await supabase
    .schema(THREADS_SCHEMA)
    .from(THREADS_TABLE)
    .insert({
      user_id: userId,
      conversation_id: input.conversation_id,
      title: input.title ?? null,
      last_message_preview: input.last_message_preview ?? null,
      archived: input.archived ?? false,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update a thread by ID
 * RLS policy ensures only user's own thread can be updated
 */
export async function updateThread(
  supabase: SupabaseClient,
  id: string,
  input: UpdateThreadInput,
): Promise<{ data: Thread | null; error: Error | null }> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    updateData.title = input.title;
  }
  if (input.last_message_preview !== undefined) {
    updateData.last_message_preview = input.last_message_preview;
  }
  if (input.archived !== undefined) {
    updateData.archived = input.archived;
  }

  const { data, error } = await supabase
    .schema(THREADS_SCHEMA)
    .from(THREADS_TABLE)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a thread by ID
 * RLS policy ensures only user's own thread can be deleted
 */
export async function deleteThread(
  supabase: SupabaseClient,
  id: string,
): Promise<{ data: Thread | null; error: Error | null }> {
  const { data, error } = await supabase
    .schema(THREADS_SCHEMA)
    .from(THREADS_TABLE)
    .delete()
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}
