import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT id, nik, name, email, role, kategori_jabatan, created_at FROM users ORDER BY id');
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authorization: only super_admin and hrd can create karyawan
    const decoded = verifyToken(req);
    if (!decoded || (decoded.role !== 'super_admin' && decoded.role !== 'hrd')) {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const body = (await req.json()) as {
      nik: string;
      name: string;
      email: string;
      password: string;
      role?: string;
      kategori_jabatan?: string;
    };

    const { nik, name, email, password, role = 'employee', kategori_jabatan } = body || {};
    if (!nik || !name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password terlalu pendek' }, { status: 400 });
    }

    const pool = getPool();
    const existingNik = await pool.query('SELECT id FROM users WHERE nik = $1', [nik]);
    if (existingNik.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'NIK sudah terdaftar' }, { status: 400 });
    }
    const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return NextResponse.json({ success: false, message: 'Email sudah terdaftar' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const insertRes = await pool.query(
      'INSERT INTO users (nik, name, email, password_hash, role, kategori_jabatan) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nik, name, email, role, kategori_jabatan',
      [nik, name, email, passwordHash, role, kategori_jabatan]
    );
    const user = insertRes.rows[0];
    return NextResponse.json({ success: true, message: 'Karyawan berhasil ditambahkan', data: user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
