import { NextResponse } from 'next/server';
import type { AdditionCollection } from '@/atlas/data/additions';
import { SCHEMAS, isCollection } from '@/admin/schema';
import { validateEntry } from '@/admin/validate';
import { knownIds, referencedCollections } from '@/admin/known';
import { GitHubError, githubConfig, readCollection, writeCollection } from '@/admin/github';
import type { Entry } from '@/admin/form';

export const dynamic = 'force-dynamic';

function failure(error: unknown) {
  if (error instanceof GitHubError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
}

/** Mutations must be JSON, which a cross-site form post cannot send. */
async function jsonBody(request: Request): Promise<Record<string, unknown> | null> {
  if (!request.headers.get('content-type')?.includes('application/json')) return null;
  const body = (await request.json().catch(() => null)) as unknown;
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null;
}

/**
 * Read, change, write — retried once if someone else committed in between, so a
 * save made while another is in flight is re-applied on top rather than lost.
 */
async function commit(
  collection: AdditionCollection,
  change: (entries: Entry[]) => { entries: Entry[]; message: string } | { error: string; status: number },
) {
  for (let attempt = 0; ; attempt++) {
    const file = await readCollection(collection);
    const result = change(file.entries);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    try {
      const { commitUrl } = await writeCollection(collection, result.entries, file.sha, result.message);
      return NextResponse.json({ entries: result.entries, commitUrl });
    } catch (error) {
      if (!(error instanceof GitHubError && error.status === 409) || attempt > 0) throw error;
    }
  }
}

export async function GET(request: Request) {
  const collection = new URL(request.url).searchParams.get('collection');
  if (!isCollection(collection)) return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });
  try {
    const { entries } = await readCollection(collection);
    const { repo, branch } = githubConfig();
    return NextResponse.json({ entries, repo, branch });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  const body = await jsonBody(request);
  if (!body || !isCollection(body.collection)) return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });
  const collection = body.collection;
  const entry = body.entry as Entry;
  const originalId = typeof body.originalId === 'string' ? body.originalId : null;

  try {
    const fresh = Object.fromEntries(
      await Promise.all(
        referencedCollections(collection).map(async (c) => [c, (await readCollection(c)).entries] as const),
      ),
    );
    const errors = validateEntry(collection, entry, knownIds(fresh));
    if (errors.length) return NextResponse.json({ error: 'Validation failed', errors }, { status: 422 });

    const id = String(entry.id);
    const noun = SCHEMAS[collection].singular;
    return await commit(collection, (entries) => {
      const existing = entries.findIndex((e) => e.id === id);
      const renamedFrom = originalId && originalId !== id ? entries.findIndex((e) => e.id === originalId) : -1;
      if (renamedFrom >= 0 && existing >= 0) {
        return { error: `Another ${noun} already uses the id "${id}"`, status: 409 };
      }
      const next = [...entries];
      if (existing >= 0) next[existing] = entry;
      else if (renamedFrom >= 0) next[renamedFrom] = entry;
      else next.push(entry);
      const verb = existing >= 0 || renamedFrom >= 0 ? 'Update' : 'Add';
      return { entries: next, message: `admin: ${verb} ${noun} "${entry.name ?? id}" (${id})` };
    });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  const body = await jsonBody(request);
  if (!body || !isCollection(body.collection) || typeof body.id !== 'string') {
    return NextResponse.json({ error: 'Need a collection and an id' }, { status: 400 });
  }
  const { collection, id } = body as { collection: AdditionCollection; id: string };
  try {
    return await commit(collection, (entries) => {
      const target = entries.find((e) => e.id === id);
      if (!target) return { error: `No addition with id "${id}"`, status: 404 };
      return {
        entries: entries.filter((e) => e.id !== id),
        message: `admin: Remove ${SCHEMAS[collection].singular} "${target.name ?? id}" (${id})`,
      };
    });
  } catch (error) {
    return failure(error);
  }
}
