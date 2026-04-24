import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { nik, password } = await req.json();

    if (!nik || !password) {
      return NextResponse.json(
        { success: false, message: 'NIK dan Password wajib diisi.' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { success: false, message: 'Koneksi database (DATABASE_URL) belum diatur di server.' },
        { status: 500 }
      );
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query('SELECT * FROM users WHERE nik = $1', [nik]);
    const user = result.rows[0];

    if (!user) {
      await pool.end();
      return NextResponse.json(
        { success: false, message: 'NIK tidak ditemukan.' },
        { status: 401 }
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordMatch) {
      await pool.end();
      return NextResponse.json(
        { success: false, message: 'Password salah.' },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        nik: user.nik, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '1d' }
    );

    const employeeData = {
      nik: user.nik,
      nama_karyawan: user.name,
      kategori_jabatan: user.kategori_jabatan || 'Staff',
      nama_jabatan: user.kategori_jabatan || 'Staff',
      nama_dept: 'IT Department',
      nama_cabang: 'Pusat'
    };

    await pool.end();

    return NextResponse.json({
      success: true,
      message: 'Login berhasil.',
      token: token,
      employee: employeeData
    });

  } catch (error: unknown) {
    console.error('API Login Error:', error);
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server database.';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

