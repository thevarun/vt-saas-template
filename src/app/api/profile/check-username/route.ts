import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createClient } from '@/libs/supabase/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { username } = await request.json();

    // Validate username format
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Invalid username' },
        { status: 400 },
      );
    }

    // Check if it's the user's current username
    if (user.user_metadata?.username === username) {
      return NextResponse.json({ available: true });
    }

    // Query Supabase to check if username exists
    // Since we're storing username in user_metadata, we need to check all users
    // This is a basic implementation - for production, consider using a dedicated users table
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error checking username:', error);
      return NextResponse.json(
        { error: 'Failed to check username availability' },
        { status: 500 },
      );
    }

    // Check if username is taken by another user
    const usernameTaken = users.users.some(
      u => u.id !== user.id && u.user_metadata?.username === username,
    );

    return NextResponse.json({ available: !usernameTaken });
  } catch (error) {
    console.error('Username check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
