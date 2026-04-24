import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function POST(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const { lokasi, statuspresensi, image } = await req.json();

    if (!statuspresensi || !['masuk', 'pulang'].includes(statuspresensi)) {
      return NextResponse.json({ success: false, message: 'Status presensi tidak valid.' }, { status: 400 });
    }

    const pool = getPool();

    const today = await pool.query(
      `SELECT * FROM attendances 
       WHERE user_id = $1 AND DATE(check_in) = CURRENT_DATE`,
      [payload.id]
    );

    const existing = today.rows[0];
    const now = new Date();
    const coords = (lokasi || '').split(',').map(Number);
    const lat = coords[0] || null;
    const long = coords[1] || null;

    if (existing) {
      if (statuspresensi === 'pulang') {
        await pool.query(
          'UPDATE attendances SET check_out = NOW(), location_long = $1, photo_url = COALESCE($2, photo_url) WHERE id = $3',
          [long, image, existing.id]
        );
        return NextResponse.json({ success: true, message: 'Berhasil melakukan absen pulang.', type: 'pulang' });
      }
      return NextResponse.json({ success: false, message: 'Anda sudah melakukan absen masuk hari ini.' });
    }

    const checkInHour = now.getHours();
    const status = checkInHour >= 8 ? 'late' : 'present';

    await pool.query(
      `INSERT INTO attendances (user_id, check_in, status, location_lat, location_long, photo_url)
       VALUES ($1, NOW(), $2, $3, $4, $5)`,
      [payload.id, status, lat, long, image]
    );

    return NextResponse.json({ success: true, message: 'Berhasil melakukan absen masuk.', type: 'masuk' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
