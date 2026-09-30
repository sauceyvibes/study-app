'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdditionCollection } from '@/atlas/data/additions';
import { COLLECTIONS, SCHEMAS, type Field } from './schema';
import { blankForm, toEntry, toForm, type Entry, type FormValues } from './form';

type Status = { kind: 'idle' } | { kind: 'busy'; label: string } | { kind: 'ok'; message: string; url?: string } | { kind: 'error'; message: string; errors?: string[] };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  if (response.status === 401) {
    window.location.assign(`/admin/login?next=${encodeURIComponent(window.location.pathname)}`);
    throw new Error('Not signed in');
  }
  const body = (await response.json().catch(() => ({}))) as T & { error?: string; errors?: string[] };
  if (!response.ok) throw Object.assign(new Error(body.error ?? `Request failed (${response.status})`), { errors: body.errors });
  return body;
}

export function AdminEditor() {
  const [collection, setCollection] = useState<AdditionCollection>('places');
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [target, setTarget] = useState<{ repo: string; branch: string } | null>(null);
  /** Id of the addition being edited, or null for a new entry. */
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(() => blankForm('places'));
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const schema = SCHEMAS[collection];
  const parsed = useMemo(() => toEntry(collection, form), [collection, form]);

  const load = useCallback(async (c: AdditionCollection) => {
    setEntries(null);
    try {
      const body = await api<{ entries: Entry[]; repo: string; branch: string }>(`/api/admin/entries?collection=${c}`);
      setEntries(body.entries);
      setTarget({ repo: body.repo, branch: body.branch });
    } catch (error) {
      setEntries([]);
      setStatus({ kind: 'error', message: (error as Error).message });
    }
  }, []);

  useEffect(() => {
    void load(collection);
  }, [collection, load]);

  function switchCollection(next: AdditionCollection) {
    setCollection(next);
    setEditing(null);
    setForm(blankForm(next));
    setStatus({ kind: 'idle' });
  }

  function startNew() {
    setEditing(null);
    setForm(blankForm(collection));
    setStatus({ kind: 'idle' });
  }

  function edit(entry: Entry) {
    setEditing(String(entry.id));
    setForm(toForm(collection, entry));
    setStatus({ kind: 'idle' });
  }

  async function save() {
    if (parsed.errors.length) {
      setStatus({ kind: 'error', message: 'Fix the problems below first.', errors: parsed.errors });
      return;
    }
    setStatus({ kind: 'busy', label: 'Committing…' });
    try {
      const body = await api<{ entries: Entry[]; commitUrl: string }>('/api/admin/entries', {
        method: 'PUT',
        body: JSON.stringify({ collection, entry: parsed.entry, originalId: editing }),
      });
      setEntries(body.entries);
      setEditing(String(parsed.entry.id));
      setStatus({ kind: 'ok', message: 'Saved. The public site will show it after its next deploy.', url: body.commitUrl });
    } catch (error) {
      setStatus({ kind: 'error', message: (error as Error).message, errors: (error as { errors?: string[] }).errors });
    }
  }

  async function remove() {
    if (!editing || !window.confirm(`Remove "${editing}" from the additions? Any entry it overrode comes back.`)) return;
    setStatus({ kind: 'busy', label: 'Removing…' });
    try {
      const body = await api<{ entries: Entry[]; commitUrl: string }>('/api/admin/entries', {
        method: 'DELETE',
        body: JSON.stringify({ collection, id: editing }),
      });
      setEntries(body.entries);
      startNew();
      setStatus({ kind: 'ok', message: 'Removed.', url: body.commitUrl });
    } catch (error) {
      setStatus({ kind: 'error', message: (error as Error).message });
    }
  }

  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.assign('/admin/login');
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <h1>Atlas editor</h1>
        {target && (
          <span className="admin-target">
            commits to <code>{target.repo}</code> on <code>{target.branch}</code>
          </span>
        )}
        <button type="button" className="admin-button" onClick={signOut}>Sign out</button>
      </header>

      <nav className="admin-tabs" aria-label="Collections">
        {COLLECTIONS.map((c) => (
          <button key={c} type="button" className={c === collection ? 'active' : ''} onClick={() => switchCollection(c)}>
            {SCHEMAS[c].label}
          </button>
        ))}
      </nav>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <button type="button" className="admin-button primary wide" onClick={startNew}>
            New {schema.singular}
          </button>

          <h2>Your additions</h2>
          {entries === null ? (
            <p className="admin-muted">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="admin-muted">None yet.</p>
          ) : (
            <ul className="admin-list">
              {entries.map((entry) => (
                <li key={String(entry.id)}>
                  <button type="button" className={editing === entry.id ? 'active' : ''} onClick={() => edit(entry)}>
                    <span>{String(entry.name ?? entry.id)}</span>
                    <code>{String(entry.id)}</code>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Lookup
            key={collection}
            collection={collection}
            onLoad={(entry) => {
              setEditing(null);
              setForm(toForm(collection, entry));
              setStatus({ kind: 'ok', message: `Loaded "${String(entry.name)}". Saving with the same id overrides it on the public site.` });
            }}
          />
          <IdFinder />
        </aside>

        <main className="admin-main">
          <h2>{editing ? `Editing ${editing}` : `New ${schema.singular}`}</h2>

          <form
            className="admin-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            {schema.fields.map((field) => (
              <FieldInput key={field.key} field={field} form={form} setForm={setForm} />
            ))}

            <StatusLine status={status} />
            {parsed.errors.length > 0 && status.kind !== 'error' && (
              <ul className="admin-hints">
                {parsed.errors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            )}

            <div className="admin-actions">
              <button type="submit" className="admin-button primary" disabled={status.kind === 'busy'}>
                Save and commit
              </button>
              {editing && (
                <button type="button" className="admin-button danger" onClick={remove} disabled={status.kind === 'busy'}>
                  Remove
                </button>
              )}
            </div>

            <details className="admin-preview">
              <summary>JSON that will be committed</summary>
              <pre>{JSON.stringify(parsed.entry, null, 2)}</pre>
            </details>
          </form>
        </main>
      </div>
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.kind === 'idle') return null;
  if (status.kind === 'busy') return <p className="admin-muted">{status.label}</p>;
  if (status.kind === 'ok') {
    return (
      <p className="admin-ok">
        {status.message}{' '}
        {status.url && <a href={status.url} target="_blank" rel="noreferrer">View commit</a>}
      </p>
    );
  }
  return (
    <div className="admin-error">
      <p>{status.message}</p>
      {status.errors && <ul>{status.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
    </div>
  );
}

function FieldInput({
  field,
  form,
  setForm,
}: {
  field: Field;
  form: FormValues;
  setForm: React.Dispatch<React.SetStateAction<FormValues>>;
}) {
  const value = (key: string) => form[key] ?? '';
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = e.target.value;
    setForm((f) => ({ ...f, [key]: next }));
  };
  const label = (
    <span>
      {field.label}
      {field.optional && <em> optional</em>}
    </span>
  );
  const help = field.help && <small>{field.help}</small>;

  switch (field.type) {
    case 'coords':
    case 'range': {
      const [a, b] = field.type === 'coords' ? ['lon', 'lat'] : ['start', 'end'];
      const [la, lb] = field.type === 'coords' ? ['Longitude', 'Latitude'] : ['From', 'To'];
      return (
        <div className="admin-field">
          {label}
          <div className="admin-pair">
            <input inputMode="decimal" placeholder={la} aria-label={`${field.label} ${la}`} value={value(`${field.key}.${a}`)} onChange={set(`${field.key}.${a}`)} />
            <input inputMode="decimal" placeholder={lb} aria-label={`${field.label} ${lb}`} value={value(`${field.key}.${b}`)} onChange={set(`${field.key}.${b}`)} />
          </div>
          {help}
        </div>
      );
    }
    case 'select':
      return (
        <label className="admin-field">
          {label}
          <select value={value(field.key)} onChange={set(field.key)}>
            {field.optional && <option value="">—</option>}
            {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {help}
        </label>
      );
    case 'color':
      return (
        <label className="admin-field">
          {label}
          <div className="admin-pair">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(value(field.key)) ? value(field.key) : '#000000'} onChange={set(field.key)} />
            <input value={value(field.key)} onChange={set(field.key)} />
          </div>
          {help}
        </label>
      );
    case 'textarea':
    case 'list':
    case 'scripture':
    case 'sources':
    case 'legs':
    case 'json': {
      const mono = field.type === 'json' || field.type === 'legs';
      const rows = field.type === 'json' || field.type === 'legs' ? 6 : field.type === 'textarea' ? 4 : 3;
      return (
        <label className="admin-field">
          {label}
          <textarea
            className={mono ? 'mono' : undefined}
            rows={rows}
            value={value(field.key)}
            onChange={set(field.key)}
            placeholder={field.type === 'json' ? field.placeholder : undefined}
            spellCheck={!mono}
          />
          {help}
        </label>
      );
    }
    default:
      return (
        <label className="admin-field">
          {label}
          <input
            value={value(field.key)}
            onChange={set(field.key)}
            inputMode={field.type === 'number' ? 'decimal' : undefined}
            placeholder={field.type === 'refs' ? 'ids, separated by commas' : field.type === 'ref' ? 'an id' : undefined}
            spellCheck={field.type === 'text'}
          />
          {help}
        </label>
      );
  }
}

/** Search the published corpus and pull an entry into the form to correct it. */
function Lookup({ collection, onLoad }: { collection: AdditionCollection; onLoad: (entry: Entry) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (q.trim().length < 2) return setResults([]);
      const body = await api<{ results: { id: string; name: string }[] }>(`/api/admin/lookup?collection=${collection}&q=${encodeURIComponent(q)}`).catch(() => ({ results: [] }));
      setResults(body.results);
    }, 200);
    return () => clearTimeout(handle);
  }, [q, collection]);

  async function load(id: string) {
    const body = await api<{ entry: Entry }>(`/api/admin/lookup?collection=${collection}&id=${encodeURIComponent(id)}`);
    onLoad(body.entry);
  }

  return (
    <section className="admin-lookup">
      <h2>Correct an existing {SCHEMAS[collection].singular}</h2>
      <input placeholder="Search by name or id" value={q} onChange={(e) => setQ(e.target.value)} />
      {results.length > 0 && (
        <ul className="admin-list">
          {results.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => load(r.id)}>
                <span>{r.name}</span>
                <code>{r.id}</code>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Find the id to type into a reference field, in any collection. */
function IdFinder() {
  const [collection, setCollection] = useState<AdditionCollection>('places');
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (q.trim().length < 2) return setResults([]);
      const body = await api<{ results: { id: string; name: string }[] }>(`/api/admin/lookup?collection=${collection}&q=${encodeURIComponent(q)}`).catch(() => ({ results: [] }));
      setResults(body.results);
    }, 200);
    return () => clearTimeout(handle);
  }, [q, collection]);

  return (
    <section className="admin-lookup">
      <h2>Find an id</h2>
      <div className="admin-pair">
        <select value={collection} onChange={(e) => setCollection(e.target.value as AdditionCollection)} aria-label="Collection">
          {COLLECTIONS.map((c) => <option key={c} value={c}>{SCHEMAS[c].label}</option>)}
        </select>
        <input placeholder="Name" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {results.length > 0 && (
        <ul className="admin-ids">
          {results.map((r) => (
            <li key={r.id}>
              <code>{r.id}</code> {r.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
