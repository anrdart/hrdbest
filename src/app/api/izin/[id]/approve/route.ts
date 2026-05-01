import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getPool } from '@/lib/db';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = verifyToken(req);
  if (!payload || (payload.role !== 'super_admin' && payload.role !== 'hrd')) {
    return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
  }

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ success: false, message: 'ID tidak valid' }, { status: 400 });
  }

  try {
    const pool = getPool();
    await pool.query('UPDATE leave_requests SET status = $1, updated_at = NOW() WHERE id = $2', ['approved', id]);
    return NextResponse.json({ success: true, message: 'Pengajuan izin disetujui' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
