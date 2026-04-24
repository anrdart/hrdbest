import { NextResponse } from 'next/server';
import { Pool } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL is not set' }, { status: 500 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT id, nik, name, password_hash FROM users');
    await pool.end();

    console.log("====== DATA USERS DI DATABASE ======");
    console.log(result.rows);
    console.log("====================================");

    return NextResponse.json({ 
      success: true, 
      count: result.rows.length, 
      users: result.rows.map(u => ({ id: u.id, nik: u.nik, name: u.name, hash: u.password_hash })) 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL is not set' }, { status: 500 });
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const hash = await bcrypt.hash('password123', 10);
    
    await pool.query('UPDATE users SET password_hash = $1', [hash]);
    await pool.query('ALTER TABLE attendances ALTER COLUMN photo_url TYPE TEXT');
    await pool.query('ALTER TABLE leave_requests ALTER COLUMN attachment_url TYPE TEXT');

    await pool.query(`
      INSERT INTO users (nik, name, email, password_hash, role, kategori_jabatan) VALUES
      ('HRD001', 'Rina Wulandari', 'hrd@presensi.local', $1, 'hrd', 'HRD'),
      ('MGR001', 'Ahmad Fauzi', 'manager@presensi.local', $1, 'manager', 'Manager'),
      ('SA001', 'Super Administrator', 'superadmin@presensi.local', $1, 'super_admin', NULL)
      ON CONFLICT (nik) DO NOTHING
    `, [hash]);

    const result = await pool.query('SELECT id, nik, name FROM users');
    await pool.end();

    return NextResponse.json({ success: true, message: 'All passwords updated successfully', users: result.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


