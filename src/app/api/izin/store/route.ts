import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, unauthorized } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function POST(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload) return unauthorized();

  try {
    const formData = await req.formData();
    const leaveType = formData.get('tipe') as string;
    const startDate = formData.get('dari') as string;
    const endDate = formData.get('sampai') as string;
    const reason = formData.get('keterangan') as string;

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, message: 'Semua field wajib diisi.' }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      `INSERT INTO leave_requests (user_id, start_date, end_date, reason, leave_type, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [payload.id, startDate, endDate, reason, leaveType]
    );

    return NextResponse.json({ success: true, message: 'Pengajuan izin berhasil dikirim.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
