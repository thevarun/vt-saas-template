import { count, eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { threads } from '@/models/Schema';

/**
 * Determines if a user should see the welcome state on the dashboard.
 *
 * A user is considered "new" and should see the welcome state if:
 * - They have no chat threads (never used the chat feature)
 *
 * @param userId - The user's unique identifier
 * @returns Promise<boolean> - true if user should see welcome state, false otherwise
 */
export async function isNewUser(userId: string): Promise<boolean> {
  try {
    // Check if user has any chat threads
    const threadCount = await db
      .select({ count: count() })
      .from(threads)
      .where(eq(threads.userId, userId));

    // User is "new" if they have no threads
    return threadCount[0]?.count === 0;
  } catch (error) {
    // On error, default to showing regular dashboard
    console.error('Error checking if user is new:', error);
    return false;
  }
}
