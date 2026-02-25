import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/api-store';
import { getAppUserByEmail, isSupabaseConfigured } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Authentication is not configured' },
        { status: 503 }
      );
    }

    const row = await getAppUserByEmail(email);
    if (!row) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = {
      username: row.email,
      displayName: row.display_name ?? row.email,
      role: row.role,
    };
    const { token, refreshToken } = createSession(user);

    return NextResponse.json({
      token,
      refreshToken,
      user: {
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
