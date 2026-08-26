import type {
  AncientNames,
  Person,
  PersonKind,
  PersonRelations,
  ScriptureRef,
  SourceNote,
  Topic,
  TopicCategory,
} from '../types';
import generated from './people.generated.json';
import topicData from './topics.generated.json';
import { PEOPLE as CURATED_PEOPLE } from './people';
import { MINOR_PEOPLE } from './people-minor';

/**
 * The comprehensive nomenclature: every person the Bible names, and everything
 * named that is neither a person nor a place.
 *
 *   Source: STEPBible TIPNR, Tyndale House Cambridge, CC BY 4.0
 *           https://github.com/STEPBible/STEPBible-Data
 *
 * The same two-layer arrangement the gazetteer uses for places. A hand-written
 * core of major figures carries real biography; the comprehensive layer under it
 * carries the other three thousand, each with the thing that actually makes a
 * minor name useful to a reader — who their father was, which of the seven
 * Zechariahs they are, and every chapter that names *them* rather than their
 * namesake.
 *
 * Two jobs happen here, both at module load and both cheap:
 *
 *  1. **Curated people win.** A curated entry keeps its prose and its ordered
 *     itinerary, and absorbs the matching TIPNR record's ancient names, Strong's
 *     numbers, family links and exhaustive references. Matching is by name *and*
 *     evidence — see `chooseMatch`, because there are five Marys and eleven
 *     Josephs and picking the wrong one would put the Magdalene's references
 *     under the mother of Jesus.
 *
 *  2. **Descriptions are generated, not shipped.** TIPNR carries prose written
 *     by an AI in 2024 and marked as such by STEPBible. It is not carried here.
 *     Instead every description is composed from the structured facts — role,
 *     tribe, era, family, reference count — which are Tyndale House's editorial
 *     work and are checkable. An atlas that advertises its sources should not
 *     quietly seat unverified prose beside them.
 */

interface RawPerson {
  /** slug id */ i: string;
  /** name */ n: string;
  /** aliases */ a?: string[];
  /** hebrew */ h?: string;
  /** greek */ g?: string;
  /** disambiguated Strong's */ s?: string[];
  /** m | f | group */ t: string;
  /** era index */ e: number;
  /** role index */ ro?: number;
  /** tribe index */ tr?: number;
  /** father id */ fa?: string;
  /** mother id */ mo?: string;
  /** sibling ids */ sb?: string[];
  /** partner ids */ pa?: string[];
  /** offspring ids */ of?: string[];
  /** references: [bookIndex, chapters[]] */ r: [number, number[]][];
}

interface RawEra {
  key: string;
  start: number;
  end: number;
  periods: string[];
}

interface RawTopic {
  i: string;
  n: string;
  a?: string[];
  h?: string;
  g?: string;
  s?: string[];
  /** TIPNR type: Supernatural, Time, Musical, Group, Title, Star, Other */ t: string;
  /** the source's own classification line */ ro: string;
  /** summary */ d: string;
  r: [number, number[]][];
}

const BOOK_IDS: string[] = generated.books;
const ROLES: string[] = generated.roles;
const ERAS: RawEra[] = generated.eras as RawEra[];
const RAW: RawPerson[] = generated.people as RawPerson[];
const RAW_TOPICS: RawTopic[] = topicData.topics as RawTopic[];

export const TIPNR_SOURCE: SourceNote = {
  citation: 'STEPBible TIPNR (Tyndale House Cambridge), CC BY 4.0',
  note: 'Individuation, ancient-language forms, family relations and the exhaustive reference list.',
};

export const NOMENCLATURE_ATTRIBUTION =
  'Personal names, family relations and ancient-language forms from STEPBible TIPNR, ' +
  'a work of Tyndale House Cambridge, licensed CC BY 4.0.';

// ── Shared helpers ───────────────────────────────────────────────────────────

function refsToScripture(raw: [number, number[]][]): ScriptureRef[] {
  const out: ScriptureRef[] = [];
  for (const [bookIdx, chapters] of raw) {
    const book = BOOK_IDS[bookIdx];
    if (!book) continue;
    for (const chapter of chapters) out.push({ book, chapter });
  }
  return out;
}

function refCount(raw: [number, number[]][]): number {
  return raw.reduce((sum, [, chapters]) => sum + chapters.length, 0);
}

function ancientNamesOf(raw: { h?: string; g?: string }): AncientNames {
  const names: AncientNames = {};
  if (raw.h) names.hebrew = raw.h;
  if (raw.g) names.greek = raw.g;
  return names;
}

const KIND: Record<string, PersonKind> = { m: 'male', f: 'female', group: 'group' };

/** Human-readable era phrases, for the generated description. */
const ERA_PHRASE: Record<string, string> = {
  antediluvian: 'before the Flood',
  patriarchal: 'in the patriarchal age',
  'egypt-exodus': 'in the age of Egypt and the Exodus',
  conquest: 'at the settlement of Canaan',
  judges: 'before the monarchy',
  'united-monarchy': 'under the united monarchy',
  'divided-monarchy': 'under the divided monarchy',
  'exile-return': 'in the exile and the return',
  'new-testament': 'in the New Testament period',
  spanning: 'across the monarchy',
  unplaced: '',
};

/**
 * The role without its era clause.
 *
 * TIPNR writes "High Priest living at the time of Egypt and Wilderness" — the
 * office and the period welded together. The atlas already shows the period, and
 * shows it on a timeline, so repeating it in the sentence is noise.
 */
function titleOf(role: string): string {
  return role.replace(/\s+living\s+(at the time of|before|in)\b.*$/i, '').trim() || 'Person';
}

/** "Nadab, Abihu, Eleazar and Ithamar" — an English list, not a comma-joined array. */
function listNames(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// ── People ───────────────────────────────────────────────────────────────────

const RAW_BY_ID = new Map(RAW.map((p) => [p.i, p]));

/**
 * Compose the description from the structured facts.
 *
 * Everything in the sentence is checkable against a field: the office, the tribe,
 * the era, the count of chapters, and the family links the genealogies give. For
 * a figure named once in a list — which is what most of three thousand names are
 * — this is genuinely all there is to say, and saying exactly that is more use to
 * a reader than a paragraph of inference would be.
 */
function describePerson(raw: RawPerson, nameOf: (id: string) => string | undefined): string {
  const role = raw.ro !== undefined ? ROLES[raw.ro] ?? '' : '';
  const tribe = raw.tr !== undefined ? ROLES[raw.tr] ?? '' : '';
  const era = ERAS[raw.e];
  const phrase = era ? ERA_PHRASE[era.key] ?? '' : '';
  const count = refCount(raw.r);
  const books = raw.r.length;

  const sentences: string[] = [];

  if (raw.t === 'group') {
    const opening = role || 'A people';
    sentences.push(phrase ? `${opening}, ${phrase}.` : `${opening}.`);
  } else {
    const title = titleOf(role);
    const of = tribe ? ` of the ${tribe.replace(/^Tribe of /, 'tribe of ')}` : '';
    sentences.push(phrase ? `${title}${of}, ${phrase}.` : `${title}${of}.`);
  }

  sentences.push(
    count === 1
      ? 'Named once in the biblical text.'
      : `Named across ${count} chapters in ${books} ${books === 1 ? 'book' : 'books'}.`,
  );

  // Family, in the order the genealogies themselves run.
  const clauses: string[] = [];
  const parents = [raw.fa, raw.mo].map((id) => (id ? nameOf(id) : undefined)).filter(Boolean) as string[];
  if (parents.length) clauses.push(`child of ${listNames(parents)}`);
  const siblings = (raw.sb ?? []).map(nameOf).filter(Boolean) as string[];
  if (siblings.length) clauses.push(`sibling of ${listNames(siblings)}`);
  const partners = (raw.pa ?? []).map(nameOf).filter(Boolean) as string[];
  if (partners.length) clauses.push(`married to ${listNames(partners)}`);
  const offspring = (raw.of ?? []).map(nameOf).filter(Boolean) as string[];
  if (offspring.length) clauses.push(`parent of ${listNames(offspring)}`);
  if (clauses.length) {
    const joined = listNames(clauses);
    sentences.push(`${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`);
  }

  return sentences.join(' ');
}

function relationsOf(raw: RawPerson): PersonRelations | undefined {
  const relations: PersonRelations = {
    siblings: raw.sb ?? [],
    partners: raw.pa ?? [],
    offspring: raw.of ?? [],
  };
  if (raw.fa) relations.father = raw.fa;
  if (raw.mo) relations.mother = raw.mo;
  const empty =
    !relations.father &&
    !relations.mother &&
    relations.siblings.length === 0 &&
    relations.partners.length === 0 &&
    relations.offspring.length === 0;
  return empty ? undefined : relations;
}

// ── Matching the curated core against the comprehensive layer ────────────────

/** Lowercase, drop diacritics and punctuation. */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const STOPWORDS = new Set([
  'of', 'the', 'a', 'an', 'and', 'at', 'in', 'to', 'living', 'time', 'man', 'woman',
  'son', 'daughter', 'from', 'who', 'his', 'her', 'their',
]);

function contentWords(text: string): Set<string> {
  return new Set(
    normalizeName(text)
      .split(' ')
      .filter((word) => word.length > 2 && !STOPWORDS.has(word)),
  );
}

/**
 * Pick which comprehensive record a curated figure is.
 *
 * Name alone is not enough and never was: TIPNR holds five Marys, eleven Josephs
 * and seven Zechariahs, and the alphabetically-first of them is rarely the famous
 * one. Three signals decide it, in descending weight:
 *
 *  - **Shared references.** A curated entry's key passages appearing in a
 *    candidate's reference list is near-conclusive; nothing else comes close.
 *  - **Shared role words.** The minor-figure entries carry no references at all,
 *    so their one-line role has to do the work — and it does, because "Mother of
 *    Jesus" and TIPNR's "Jesus' mother" share the two words that matter.
 *  - **An overlapping lifetime**, and then sheer prominence as a last resort:
 *    absent any other signal, a bare name most likely means the best-attested
 *    bearer of it.
 */
function chooseMatch(curated: Person, candidates: RawPerson[]): RawPerson | undefined {
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  const curatedRefs = new Set(curated.scripture.map((ref) => `${ref.book} ${ref.chapter}`));
  const curatedRole = contentWords(`${curated.role} ${curated.aliases.join(' ')}`);

  let best: { raw: RawPerson; score: number } | undefined;
  for (const raw of candidates) {
    let score = 0;

    for (const [bookIdx, chapters] of raw.r) {
      const book = BOOK_IDS[bookIdx];
      if (!book) continue;
      for (const chapter of chapters) {
        if (curatedRefs.has(`${book} ${chapter}`)) score += 10;
      }
    }

    const role = raw.ro !== undefined ? ROLES[raw.ro] ?? '' : '';
    for (const word of contentWords(role)) {
      if (curatedRole.has(word)) score += 4;
    }

    const era = ERAS[raw.e];
    if (era && era.start <= (curated.floruit.end ?? era.end) && era.end >= curated.floruit.start) {
      score += 2;
    }

    // Prominence, scaled so it only ever breaks a tie.
    score += Math.min(1.5, refCount(raw.r) / 200);

    if (!best || score > best.score) best = { raw, score };
  }

  return best?.raw;
}

/**
 * The curated core, in one list. `people.ts` and `people-minor.ts` are separate
 * files for editorial reasons, not modelling ones.
 *
 * Where the two files share an id the full biography wins — except that a shared
 * id is usually a mistake rather than a duplicate. `joseph` named both the
 * patriarch and the husband of Mary, and the husband of Mary silently vanished
 * from the atlas; the minor entry is re-keyed rather than dropped.
 */
const CURATED: Person[] = (() => {
  const byId = new Map<string, Person>();
  for (const person of CURATED_PEOPLE) byId.set(person.id, person);
  for (const person of MINOR_PEOPLE) {
    if (!byId.has(person.id)) {
      byId.set(person.id, person);
      continue;
    }
    const distinct = `${person.id}-${normalizeName(person.role).replace(/ /g, '-')}`;
    if (!byId.has(distinct)) byId.set(distinct, { ...person, id: distinct });
  }
  return [...byId.values()];
})();

// ── Assembly ─────────────────────────────────────────────────────────────────

/** Candidate records for a name, keyed by the normalized name and every alias. */
const rawByName = new Map<string, RawPerson[]>();
for (const raw of RAW) {
  for (const label of [raw.n, ...(raw.a ?? [])]) {
    const key = normalizeName(label);
    if (!key) continue;
    const list = rawByName.get(key) ?? [];
    if (!list.includes(raw)) list.push(raw);
    rawByName.set(key, list);
  }
}

/** raw id → the curated id it was folded into. */
const rawToCuratedId = new Map<string, string>();
const mergedRawIds = new Set<string>();

for (const curated of CURATED) {
  const keys = new Set([normalizeName(curated.name), ...curated.aliases.map(normalizeName)]);
  const candidates = [...keys]
    .flatMap((key) => rawByName.get(key) ?? [])
    .filter((raw) => !mergedRawIds.has(raw.i));
  const unique = [...new Set(candidates)];

  const chosen = chooseMatch(curated, unique);
  if (chosen) {
    mergedRawIds.add(chosen.i);
    rawToCuratedId.set(chosen.i, curated.id);
  }
}

/**
 * Final ids. A merged record takes the curated id; an unmerged one keeps its own
 * slug, deconflicted so it can never shadow a curated entry — which would be a
 * duplicate id in the corpus and would silently hide one of the two.
 */
const finalIdByRaw = new Map<string, string>();
const usedIds = new Set(CURATED.map((p) => p.id));
for (const raw of RAW) {
  if (mergedRawIds.has(raw.i)) {
    finalIdByRaw.set(raw.i, rawToCuratedId.get(raw.i)!);
    continue;
  }
  let id = raw.i;
  while (usedIds.has(id)) id = `${id}-person`;
  usedIds.add(id);
  finalIdByRaw.set(raw.i, id);
}

const CURATED_BY_ID = new Map(CURATED.map((person) => [person.id, person]));

/**
 * Display name for a relation link, resolved through the merge — so Aaron's
 * brother reads "Moses" under the curated spelling rather than the source's.
 */
function nameOfRaw(rawId: string): string | undefined {
  const raw = RAW_BY_ID.get(rawId);
  if (!raw) return undefined;
  const finalId = finalIdByRaw.get(rawId);
  const curated = finalId ? CURATED_BY_ID.get(finalId) : undefined;
  return curated?.name ?? raw.n;
}

/** Rewrite a relation list from raw ids onto the merged ids. */
function mapRelations(relations: PersonRelations | undefined): PersonRelations | undefined {
  if (!relations) return undefined;
  const map = (id: string) => finalIdByRaw.get(id) ?? id;
  const mapped: PersonRelations = {
    siblings: relations.siblings.map(map),
    partners: relations.partners.map(map),
    offspring: relations.offspring.map(map),
  };
  if (relations.father) mapped.father = map(relations.father);
  if (relations.mother) mapped.mother = map(relations.mother);
  return mapped;
}

function hydratePerson(raw: RawPerson): Person {
  const era = ERAS[raw.e]!;
  const role = raw.ro !== undefined ? ROLES[raw.ro] ?? '' : '';
  const tribe = raw.tr !== undefined ? ROLES[raw.tr] ?? '' : '';

  const person: Person = {
    id: finalIdByRaw.get(raw.i)!,
    name: raw.n,
    aliases: raw.a ?? [],
    ancientNames: ancientNamesOf(raw),
    floruit: { start: era.start, end: era.end },
    role: titleOf(role),
    description: describePerson(raw, nameOfRaw),
    places: [],
    scripture: refsToScripture(raw.r),
    kind: KIND[raw.t] ?? 'male',
    periods: era.periods,
    sources: [TIPNR_SOURCE],
  };
  if (tribe) person.tribe = tribe;
  if (raw.s?.length) person.strongs = raw.s;
  const relations = mapRelations(relationsOf(raw));
  if (relations) person.relations = relations;
  return person;
}

/**
 * The curated entry, enriched with everything its matched record knows that it
 * does not. Prose, floruit and the ordered itinerary stay curated; ancient names
 * fill in only where the curated entry left them blank.
 */
function enrichCurated(curated: Person, raw: RawPerson | undefined): Person {
  if (!raw) return curated;
  const era = ERAS[raw.e]!;
  const tribe = raw.tr !== undefined ? ROLES[raw.tr] ?? '' : '';

  // The curated references are verse-precise and the comprehensive ones are
  // chapter-level, so the union is taken per chapter: a chapter the curated
  // entry already cites keeps its verse, and every other chapter is added.
  const scripture = [...curated.scripture];
  const covered = new Set(scripture.map((ref) => `${ref.book} ${ref.chapter}`));
  for (const ref of refsToScripture(raw.r)) {
    const key = `${ref.book} ${ref.chapter}`;
    if (covered.has(key)) continue;
    covered.add(key);
    scripture.push(ref);
  }

  const enriched: Person = {
    ...curated,
    aliases: [...new Set([...curated.aliases, ...(raw.a ?? [])])].filter((a) => a !== curated.name),
    ancientNames: {
      ...ancientNamesOf(raw),
      ...curated.ancientNames,
    },
    scripture,
    kind: KIND[raw.t] ?? 'male',
    periods: era.periods,
    sources: [...(curated.sources ?? []), TIPNR_SOURCE],
  };
  if (tribe && !enriched.tribe) enriched.tribe = tribe;
  if (raw.s?.length) enriched.strongs = raw.s;
  const relations = mapRelations(relationsOf(raw));
  if (relations) enriched.relations = relations;
  return enriched;
}

const curatedRawById = new Map<string, RawPerson>();
for (const [rawId, curatedId] of rawToCuratedId) {
  const raw = RAW_BY_ID.get(rawId);
  if (raw) curatedRawById.set(curatedId, raw);
}

/** Curated first, so their richer entries win any id lookup. */
export const ALL_PEOPLE: Person[] = [
  ...CURATED.map((person) => enrichCurated(person, curatedRawById.get(person.id))),
  ...RAW.filter((raw) => !mergedRawIds.has(raw.i)).map(hydratePerson),
];

// ── Topics ───────────────────────────────────────────────────────────────────

/**
 * TIPNR's own type words, mapped to categories the interface can group by.
 *
 * "Group" here means a religious or ethnic body named as such — Pharisee,
 * Sadducee, Nazirite, Nicolaitan — as distinct from the peoples reckoned from an
 * ancestor, which the source files under persons and this atlas leaves there.
 */
const TOPIC_CATEGORY: Record<string, TopicCategory> = {
  Supernatural: 'deity',
  Time: 'festival',
  Musical: 'music',
  Group: 'people-group',
  Title: 'title',
  Star: 'star',
  Other: 'other',
};

/** Months are festivals' near neighbours in the source; separate them by their own words. */
function categoriseTopic(raw: RawTopic): TopicCategory {
  const base = TOPIC_CATEGORY[raw.t.trim()] ?? 'other';
  if (base === 'festival' && /\bmonth\b/i.test(raw.ro)) return 'month';
  return base;
}

export const TOPICS: Topic[] = RAW_TOPICS.map((raw) => {
  const topic: Topic = {
    id: raw.i,
    name: raw.n,
    aliases: raw.a ?? [],
    ancientNames: ancientNamesOf(raw),
    category: categoriseTopic(raw),
    role: raw.ro,
    description: raw.d,
    scripture: refsToScripture(raw.r),
    sources: [TIPNR_SOURCE],
  };
  if (raw.s?.length) topic.strongs = raw.s;
  return topic;
});

/** Diagnostics for the integrity tests, so a broken merge fails loudly. */
export const NOMENCLATURE_STATS = {
  rawPeople: RAW.length,
  curated: CURATED.length,
  merged: mergedRawIds.size,
  topics: TOPICS.length,
};
