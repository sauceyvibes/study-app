// @ts-check
/*
 * Builds the comprehensive biblical gazetteer from OpenBible.info's Bible
 * Geocoding data, which catalogues every place named in the Protestant Bible,
 * disambiguates them, indexes them by verse, and rates the confidence of each
 * modern identification.
 *
 *   Source : https://github.com/openbibleinfo/Bible-Geocoding-Data
 *   License: Creative Commons Attribution (CC BY) — OpenBible.info
 *
 * This is a build-time tool, not part of `next build`. It reads the source
 * `ancient.jsonl` (download it once from the pinned URL below) and emits a
 * compact `src/atlas/data/gazetteer.generated.json`. The runtime merge with the
 * hand-curated gazetteer, and the inversion of place→refs into a chapter index,
 * happen in `src/atlas/data/gazetteer.ts` so that this file stays unaware of the
 * curated data.
 *
 * Usage:
 *   curl -L -o ancient.jsonl \
 *     https://raw.githubusercontent.com/openbibleinfo/Bible-Geocoding-Data/master/data/ancient.jsonl
 *   node scripts/build-gazetteer.mjs ancient.jsonl
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** OSIS book code → this app's book id. Codes absent here name no place in the corpus. */
const OSIS_TO_ID = {
  Gen: 'genesis', Exod: 'exodus', Lev: 'leviticus', Num: 'numbers', Deut: 'deuteronomy',
  Josh: 'joshua', Judg: 'judges', Ruth: 'ruth', '1Sam': '1samuel', '2Sam': '2samuel',
  '1Kgs': '1kings', '2Kgs': '2kings', '1Chr': '1chronicles', '2Chr': '2chronicles',
  Ezra: 'ezra', Neh: 'nehemiah', Esth: 'esther', Job: 'job', Ps: 'psalms', Prov: 'proverbs',
  Eccl: 'ecclesiastes', Song: 'songofsongs', Isa: 'isaiah', Jer: 'jeremiah', Lam: 'lamentations',
  Ezek: 'ezekiel', Dan: 'daniel', Hos: 'hosea', Joel: 'joel', Amos: 'amos', Obad: 'obadiah',
  Jonah: 'jonah', Mic: 'micah', Nah: 'nahum', Hab: 'habakkuk', Zeph: 'zephaniah', Hag: 'haggai',
  Zech: 'zechariah', Mal: 'malachi', Matt: 'matthew', Mark: 'mark', Luke: 'luke', John: 'john',
  Acts: 'acts', Rom: 'romans', '1Cor': '1corinthians', '2Cor': '2corinthians', Gal: 'galatians',
  Eph: 'ephesians', Phil: 'philippians', Col: 'colossians', '1Thess': '1thessalonians',
  '2Thess': '2thessalonians', '1Tim': '1timothy', '2Tim': '2timothy', Titus: 'titus',
  Phlm: 'philemon', Heb: 'hebrews', Jas: 'james', '1Pet': '1peter', '2Pet': '2peter',
  '1John': '1john', '2John': '2john', '3John': '3john', Jude: 'jude', Rev: 'revelation',
};

/**
 * Chapter counts, so refs cannot point past a book's end. Christian versification
 * differs from OpenBible's in a handful of books (Joel, Malachi, some Psalms); an
 * out-of-range ref is dropped rather than emitted, keeping the index valid.
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

const BOOK_IDS = Object.values(OSIS_TO_ID);
const BOOK_INDEX = new Map(BOOK_IDS.map((id, i) => [id, i]));

/** OpenBible type → this app's PlaceKind. */
function mapKind(types) {
  const t = (types && types[0]) || '';
  if (t === 'region') return 'region';
  if (t === 'island') return 'island';
  if (['mountain', 'mountain range', 'hill'].includes(t)) return 'mountain';
  if (['river', 'wadi', 'spring', 'body of water', 'pool'].includes(t)) return 'water';
  if (['valley', 'natural area', 'campsite'].includes(t)) return 'wilderness';
  return 'town';
}

/** id, name, punctuation folded; trailing disambiguation number dropped. */
function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+\d+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseLonLat(s) {
  if (!s) return null;
  const [lon, lat] = s.split(',').map(Number);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return [Math.round(lon * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5];
}

const inputPath = resolve(process.argv[2] ?? 'ancient.jsonl');
const lines = readFileSync(inputPath, 'utf8').split('\n').filter(Boolean);

const usedSlugs = new Set();
const places = [];
let droppedRefs = 0;

/** Strip OpenBible's inline <modern>…</modern> markup to plain text. */
function stripTags(html) {
  return (html || '').replace(/<[^>]+>/g, '').trim();
}

for (const line of lines) {
  const a = JSON.parse(line);
  const extra = JSON.parse(a.extra || '{}');
  const osises = extra.osises || [];

  // OpenBible's disambiguation score per candidate modern site (0–1000, and it
  // can go negative for rejected candidates). Keyed by modern id.
  const assocScore = new Map();
  for (const x of extra.associations || []) {
    if (typeof x.score === 'number') assocScore.set(x.modern_id, x.score);
  }

  // Each identification is a candidate modern site. Build candidates straight
  // from them so a coordinate is never lost to an id-matching quirk. Confidence
  // is the association score where present, otherwise the identification's own
  // time-fit total.
  const candidates = [];
  for (const idn of a.identifications || []) {
    let coord = null;
    for (const res of idn.resolutions || []) {
      coord = parseLonLat(res.lonlat);
      if (coord) break;
    }
    if (!coord) continue;
    const score = assocScore.has(idn.id) ? assocScore.get(idn.id) : idn.score?.time_total ?? 0;
    candidates.push({ name: stripTags(idn.description) || a.friendly_id, coord, score });
  }
  candidates.sort((p, q) => q.score - p.score);

  const best = candidates[0] ?? null;
  // A serious rival is a second-plus candidate scholarship actually proposes.
  const rivals = candidates.slice(1).filter((c) => c.score >= 100);

  let confidence;
  if (!best) confidence = 'unlocated';
  else if (rivals.length > 0) confidence = 'contested';
  else if (best.score >= 900) confidence = 'certain';
  else if (best.score >= 500) confidence = 'probable';
  else confidence = 'conjectural';

  // book id → set of chapters, clamped to the book's real length.
  const byBook = new Map();
  for (const osis of osises) {
    const parts = osis.split('.');
    const bookId = OSIS_TO_ID[parts[0]];
    const chapter = Number(parts[1]);
    if (!bookId || !Number.isInteger(chapter)) continue;
    if (chapter < 1 || chapter > CHAPTERS[bookId]) {
      droppedRefs += 1;
      continue;
    }
    if (!byBook.has(bookId)) byBook.set(bookId, new Set());
    byBook.get(bookId).add(chapter);
  }
  if (byBook.size === 0) continue; // no mappable reference — nothing to index

  const refs = [...byBook.entries()]
    .map(([bookId, chapters]) => [BOOK_INDEX.get(bookId), [...chapters].sort((x, y) => x - y)])
    .sort((x, y) => x[0] - y[0]);

  let slug = slugify(a.friendly_id) || a.id;
  while (usedSlugs.has(slug)) slug = `${slug}-${a.id.slice(0, 4)}`;
  usedSlugs.add(slug);

  const entry = {
    i: slug,
    n: a.friendly_id,
    nn: normalizeName(a.friendly_id),
    m: best ? best.name : null,
    c: best ? best.coord : null,
    k: mapKind(a.types),
    f: confidence,
    r: refs,
  };
  if (confidence === 'contested') {
    entry.a = rivals.slice(0, 4).map((c) => [c.name, c.coord[0], c.coord[1]]);
  }
  places.push(entry);
}

places.sort((p, q) => p.n.localeCompare(q.n));

const output = {
  _comment:
    'GENERATED by scripts/build-gazetteer.mjs — do not edit by hand. ' +
    'Places and verse references from OpenBible.info Bible Geocoding, CC BY 4.0.',
  source: 'https://github.com/openbibleinfo/Bible-Geocoding-Data',
  books: BOOK_IDS,
  places,
};

const outPath = resolve(__dirname, '../src/atlas/data/gazetteer.generated.json');
writeFileSync(outPath, JSON.stringify(output));

const located = places.filter((p) => p.c).length;
const contested = places.filter((p) => p.f === 'contested').length;
console.log(`gazetteer: ${places.length} places (${located} located, ${contested} contested)`);
console.log(`dropped ${droppedRefs} out-of-range refs`);
console.log(`wrote ${outPath} (${(readFileSync(outPath).length / 1024).toFixed(0)} KB)`);
