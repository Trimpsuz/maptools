import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const result = await sql`
      SELECT data FROM states WHERE id = ${id}
    `;

    return NextResponse.json(result[0].data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return NextResponse.json({ error: 'Failed to retrieve state' }, { status: 500 });
  }
}
