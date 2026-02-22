import { NextResponse } from 'next/server';
import { createSession } from '@/lib/api-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Mock auth: accept any credentials
    const user = {
      username,
      displayName: username === 'admin' ? 'Administrator' : username,
      role: 'ADMIN' as string | null,
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
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
