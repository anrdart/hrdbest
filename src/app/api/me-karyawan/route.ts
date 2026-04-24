import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const pool = getPool();
    const result = await pool.query('SELECT id, nik, name, email, role, kategori_jabatan, created_at FROM users WHERE id = $1', [payload.id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'User tidak ditemukan.' }, { status: 404 });
    }

    const user = result.rows[0];
    return NextResponse.json({
      success: true,
      data: {
        nik: user.nik,
        nama_karyawan: user.name,
        nama_jabatan: user.kategori_jabatan || 'Staff',
        nama_dept: 'IT Department',
        nama_cabang: 'Pusat',
        kategori_jabatan: user.kategori_jabatan,
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
