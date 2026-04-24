import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const pool = getPool();

    const userResult = await pool.query('SELECT nik, kategori_jabatan FROM users WHERE id = $1', [payload.id]);
    const user = userResult.rows[0];

    const todayResult = await pool.query(
      `SELECT * FROM attendances 
       WHERE user_id = $1 AND DATE(check_in) = CURRENT_DATE`,
      [payload.id]
    );

    const today = todayResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        cek: today ? {
          id: today.id,
          nik: user.nik,
          tanggal: today.check_in,
          jam_in: today.check_in ? new Date(today.check_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null,
          jam_out: today.check_out ? new Date(today.check_out).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null,
          foto_in: today.photo_url,
          foto_out: null,
          lokasi_in: today.location_lat ? `${today.location_lat}, ${today.location_long}` : null,
          lokasi_out: null,
          kode_jadwal: 'REG',
          kode_jam_kerja: 'JK01',
          status: today.status,
        } : null,
        lok_kantor: {
          kode_cabang: 'PST',
          nama_cabang: 'Kantor Pusat',
          lokasi_cabang: '-6.200000, 106.816666',
          radius_cabang: 100,
        },
        jam_kerja: {
          kode_jam_kerja: 'JK01',
          nama_jam_kerja: 'Regular',
          jam_masuk: '08:00',
          jam_pulang: '17:00',
          lintashari: '08:00-17:00',
        },
        jadwal: {
          kode_jadwal: 'REG',
          nama_jadwal: 'Reguler',
          hari: new Date().toLocaleDateString('id-ID', { weekday: 'long' }),
          kode_jam_kerja: 'JK01',
        },
        status_libur: false,
        status_wfh: false,
        status_libur_pengganti: false,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
