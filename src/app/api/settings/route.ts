import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
    }

    const pool = getPool();
    const result = await pool.query('SELECT key, value FROM settings ORDER BY key');

    const data: Record<string, string> = {};
    for (const row of result.rows) {
      data[row.key] = row.value;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const decoded = verifyToken(req);
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Token tidak valid.' }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, string>;
    if (!body || typeof body !== 'object' || Object.keys(body).length === 0) {
      return NextResponse.json({ success: false, message: 'Body tidak valid.' }, { status: 400 });
    }

    const pool = getPool();

    for (const [key, value] of Object.entries(body)) {
      if (typeof key !== 'string' || typeof value !== 'string') continue;
      await pool.query(
        `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    }

    return NextResponse.json({ success: true, message: 'Pengaturan berhasil disimpan.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
