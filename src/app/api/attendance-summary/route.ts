import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const pool = getPool();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status IN ('present', 'late') THEN 1 END) as hadir,
        COUNT(CASE WHEN status IN ('izin', 'sakit') THEN 1 END) as izin,
        12 as sisa_cuti
      FROM attendances
      WHERE user_id = $1 
        AND EXTRACT(MONTH FROM check_in) = $2 
        AND EXTRACT(YEAR FROM check_in) = $3`,
      [payload.id, month, year]
    );

    const row = result.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        hadir: parseInt(row.hadir) || 0,
        izin: parseInt(row.izin) || 0,
        sisa_cuti: parseInt(row.sisa_cuti) || 12,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
