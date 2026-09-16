// @ts-check
/*
 * Builds the comprehensive *nomenclature* — every proper name in the Protestant
 * Bible — from STEPBible's TIPNR dataset.
 *
 *   Source : https://github.com/STEPBible/STEPBible-Data
 *            "Proper Nouns/TIPNR - Translators Individualised Proper Names
 *             with all References - STEPBible.org CC BY.txt"
 *   License: Creative Commons Attribution 4.0 — STEPBible / Tyndale House Cambridge
 *
 * Why this dataset and not a name list scraped from a concordance: TIPNR is
 * *individuated*. There are seven men called Zechariah in Chronicles and TIPNR
 * knows which verse belongs to which one, because Tyndale House worked through
 * the genealogies and assigned each individual a disambiguated Strong's number.
 * A concordance would give us one "Zechariah" with ninety references and no way
 * to tell a reader which of them is the same man. It also carries the Hebrew and
 * Greek for every form of every name, which the OpenBible gazetteer does not, so
 * merging it gives the existing 1,285 places their ancient-language names too.
 *
 * Three collections come out, because they behave differently in the app:
 *
 *   people.generated.json  — 3,100+ individuals and family groups. Searchable,
 *                            never drawn: a person is not a location.
 *   sites.generated.json   — TIPNR's places, whose real value over OpenBible is
 *                            (a) Hebrew/Greek for all of them and (b) ~340
 *                            *sub-locations* — the Areopagus in Athens, the pool
 *                            of Bethesda in Jerusalem, the Beautiful Gate — each
 *                            carrying which settlement it sits in or near. Those
 *                            are the entries that make the map worth zooming.
 *   topics.generated.json  — the deities, festivals, months, sects, musical
 *                            terms and constellations. Search-only by design:
 *                            "Passover" and "Pharisee" are things a reader looks
 *                            up, not places a cartographer can pin.
 *
 * This is a build-time tool, not part of `next build`. The merge with the
 * curated corpus and the OpenBible gazetteer happens at load in
 * `src/atlas/data/nomenclature.ts`, so this file stays unaware of both.
 *
 * Usage:
 *   curl -L -o tipnr.txt \
 *     "https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Proper%20Nouns/TIPNR%20-%20Translators%20Individualised%20Proper%20Names%20with%20all%20References%20-%20STEPBible.org%20CC%20BY.txt"
 *   node scripts/build-nomenclature.mjs tipnr.txt
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** TIPNR's three-letter book codes → this app's book ids. */
const CODE_TO_ID = {
  Gen: 'genesis', Exo: 'exodus', Lev: 'leviticus', Num: 'numbers', Deu: 'deuteronomy',
  Jos: 'joshua', Jdg: 'judges', Rut: 'ruth', '1Sa': '1samuel', '2Sa': '2samuel',
  '1Ki': '1kings', '2Ki': '2kings', '1Ch': '1chronicles', '2Ch': '2chronicles',
  Ezr: 'ezra', Neh: 'nehemiah', Est: 'esther', Job: 'job', Psa: 'psalms', Pro: 'proverbs',
  Ecc: 'ecclesiastes', Sng: 'songofsongs', Isa: 'isaiah', Jer: 'jeremiah', Lam: 'lamentations',
  Ezk: 'ezekiel', Dan: 'daniel', Hos: 'hosea', Jol: 'joel', Amo: 'amos', Oba: 'obadiah',
  Jon: 'jonah', Mic: 'micah', Nam: 'nahum', Hab: 'habakkuk', Zep: 'zephaniah', Hag: 'haggai',
  Zec: 'zechariah', Mal: 'malachi', Mat: 'matthew', Mrk: 'mark', Luk: 'luke', Jhn: 'john',
  Act: 'acts', Rom: 'romans', '1Co': '1corinthians', '2Co': '2corinthians', Gal: 'galatians',
  Eph: 'ephesians', Php: 'philippians', Col: 'colossians', '1Th': '1thessalonians',
  '2Th': '2thessalonians', '1Ti': '1timothy', '2Ti': '2timothy', Tit: 'titus',
  Phm: 'philemon', Heb: 'hebrews', Jas: 'james', '1Pe': '1peter', '2Pe': '2peter',
  '1Jn': '1john', '2Jn': '2john', '3Jn': '3john', Jud: 'jude', Rev: 'revelation',
};

/**
 * Chapter counts, so a reference can never point past a book's end. TIPNR uses
 * standard English versification, but LXX-only references and the odd variant
 * still stray; an out-of-range ref is dropped rather than emitted.
 */
const CHAPTERS = {
  genesis: 50, exodus: 40, leviticus: 27, numbers: 36, deuteronomy: 34, joshua: 24, judges: 21,
  ruth: 4, '1samuel': 31, '2samuel': 24, '1kings': 22, '2kings': 25, '1chronicles': 29,
  '2chronicles': 36, ezra: 10, nehemiah: 13, esther: 10, job: 42, psalms: 150, proverbs: 31,
  ecclesiastes: 12, songofsongs: 8, isaiah: 66, jeremiah: 52, lamentations: 5, ezekiel: 48,
  daniel: 12, hosea: 14, joel: 3, amos: 9, obadiah: 1, jonah: 4, micah: 7, nahum: 3, habakkuk: 3,
  zephaniah: 3, haggai: 2, zechariah: 14, malachi: 4, matthew: 28, mark: 16, luke: 24, john: 21,
  acts: 28, romans: 16, '1corinthians': 16, '2corinthians': 13, galatians: 6, ephesians: 6,
  philippians: 4, colossians: 4, '1thessalonians': 5, '2thessalonians': 3, '1timothy': 6,
  '2timothy': 4, titus: 3, philemon: 1, hebrews: 13, james: 5, '1peter': 5, '2peter': 3,
  '1john': 5, '2john': 1, '3john': 1, jude: 1, revelation: 22,
};

const BOOK_IDS = Object.values(CODE_TO_ID);
const BOOK_INDEX = new Map(BOOK_IDS.map((id, i) => [id, i]));

/**
 * TIPNR's era phrases → this app's period ids, with the floruit each implies.
 *
 * TIPNR runs Judah-alone into "Divided Monarchy" and the exile into "Exile and
 * Return", which is coarser than the atlas timeline. Rather than invent a
 * precision the source does not have, each era maps to the *span* it covers and
 * to every period that span touches, so a figure surfaces across the whole
 * stretch they might belong to instead of being pinned to a false year.
 */
const ERAS = {
  'before the Flood': { key: 'antediluvian', start: -2100, end: -2050, periods: ['patriarchal'] },
  'the Patriarchs': { key: 'patriarchal', start: -2100, end: -1550, periods: ['patriarchal'] },
  'Egypt and Wilderness': { key: 'egypt-exodus', start: -1550, end: -1200, periods: ['egypt-exodus'] },
  Conquest: { key: 'conquest', start: -1250, end: -1150, periods: ['egypt-exodus', 'conquest-judges'] },
  "before Israel's Monarchy": { key: 'judges', start: -1200, end: -1050, periods: ['conquest-judges'] },
  'United Monarchy': { key: 'united-monarchy', start: -1050, end: -931, periods: ['united-monarchy'] },
  'Divided Monarchy': { key: 'divided-monarchy', start: -931, end: -586, periods: ['divided-monarchy', 'judah-alone'] },
  'Exile and Return': { key: 'exile-return', start: -605, end: -400, periods: ['exile', 'return'] },
  'the New Testament': { key: 'new-testament', start: -6, end: 100, periods: ['roman-judea', 'apostolic'] },
};

/** The whole biblical span, for a figure whose era TIPNR does not state. */
const ERA_UNKNOWN = { key: 'unplaced', start: -2100, end: 100, periods: [] };

/**
 * Match an era phrase inside a free-text description.
 *
 * Longest phrase first, because "Egypt and Wilderness and Conquest" must not be
 * claimed by "Conquest", and "Divided Monarchy" must not swallow a description
 * that says "United Monarchy and Divided Monarchy" — for that one the earlier
 * start is the honest answer, which falls out of taking the longest match and
 * then widening below.
 */
const ERA_PHRASES = Object.keys(ERAS).sort((a, b) => b.length - a.length);

function eraFor(description) {
  const matched = ERA_PHRASES.filter((phrase) => description.includes(phrase));
  if (matched.length === 0) return ERA_UNKNOWN;
  // A description naming two eras ("United Monarchy and Divided Monarchy") gets
  // the union of both, which is what the text actually claims.
  const spans = matched.map((phrase) => ERAS[phrase]);
  return {
    key: spans.length === 1 ? spans[0].key : 'spanning',
    start: Math.min(...spans.map((s) => s.start)),
    end: Math.max(...spans.map((s) => s.end)),
    periods: [...new Set(spans.flatMap((s) => s.periods))],
  };
}

// ── Text cleaning ────────────────────────────────────────────────────────────

/**
 * TIPNR's summary field carries STEP's own inline markup:
 *   <ref="Exo.4.14">Exo.4.14</ref>  <strong="H0175">Aaron</strong>  <br>
 * Strip it to the visible text. The tags are navigation aids for STEPBible's own
 * reader and mean nothing here; the words between them are the substance.
 */
function stripMarkup(text) {
  return dropUnmatchedParens(
    String(text ?? '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?(?:ref|strong)(?:="[^"]*")?>/gi, '')
      .replace(/^#/, '')
      .replace(/\s*\(\s*\)/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s+([;,.])/g, '$1')
      .replace(/;\s*\./g, '.')
      .trim(),
  );
}

/**
 * The source writes "first mentioned at <ref=…>Exo.4.14</ref>)" — a closing
 * bracket whose opening one lives inside the markup we just removed. Drop any
 * bracket left without a partner rather than leaving stray punctuation in prose
 * the reader will see.
 */
function dropUnmatchedParens(text) {
  let depth = 0;
  let out = '';
  for (const char of text) {
    if (char === '(') depth += 1;
    else if (char === ')') {
      if (depth === 0) continue;
      depth -= 1;
    }
    out += char;
  }
  return depth === 0 ? out : out.replace(/\(([^()]*)$/, '$1').trim();
}

/** Trailing "(?)" marks an editorial uncertainty in the source; keep the word, drop the mark. */
function stripQuery(text) {
  return String(text ?? '').replace(/\(\?\)/g, '').trim();
}

// ── Identity ─────────────────────────────────────────────────────────────────

/**
 * A TIPNR unique name is `Display@FirstRef` (e.g. `Aaron@Exo.4.14-Heb`), and the
 * header adds `=uStrong`. Split it into the parts we index on.
 */
function parseUniqueName(field) {
  const raw = String(field ?? '').trim();
  const eq = raw.lastIndexOf('=');
  const unique = eq > 0 ? raw.slice(0, eq) : raw;
  const strong = eq > 0 ? raw.slice(eq + 1) : '';
  const at = unique.indexOf('@');
  const display = at > 0 ? unique.slice(0, at) : unique;
  const anchor = at > 0 ? unique.slice(at + 1) : '';
  return { unique, strong, display, anchor };
}

/**
 * TIPNR writes compound and disambiguated names with underscores
 * (`Beautiful_Gate`, `Olives_Mount`, `Beth-horon_Upper`). Underscores are its
 * spreadsheet convention, not the reader's spelling, so they become spaces — and
 * where the qualifier trails the noun (`Mount` after `Olives`) it is moved back
 * in front, which is how an English Bible actually prints it.
 */
const TRAILING_QUALIFIERS = new Set(['Mount', 'Valley', 'Wilderness', 'River', 'Brook', 'Desert', 'Gate', 'Sea']);

function displayName(raw) {
  // A trailing "_2" is the source's disambiguation counter for a repeated
  // headword, not part of the name. The atlas tells the two apart by their
  // references and their position, so the counter is dropped.
  const parts = String(raw ?? '').replace(/_\d+$/, '').split('_');
  if (parts.length === 2 && TRAILING_QUALIFIERS.has(parts[1])) {
    return `${parts[1]} ${parts[0]}`.replace(/\s+/g, ' ').trim();
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** Lowercase, drop diacritics and punctuation, hyphen-join. */
function slugify(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Stable ids across rebuilds.
 *
 * The plain slug is used where a name is unique. Where it is not — and with
 * three thousand people it very often is not — the disambiguating first
 * reference is appended, which is exactly the thing TIPNR uses to tell the
 * individuals apart. Input is alphabetical and the anchor is part of the source
 * record, so the same file always yields the same ids.
 */
function makeIdAllocator() {
  const taken = new Set();
  return (display, anchor) => {
    const base = slugify(display) || 'unnamed';
    if (!taken.has(base)) {
      taken.add(base);
      return base;
    }
    const qualified = `${base}-${slugify(anchor)}`;
    if (qualified !== base && !taken.has(qualified)) {
      taken.add(qualified);
      return qualified;
    }
    let n = 2;
    while (taken.has(`${qualified}-${n}`)) n += 1;
    taken.add(`${qualified}-${n}`);
    return `${qualified}-${n}`;
  };
}

// ── References ───────────────────────────────────────────────────────────────

/**
 * Parse an "All Refs" field into [bookId, chapter] pairs.
 *
 * The field is a semicolon list of `Book.Chapter.Verse`, with occasional `a`/`b`
 * suffixes where a verse names the same person twice and an `LXX ` prefix for
 * names that occur only in the Greek Old Testament. We index to the chapter,
 * which is the granularity the rest of the atlas works at, and drop LXX-only
 * references because the app indexes the Protestant canon.
 */
function parseRefs(field) {
  const out = new Map();
  const text = String(field ?? '');
  for (const match of text.matchAll(/(LXX\s*)?\b([1-3]?[A-Za-z]{2,3})\.(\d+)\.(\d+)/g)) {
    if (match[1]) continue; // LXX-only occurrence
    const bookId = CODE_TO_ID[match[2]];
    if (!bookId) continue;
    const chapter = Number(match[3]);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > CHAPTERS[bookId]) continue;
    const index = BOOK_INDEX.get(bookId);
    if (!out.has(index)) out.set(index, new Set());
    out.get(index).add(chapter);
  }
  return [...out.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bookIdx, chapters]) => [bookIdx, [...chapters].sort((a, b) => a - b)]);
}

// ── Name forms ───────────────────────────────────────────────────────────────

/**
 * The "Translated name" column reads either as a bare name (`Aaron`) or as a
 * per-version list (`Ebron =ESV; Abdon =NIV; Hebron =KJV`). Pull out every
 * distinct English form: those are exactly the spellings a reader might type,
 * and the whole point of the alias set is that searching "Mars' hill" finds the
 * Areopagus.
 */
function parseTranslatedNames(field) {
  const names = [];
  const add = (candidate) => {
    // A slash marks where the source splits a compound across its own columns —
    // "Solomon's/ Portico", "Hall of/ Judgment". It is typography, not spelling.
    const name = candidate.replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
    if (name && !names.includes(name)) names.push(name);
  };

  for (const segment of String(field ?? '').split(';')) {
    const raw = segment.split('=')[0].trim();
    if (!isNameLike(raw)) continue;
    // TIPNR brackets the optional half of a name: "(Mount of )Olives" is printed
    // both ways in the text, and "Beautiful (Gate)" likewise. Index both, so a
    // reader finds the place whichever half they remember.
    add(raw.replace(/[()]/g, ''));
    if (/\(.*\)/.test(raw)) add(raw.replace(/\([^)]*\)/g, ''));
  }
  return names;
}

/**
 * Is this column value a name, or a gloss?
 *
 * The translated-name column is not always a name. Where a version renders the
 * word rather than transliterating it, the cell holds the rendering ("stone" for
 * Abel at 1Sa.6.18, "he" where Paul is a pronoun) and "[ ]" where a version drops
 * it altogether. English prints proper names capitalised, so requiring a capital
 * separates the two cleanly and keeps "rock" and "plain of the vineyards" out of
 * an alias list that search will trust.
 */
function isNameLike(value) {
  if (!value || value.includes('[') || value.includes(']')) return false;
  const firstLetter = /\p{L}/u.exec(value);
  return firstLetter !== null && firstLetter[0] === firstLetter[0].toUpperCase();
}

/** `H0175«H0175=אַהֲרֹן` → { dStrong: 'H0175', script: 'אַהֲרֹן' }. */
function parseStrongScript(field) {
  const raw = String(field ?? '').trim();
  if (!raw) return null;
  const [strongPart, ...rest] = raw.split('=');
  const dStrong = strongPart.split('«')[0].trim();
  const script = rest.join('=').replace(/\((?:Aramiac|Aramaic)\s*/i, '').replace(/\)$/, '').trim();
  return { dStrong, script };
}

const HEBREW = /[֐-׿]/;
const GREEK = /[Ͱ-Ͽἀ-῿]/;

// ── Record parsing ───────────────────────────────────────────────────────────

/**
 * Split the file into records. A record opens with a `$==========SECTION` line
 * and runs to the next one; sub-records are the lines beginning with an en dash,
 * and the `@Brief=`-style lines are continuations of the final spreadsheet cell.
 */
function readRecords(text) {
  const records = [];
  let current = null;
  for (const line of text.split(/\r?\n/)) {
    const header = /^\$=+\s?(PERSON|PLACE|OTHER)/.exec(line);
    if (header) {
      current = { section: header[1], lines: [] };
      records.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  // The first record of each section is the column-header legend, not data.
  return records.filter((r) => r.lines[0] && !/^Uni(fied|que)Name/.test(r.lines[0]));
}

/**
 * Pull the shared shape out of a record: the tab-separated header fields, and
 * the name forms gathered from the `– …` sub-record lines.
 */
function readForms(record) {
  const forms = [];
  let total = null;
  for (const line of record.lines.slice(1)) {
    if (!line.startsWith('–')) continue;
    const fields = line.split('\t');
    const significance = fields[0].replace(/^–\s*/, '').trim();
    if (significance === 'Total') {
      total = { allNames: (fields[1] ?? '').trim(), allStrongs: (fields[2] ?? '').trim() };
      continue;
    }
    forms.push({
      significance,
      unique: (fields[1] ?? '').trim(),
      strongScript: parseStrongScript(fields[3 - 1]),
      names: parseTranslatedNames(fields[3]),
      link: (fields[4] ?? '').trim(),
      refs: fields[5] ?? '',
    });
  }
  return { forms, total };
}

/**
 * Fold the name forms into one entry: every English spelling, the first Hebrew
 * and Greek scripts, every disambiguated Strong's number, the merged chapter
 * references, and a STEPBible link that shows the reader every occurrence.
 */
function foldForms(forms, primaryName) {
  const aliases = [];
  const strongs = [];
  let hebrew = null;
  let greek = null;
  let link = '';
  const refText = [];

  for (const form of forms) {
    for (const name of form.names) {
      if (name !== primaryName && !aliases.includes(name)) aliases.push(name);
    }
    if (form.strongScript) {
      const { dStrong, script } = form.strongScript;
      if (dStrong && !strongs.includes(dStrong)) strongs.push(dStrong);
      if (script && !hebrew && HEBREW.test(script)) hebrew = script;
      if (script && !greek && GREEK.test(script)) greek = script;
    }
    if (!link && form.link.startsWith('http')) link = form.link;
    refText.push(form.refs);
  }

  return { aliases, strongs, hebrew, greek, link, refs: parseRefs(refText.join('; ')) };
}

/**
 * The name to print.
 *
 * TIPNR's unique key spells compounds its own way (`Olives_Mount`,
 * `Beth-horon_Upper`), while the first name form carries the spelling an English
 * Bible actually prints ("Mount of Olives", "Upper Beth-horon"). Prefer the
 * printed form — but only when it is recognisably the same name, since the form
 * column sometimes holds a translation rather than a name at all (`Abel@1Sa.6.18`
 * is rendered "stone" in the ESV, and "Abel" is what a reader will search for).
 */
function preferredDisplay(rawDisplay, forms) {
  const fallback = displayName(rawDisplay);
  const candidate = forms[0]?.names?.[0];
  if (!candidate) return fallback;

  const tokens = String(rawDisplay).split('_').filter(Boolean);
  const haystack = candidate.toLowerCase();
  const recognisable = tokens.every((token) => haystack.includes(token.toLowerCase()));
  return recognisable ? candidate.replace(/\s+/g, ' ').trim() : fallback;
}

// ── Google Maps coordinates ──────────────────────────────────────────────────

/**
 * TIPNR carries a Google Maps link per place: `.../maps/@33.545097,36.224661,14z`.
 * Unlocated places get a degenerate `@0,14z` or a bare `@`, which must read as
 * "no coordinate" rather than as the Gulf of Guinea.
 */
function parseCoordinates(url) {
  const match = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),/.exec(String(url ?? ''));
  if (!match) return null;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat === 0 && lon === 0) return null;
  return [Number(lon.toFixed(5)), Number(lat.toFixed(5))];
}

// ── PERSON ───────────────────────────────────────────────────────────────────

/** Split a relation field ("Nadab@…, Abihu@…") into TIPNR unique names. */
function splitRelations(field) {
  return String(field ?? '')
    .split(',')
    .map((s) => stripQuery(s).replace(/\((?:d|a|f)\)/g, '').trim())
    .filter((s) => s && s !== '>' && s.includes('@'));
}

const PERSON_TYPE = { Male: 'm', Female: 'f', Group: 'group' };

/**
 * A string table for values that repeat across thousands of records.
 *
 * "Man living at the time of Divided Monarchy" occurs over a thousand times, and
 * storing it a thousand times costs more than the rest of that record put
 * together. Entries hold an index; the app expands them at load. This is the
 * difference between a corpus that ships comfortably and one that does not.
 */
function makeInterner() {
  const values = [];
  const index = new Map();
  const intern = (value) => {
    if (!value) return -1;
    const existing = index.get(value);
    if (existing !== undefined) return existing;
    index.set(value, values.length);
    values.push(value);
    return values.length - 1;
  };
  return { intern, values };
}

function buildPeople(records) {
  const allocate = makeIdAllocator();
  const byUnique = new Map();
  const drafts = [];
  const roles = makeInterner();
  const eras = makeInterner();
  const eraTable = new Map();

  for (const record of records) {
    const f = record.lines[0].split('\t');
    const { unique, display, anchor } = parseUniqueName(f[0]);
    if (!unique) continue;

    const role = stripQuery(f[1] ?? '').trim();
    const { forms, total } = readForms(record);
    const name = preferredDisplay(display, forms);
    const folded = foldForms(forms, name);

    const id = allocate(name, anchor);
    byUnique.set(unique, id);

    const [father, mother] = String(f[2] ?? '').split('+');
    const era = eraFor(role);
    eraTable.set(era.key, era);

    drafts.push({
      id,
      unique,
      name,
      aliases: folded.aliases,
      hebrew: folded.hebrew,
      greek: folded.greek,
      strongs: folded.strongs,
      type: PERSON_TYPE[(f[8] ?? '').trim()] ?? 'm',
      role: roles.intern(role),
      era: eras.intern(era.key),
      tribe: roles.intern(stripQuery(f[6] ?? '').replace(/^>+/, '').trim()),
      allNames: total?.allNames ?? '',
      father: splitRelations(father),
      mother: splitRelations(mother),
      siblings: splitRelations(f[3]),
      partners: splitRelations(f[4]),
      offspring: splitRelations(f[5]),
      refs: folded.refs,
    });
  }

  // Second pass: relations are TIPNR unique names until every id exists.
  const resolve = (uniques) => uniques.map((u) => byUnique.get(u)).filter(Boolean);

  return {
    byUnique,
    roles: roles.values,
    eras: eras.values.map((key) => {
      const { start, end, periods } = eraTable.get(key);
      return { key, start, end, periods };
    }),
    people: drafts.map((d) => {
      // Everything derivable at load is left out: the prose description, the
      // STEPBible URL (rebuilt from the Strong's numbers) and the reference
      // count all cost more to ship than to compute.
      const entry = { i: d.id, n: d.name, t: d.type, e: d.era, r: d.refs };
      if (d.aliases.length) entry.a = d.aliases;
      if (d.hebrew) entry.h = d.hebrew;
      if (d.greek) entry.g = d.greek;
      if (d.strongs.length) entry.s = d.strongs;
      if (d.role >= 0) entry.ro = d.role;
      if (d.tribe >= 0) entry.tr = d.tribe;
      const father = resolve(d.father);
      const mother = resolve(d.mother);
      if (father.length) entry.fa = father[0];
      if (mother.length) entry.mo = mother[0];
      const siblings = resolve(d.siblings);
      const partners = resolve(d.partners);
      const offspring = resolve(d.offspring);
      if (siblings.length) entry.sb = siblings;
      if (partners.length) entry.pa = partners;
      if (offspring.length) entry.of = offspring;
      return entry;
    }),
  };
}

// ── PLACE ────────────────────────────────────────────────────────────────────

/**
 * The place header's second column is `OpenBible name= relation Parent (Unique)`.
 *
 * Three shapes occur: a bare OpenBible name; `X= in Y (Y@ref)` for a location
 * inside a settlement; and `X= near Y (Y@ref)` for one in its vicinity. A fourth,
 * `X= same as Y (…)`, is an identification rather than a containment and is
 * deliberately not treated as a parent — the Areopagus is *in* Athens, but
 * Bethel_2 is not *in* Bethul, it may *be* Bethul.
 */
function parseNearField(field) {
  const raw = String(field ?? '').trim();
  if (!raw) return { openBibleName: '', relation: null, parentUnique: null, note: '' };

  const eq = raw.indexOf('=');
  if (eq < 0) {
    return { openBibleName: raw.replace(/_\d+$/, ''), relation: null, parentUnique: null, note: '' };
  }

  // OpenBible suffixes repeated headwords with "_1", "_2" to keep its own file
  // unique. That is a key, not a spelling; the atlas tells the three Bethlehems
  // apart by their coordinates and their references.
  const openBibleName = raw.slice(0, eq).trim().replace(/_\d+$/, '');
  const rest = raw.slice(eq + 1).trim();
  const relationMatch = /^(in|near|same as)\s+/i.exec(rest);
  const relation = relationMatch ? relationMatch[1].toLowerCase() : null;
  const parentMatch = /\(([^()]*@[^()]*?)(?:=[HG]\d[^()]*)?\)/.exec(rest);

  return {
    openBibleName,
    relation: relation === 'same as' ? null : relation,
    parentUnique: relation && relation !== 'same as' && parentMatch ? parentMatch[1].trim() : null,
    note: stripQuery(rest),
  };
}

function buildPlaces(records) {
  const allocate = makeIdAllocator();
  const byUnique = new Map();
  const drafts = [];

  for (const record of records) {
    const f = record.lines[0].split('\t');
    const { unique, display, anchor } = parseUniqueName(f[0]);
    if (!unique) continue;

    const { forms } = readForms(record);
    const near = parseNearField(f[1]);
    // For places the OpenBible column is the cleanest spelling available — it is
    // the gazetteer's own headword — so it leads, with the translated form and
    // then the record key behind it.
    const name = isNameLike(near.openBibleName)
      ? near.openBibleName.replace(/\//g, ' ').replace(/\s+/g, ' ').trim()
      : preferredDisplay(display, forms);
    const folded = foldForms(forms, name);

    const id = allocate(name, anchor);
    byUnique.set(unique, id);

    drafts.push({
      id,
      name,
      aliases: folded.aliases,
      hebrew: folded.hebrew,
      greek: folded.greek,
      strongs: folded.strongs,
      openBibleName: near.openBibleName,
      relation: near.relation,
      parentUnique: near.parentUnique,
      locationNote: near.relation ? near.note : '',
      // The founder column occasionally carries an editorial note instead of a
      // name ("Word sometimes translated as a place"); those are not founders.
      founder: /^Word sometimes/i.test(String(f[2] ?? '').trim())
        ? ''
        : stripQuery(f[2] ?? '').replace(/@[^\s,]*/g, '').trim(),
      inhabitants: stripQuery(f[3] ?? '').trim(),
      coordinates: parseCoordinates(f[4]),
      area: stripQuery(f[6] ?? '').replace(/^>+$/, '').trim(),
      refs: folded.refs,
    });
  }

  return {
    byUnique,
    places: drafts.map((d) => {
      // As with people: the description and the STEPBible and Google Maps URLs
      // are all rebuilt at load — the map link is literally a restatement of the
      // coordinate we already hold.
      const entry = { i: d.id, n: d.name, c: d.coordinates, r: d.refs };
      if (d.aliases.length) entry.a = d.aliases;
      if (d.hebrew) entry.h = d.hebrew;
      if (d.greek) entry.g = d.greek;
      if (d.strongs.length) entry.s = d.strongs;
      if (d.openBibleName && d.openBibleName !== d.name) entry.ob = d.openBibleName;
      if (d.relation && d.parentUnique && byUnique.has(d.parentUnique)) {
        entry.rel = d.relation;
        entry.pa = byUnique.get(d.parentUnique);
      } else if (d.relation) {
        entry.rel = d.relation;
        entry.note = d.locationNote;
      }
      if (d.founder) entry.fo = d.founder;
      if (d.inhabitants) entry.pe = d.inhabitants;
      if (d.area && d.area !== '>') entry.ar = d.area;
      return entry;
    }),
  };
}

// ── OTHER ────────────────────────────────────────────────────────────────────

/**
 * Everything that is named but is not a person or a place: gods and angels,
 * festivals and months, sects and schools, musical directions, constellations.
 *
 * These are search-only in the app. That is a deliberate line: a study tool
 * should let you look up "Sadducee" or "Passover" or "Selah", but pinning them
 * to a coordinate would be a category error, and a map that tried would be
 * making claims the text does not.
 */
function buildTopics(records) {
  const allocate = makeIdAllocator();
  const topics = [];

  for (const record of records) {
    const f = record.lines[0].split('\t');
    const { unique, display, anchor } = parseUniqueName(f[0]);
    if (!unique) continue;

    const { forms } = readForms(record);
    const name = preferredDisplay(display, forms);
    const folded = foldForms(forms, name);

    const entry = {
      i: allocate(name, anchor),
      n: name,
      t: (f[8] ?? '').trim() || 'Other',
      d: stripMarkup(f[7]),
      ro: stripQuery(f[1] ?? '').trim(),
      r: folded.refs,
    };
    if (folded.aliases.length) entry.a = folded.aliases;
    if (folded.hebrew) entry.h = folded.hebrew;
    if (folded.greek) entry.g = folded.greek;
    if (folded.strongs.length) entry.s = folded.strongs;
    topics.push(entry);
  }

  return topics;
}

// ── Entry point ──────────────────────────────────────────────────────────────

const ATTRIBUTION =
  'Proper names, ancient-language forms, family relations and references from ' +
  'STEPBible TIPNR (Tyndale House Cambridge), licensed CC BY 4.0.';

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('usage: node scripts/build-nomenclature.mjs <tipnr.txt>');
    process.exit(1);
  }

  const records = readRecords(readFileSync(resolve(input), 'utf8'));
  const persons = records.filter((r) => r.section === 'PERSON');
  const places = records.filter((r) => r.section === 'PLACE');
  const others = records.filter((r) => r.section === 'OTHER');

  const people = buildPeople(persons);
  const sites = buildPlaces(places);
  const topics = buildTopics(others);

  const header = {
    _comment:
      'GENERATED by scripts/build-nomenclature.mjs — do not edit by hand. ' + ATTRIBUTION,
    source: 'https://github.com/STEPBible/STEPBible-Data',
    books: BOOK_IDS,
  };

  const out = (file, payload) => {
    const path = resolve(__dirname, '..', 'src', 'atlas', 'data', file);
    writeFileSync(path, JSON.stringify(payload));
    const kb = Math.round(readFileSync(path).length / 1024);
    console.log(`  ${file.padEnd(28)} ${kb} kB`);
    return kb;
  };

  console.log(`Parsed ${persons.length} persons, ${places.length} places, ${others.length} others.`);
  out('people.generated.json', {
    ...header,
    roles: people.roles,
    eras: people.eras,
    people: people.people,
  });
  out('sites.generated.json', { ...header, places: sites.places });
  out('topics.generated.json', { ...header, topics });

  const withParent = sites.places.filter((p) => p.pa).length;
  const withScript = people.people.filter((p) => p.h || p.g).length;
  console.log(`  ${withParent} sub-locations carry a parent settlement.`);
  console.log(`  ${withScript} people carry Hebrew or Greek.`);
}

main();
