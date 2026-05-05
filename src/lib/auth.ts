import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getCloudflareContext } from '@opennextjs/cloudflare';

interface JwtPayload {
  id: number;
  nik: string;
  role: string;
}

function resolveJwtSecret(): string {
  try {
    const env = getCloudflareContext().env as { JWT_SECRET?: string };
    if (env?.JWT_SECRET) return env.JWT_SECRET;
  } catch {
    // not in Cloudflare runtime
  }
  return process.env.JWT_SECRET || 'fallback_secret_key';
}

export function verifyToken(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    return jwt.verify(token, resolveJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ success: false, message: 'Token tidak valid atau expired.' }, { status: 401 });
}
