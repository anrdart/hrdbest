import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyToken, unauthorized } from '@/lib/auth';
import { getPool } from '@/lib/db';

function todayJakarta(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
}

function buildQrHmac(branchId: string, date: string): string {
  const secret = process.env.QR_SECRET ?? 'fallback_qr_secret';
  return crypto.createHmac('sha256', secret).update(`${branchId}:${date}`).digest('hex');
}

export async function POST(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const body = (await req.json()) as {
      qr_payload: string;
      latitude?: number;
      longitude?: number;
    };

    const { qr_payload, latitude, longitude } = body;

    if (!qr_payload) {
      return NextResponse.json({ success: false, message: 'QR payload tidak boleh kosong.' }, { status: 400 });
    }

    // Format: PRESENSIQR:{branch_id}:{date}:{hmac}
    const parts = qr_payload.split(':');
    if (parts.length !== 4 || parts[0] !== 'PRESENSIQR') {
      return NextResponse.json({ success: false, message: 'QR code tidak valid.' }, { status: 400 });
    }

    const [, branchId, date, receivedHmac] = parts;
    const today = todayJakarta();

    if (date !== today) {
      return NextResponse.json({ success: false, message: 'QR code sudah kadaluarsa. Minta QR baru dari admin.' }, { status: 400 });
    }

    const expectedHmac = buildQrHmac(branchId, date);

    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(Buffer.from(receivedHmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json({ success: false, message: 'QR code tidak sah.' }, { status: 400 });
    }

    const pool = getPool();

    // Cek absensi hari ini
    const todayRes = await pool.query(
      `SELECT * FROM attendances
       WHERE user_id = $1
         AND DATE(check_in AT TIME ZONE 'Asia/Jakarta') = (NOW() AT TIME ZONE 'Asia/Jakarta')::date`,
      [payload.id]
    );
    const existing = todayRes.rows[0];

    const lat = latitude ?? null;
    const lng = longitude ?? null;

    if (existing) {
      if (existing.check_out) {
        return NextResponse.json({ success: false, message: 'Anda sudah melakukan absen pulang hari ini.' });
      }
      await pool.query(
        'UPDATE attendances SET check_out = NOW(), location_long = $1, updated_at = NOW() WHERE id = $2',
        [lng, existing.id]
      );
      return NextResponse.json({ success: true, message: 'Berhasil absen pulang via QR.', type: 'pulang' });
    }

    // Cek jam masuk dari settings
    const settingsRes = await pool.query("SELECT value FROM settings WHERE key = 'jam_masuk'");
    const jamMasukStr = (settingsRes.rows[0]?.value as string | undefined) ?? '08:00';
    const [jamH, jamM] = jamMasukStr.split(':').map(Number);
    const nowJkt = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const isLate = nowJkt.getHours() > jamH || (nowJkt.getHours() === jamH && nowJkt.getMinutes() > jamM);

    await pool.query(
      `INSERT INTO attendances (user_id, check_in, status, location_lat, location_long)
       VALUES ($1, NOW(), $2, $3, $4)`,
      [payload.id, isLate ? 'late' : 'present', lat, lng]
    );

    return NextResponse.json({ success: true, message: 'Berhasil absen masuk via QR.', type: 'masuk' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
