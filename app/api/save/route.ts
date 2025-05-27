import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const existing = await sql`
      SELECT id FROM states WHERE data = ${data}
    `;

    if (existing.length > 0) {
      return NextResponse.json({ state: existing[0].id });
    }

    let id: string;
    let conflict: boolean;

    do {
      id = uuidv4();
      const check = await sql`
        SELECT 1 FROM states WHERE id = ${id}
      `;
      conflict = check.length > 0;
    } while (conflict);

    await sql`
      INSERT INTO states (id, data) VALUES (${id}, ${data})
    `;

    return NextResponse.json({ state: id });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return NextResponse.json({ error: 'Failed to save state' }, { status: 500 });
  }
}
