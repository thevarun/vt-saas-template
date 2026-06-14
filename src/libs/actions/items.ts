'use server';

import type { ActionResult } from '@/libs/actions/types';

/**
 * STUB server actions for the generic `item` entity — the integration seam.
 *
 * This file exists so the data-layer exemplars (`use-item-mutations.ts`) compile
 * and run end-to-end against a real `ActionResult` contract. A fork DELETES this
 * file and points the wrapper hook at its real actions (which read/write a real
 * table). The stubs intentionally do nothing but return success.
 *
 * Server Actions must return `ActionResult<T>` per the architecture rules — the
 * stubs honour that so the calling convention is demonstrated correctly.
 */

export type CreateItemInput = { name: string; description?: string | null };

export async function createItem(
  _input: CreateItemInput,
): Promise<ActionResult<{ id: string }>> {
  return { data: { id: 'stub' }, error: null };
}

export async function deleteItem(
  _id: string,
): Promise<ActionResult<{ id: string }>> {
  return { data: { id: 'stub' }, error: null };
}
