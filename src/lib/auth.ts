import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: number;
  nik: string;
  role: string;
}

export function verifyToken(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key') as JwtPayload;
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ success: false, message: 'Token tidak valid atau expired.' }, { status: 401 });
}
