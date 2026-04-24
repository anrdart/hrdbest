import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM leave_requests WHERE user_id = $1 ORDER BY created_at DESC',
      [payload.id]
    );

    const data = result.rows.map((r: any) => ({
      id: String(r.id),
      tanggal: r.created_at,
      dari: r.start_date,
      sampai: r.end_date,
      keterangan: r.reason,
      status: r.status === 'approved' ? 1 : r.status === 'pending' ? 0 : 2,
      tipe: r.leave_type,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
