import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyToken, unauthorized } from '@/lib/auth';

function todayJakarta(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }); // YYYY-MM-DD
}

function buildQrHmac(branchId: string, date: string): string {
  const secret = process.env.QR_SECRET ?? 'fallback_qr_secret';
  return crypto.createHmac('sha256', secret).update(`${branchId}:${date}`).digest('hex');
}

// Hanya admin/hrd yang boleh generate QR
export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  if (payload.role !== 'super_admin' && payload.role !== 'admin' && payload.role !== 'hrd') {
    return NextResponse.json({ success: false, message: 'Akses ditolak.' }, { status: 403 });
  }

  const branchId = process.env.OFFICE_BRANCH_ID ?? 'PST';
  const today = todayJakarta();
  const hmac = buildQrHmac(branchId, today);
  const qrData = `PRESENSIQR:${branchId}:${today}:${hmac}`;

  // Kadaluarsa tengah malam WIB
  const expiry = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  expiry.setHours(23, 59, 59, 0);

  return NextResponse.json({
    success: true,
    data: {
      qr_data: qrData,
      branch_id: branchId,
      date: today,
      expires_at: expiry.toISOString(),
    },
  });
}
