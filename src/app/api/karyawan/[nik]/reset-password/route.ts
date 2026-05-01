import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest, context: { params: Promise<{ nik: string }> }) {
  try {
    const decoded = verifyToken(req);
    if (!decoded || (decoded.role !== 'super_admin' && decoded.role !== 'hrd')) {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const { nik } = await context.params;
    const body = (await req.json()) as { new_password: string };
    const { new_password } = body || {};
    if (!new_password || new_password.length < 6) {
      return NextResponse.json({ success: false, message: 'Minimum password adalah 6 karakter' }, { status: 400 });
    }

    const pool = getPool();
    const passwordHash = await bcrypt.hash(new_password, 10);
    const updateRes = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE nik = $2 RETURNING id',
      [passwordHash, nik]
    );
    if (updateRes.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Karyawan tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Password berhasil direset' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
