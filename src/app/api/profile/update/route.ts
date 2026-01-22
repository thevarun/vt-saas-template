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

    const { username, displayName } = await request.json();

    // Validate input
    if (!username || !displayName) {
      return NextResponse.json(
        { error: 'Username and display name are required' },
        { status: 400 },
      );
    }

    // Validate username format
    if (!/^\w+$/.test(username) || username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        { status: 400 },
      );
    }

    // Check if username is already taken by another user
    if (user.user_metadata?.username !== username) {
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();

      if (listError) {
        console.error('Error checking username:', listError);
        return NextResponse.json(
          { error: 'Failed to check username availability' },
          { status: 500 },
        );
      }

      const usernameTaken = users.users.some(
        u => u.id !== user.id && u.user_metadata?.username === username,
      );

      if (usernameTaken) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 },
        );
      }
    }

    // Update user metadata
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        username,
        display_name: displayName,
      },
    });

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
