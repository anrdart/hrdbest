import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getPool } from '@/lib/db';

type LeaveRow = {
  id: number;
  user_id: number;
  nik: string;
  nama_karyawan: string;
  role: string;
  start_date: string;
  end_date: string;
  reason: string;
  leave_type: string;
  status: string;
  attachment_url?: string | null;
  created_at: string;
  // include any other fields if present, but we only expose the above
};

export async function GET(req: NextRequest) {
  const payload = verifyToken(req);
  if (!payload || (payload.role !== 'super_admin' && payload.role !== 'hrd')) {
    return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
  }

  try {
    const pool = getPool();

    // Build dynamic filters
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');
    const userIdFilter = url.searchParams.get('user_id');

    const whereClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      whereClauses.push(`lr.status = $${paramIndex++}`);
      values.push(statusFilter);
    }
    if (userIdFilter) {
      whereClauses.push(`lr.user_id = $${paramIndex++}`);
      values.push(Number(userIdFilter));
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `SELECT lr.*, u.nik, u.name as nama_karyawan, u.role 
                   FROM leave_requests lr
                   JOIN users u ON lr.user_id = u.id
                   ${whereSql}
                   ORDER BY lr.created_at DESC`;

    const result = await pool.query(query, values);

    const data: LeaveRow[] = (result.rows || []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      nik: r.nik,
      nama_karyawan: r.nama_karyawan,
      role: r.role,
      start_date: r.start_date,
      end_date: r.end_date,
      reason: r.reason,
      leave_type: r.leave_type,
      status: r.status as string,
      attachment_url: r.attachment_url,
      created_at: r.created_at,
    }));

    // Normalize status to string values stored in DB if needed
    // (The raw query uses lr.status, we mapped above as best effort.)

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
