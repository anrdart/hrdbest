import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  return NextResponse.json({
    success: true,
    data: [],
    summary: { total_sisa: 0 },
  });
}
