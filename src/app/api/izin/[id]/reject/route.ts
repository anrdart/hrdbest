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
    let note: string | null = null;

    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body === 'object' && 'note' in body) {
        note = (body as any).note ?? null;
      }
    } catch {
      // ignore JSON parse errors, note will stay null
    }

    await pool.query('UPDATE leave_requests SET status = $1, note = $2, updated_at = NOW() WHERE id = $3', ['rejected', note, id]);
    return NextResponse.json({ success: true, message: 'Pengajuan izin ditolak' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
