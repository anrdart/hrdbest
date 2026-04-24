import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  const now = new Date();
  const months: { month: number; month_name: string; year: number }[] = [];

  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: d.getMonth() + 1,
      month_name: d.toLocaleDateString('id-ID', { month: 'long' }),
      year: d.getFullYear(),
    });
  }

  return NextResponse.json({ success: true, data: months });
}
