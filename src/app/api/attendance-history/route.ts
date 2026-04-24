import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const bulan = searchParams.get('bulan');
    const tahun = searchParams.get('tahun');

    const now = new Date();
    const month = bulan ? parseInt(bulan) : now.getMonth() + 1;
    const year = tahun ? parseInt(tahun) : now.getFullYear();

    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        TO_CHAR(a.check_in, 'YYYY-MM-DD') as tanggal, 
        TO_CHAR(a.check_in, 'Day') as hari,
        TO_CHAR(a.check_in AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') as jam_in,
        TO_CHAR(a.check_out AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') as jam_out,
        a.status,
        0 as terlambat_min,
        0 as pulang_cepat_min,
        0 as denda,
        CASE a.status 
          WHEN 'present' THEN 'Hadir'
          WHEN 'late' THEN 'Terlambat'
          WHEN 'absent' THEN 'Tidak Hadir'
          WHEN 'izin' THEN 'Izin'
          WHEN 'sakit' THEN 'Sakit'
          ELSE a.status
        END as keterangan
      FROM attendances a
      WHERE a.user_id = $1 
        AND EXTRACT(MONTH FROM a.check_in) = $2 
        AND EXTRACT(YEAR FROM a.check_in) = $3
      ORDER BY a.check_in DESC`,
      [payload.id, month, year]
    );

    return NextResponse.json({
      success: true,
      data: result.rows
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
