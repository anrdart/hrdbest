import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import { getPool } from '@/lib/db';

// POST — simpan/update FCM device token
export async function POST(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const body = (await req.json()) as { token: string; platform?: string };

    if (!body.token) {
      return NextResponse.json({ success: false, message: 'FCM token tidak boleh kosong.' }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      `INSERT INTO fcm_tokens (user_id, token, platform, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET token = $2, platform = $3, updated_at = NOW()`,
      [payload.id, body.token, body.platform ?? 'android']
    );

    return NextResponse.json({ success: true, message: 'FCM token berhasil disimpan.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

// DELETE — hapus token saat logout
export async function DELETE(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const pool = getPool();
    await pool.query('DELETE FROM fcm_tokens WHERE user_id = $1', [payload.id]);
    return NextResponse.json({ success: true, message: 'FCM token dihapus.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
