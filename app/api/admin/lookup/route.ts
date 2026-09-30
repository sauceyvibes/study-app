import { NextResponse } from 'next/server';
import { CORPUS } from '@/atlas/corpus';
import { isCollection } from '@/admin/schema';

/**
 * Search the corpus bundled into this deployment, to find an id to reference or
 * an existing entry to start from. `?q=` returns matches; `?id=` returns one
 * entry whole, ready to load into the form as an override.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const collection = params.get('collection');
  if (!isCollection(collection)) return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });
  const entries = CORPUS[collection] as unknown as { id: string; name: string; aliases?: string[] }[];

  const id = params.get('id');
  if (id) {
    const entry = entries.find((e) => e.id === id);
    return entry ? NextResponse.json({ entry }) : NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const q = (params.get('q') ?? '').trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const score = (e: (typeof entries)[number]) => {
    const name = e.name.toLowerCase();
    if (e.id === q || name === q) return 0;
    if (name.startsWith(q) || e.id.startsWith(q)) return 1;
    if (name.includes(q) || e.id.includes(q)) return 2;
    if (e.aliases?.some((a) => a.toLowerCase().includes(q))) return 3;
    return -1;
  };
  const results = entries
    .map((e) => ({ e, s: score(e) }))
    .filter(({ s }) => s >= 0)
    .sort((a, b) => a.s - b.s || a.e.name.localeCompare(b.e.name))
    .slice(0, 20)
    .map(({ e }) => ({ id: e.id, name: e.name }));
  return NextResponse.json({ results });
}
