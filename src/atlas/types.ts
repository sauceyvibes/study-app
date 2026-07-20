/**
 * Domain model for the atlas corpus.
 *
 * Two conventions run through this file and are load-bearing:
 *
 * 1. **Years are signed integers.** -1200 means 1200 BC, 30 means AD 30. There is
 *    no year zero in the conventional era reckoning, but treating the axis as a
 *    continuous integer line makes range arithmetic trivial and costs us nothing
 *    but a display-time adjustment (see `formatYear`).
 *
 * 2. **Uncertainty is a first-class field, never a footnote.** Any identification
 *    that is not archaeologically settled carries a `confidence` and, where the
 *    debate is live, an `alternatives` array. The UI is required to surface both.
 *    We would rather show a user three candidate sites for Sodom than silently
 *    pick one.
 */

/** A signed year on the continuous historical axis. Negative = BC. */
export type Year = number;

/** An inclusive span of years. `end: null` means "still extant". */
export interface YearRange {
  start: Year;
  end: Year | null;
}

/**
 * How firmly a site is identified with a modern location.
 *
 * - `certain`     — continuously occupied or inscriptionally confirmed (Jerusalem, Athens).
 * - `probable`    — broad scholarly consensus on the identification (Lachish = Tell ed-Duweir).
 * - `contested`   — serious published candidates disagree (Ai, Kadesh-barnea).
 * - `conjectural` — location inferred only from itinerary logic (Rameses' precise siting).
 * - `unlocated`   — named in the text, no accepted location; we still list it, off-map.
 */
export type Confidence = 'certain' | 'probable' | 'contested' | 'conjectural' | 'unlocated';

export const CONFIDENCE_ORDER: readonly Confidence[] = [
  'certain',
  'probable',
  'contested',
  'conjectural',
  'unlocated',
];

/** [longitude, latitude] — GeoJSON axis order, not the lat/lon of common speech. */
export type Coordinates = [number, number];

/** What kind of thing occupies this point. Drives symbol choice on the map. */
export type PlaceKind =
  | 'city'
  | 'town'
  | 'village'
  | 'capital'
  | 'sanctuary'
  | 'fortress'
  | 'mountain'
  | 'water'
  | 'wilderness'
  | 'region'
  | 'island';

/** A citation into a source we can name. Prevents unattributed assertions. */
export interface SourceNote {
  /** Short scholarly attribution, e.g. "Aharoni, Land of the Bible, 184". */
  citation: string;
  note: string;
}

/** A competing identification for a contested site. */
export interface Alternative {
  /** Modern site name proposed, e.g. "Tall el-Hammam". */
  site: string;
  coordinates: Coordinates | null;
  /** The case for it, stated fairly. */
  argument: string;
  proponents?: string;
}

/** A reference into the biblical text. */
export interface ScriptureRef {
  /** Canonical book id, see `books.ts`. */
  book: string;
  chapter: number;
  /** Omitted when the reference is to the chapter as a whole. */
  verse?: number;
  /** For ranges within a chapter, e.g. Acts 16:11-15. */
  verseEnd?: number;
}

/** Names a place carried in the ancient languages. */
export interface AncientNames {
  hebrew?: string;
  hebrewTranslit?: string;
  greek?: string;
  greekTranslit?: string;
  /** Egyptian, Akkadian, Latin, Aramaic forms as attested. */
  other?: { language: string; form: string }[];
}

/** The core entity: a place on the map. */
export interface Place {
  id: string;
  /** Primary name as an English reader of the Bible would meet it. */
  name: string;
  /** Other biblical or historical names for the same site. Fed into search. */
  aliases: string[];
  /** Present-day name of the site or the nearest modern settlement. */
  modernName: string | null;
  ancientNames: AncientNames;
  coordinates: Coordinates | null;
  kind: PlaceKind;
  confidence: Confidence;
  /** Years the site is relevant to the biblical narrative, not total occupation. */
  occupation: YearRange;
  /** Ids from `periods.ts` in which this place is worth drawing. */
  periods: string[];
  scripture: ScriptureRef[];
  /** Person ids from `people.ts`. */
  people: string[];
  /** Event ids from `events.ts`. */
  events: string[];
  /** Polity ids from `polities.ts` that controlled or claimed the site. */
  polities: string[];
  /** Two to four sentences of substance. Not marketing copy. */
  description: string;
  /** Excavation history, stratigraphy, inscriptional finds. */
  archaeology?: string;
  alternatives?: Alternative[];
  sources: SourceNote[];
}

/** A named stretch of history the timeline can snap to. */
export interface Period {
  id: string;
  name: string;
  range: YearRange;
  /** One paragraph orienting the reader. */
  summary: string;
  /** Which books are principally set here. */
  books: string[];
}

/** A person the atlas can locate. */
export interface Person {
  id: string;
  name: string;
  aliases: string[];
  ancientNames: AncientNames;
  /** Approximate floruit; deliberately coarse for patriarchal figures. */
  floruit: YearRange;
  role: string;
  description: string;
  /** Place ids, roughly in narrative order. */
  places: string[];
  scripture: ScriptureRef[];
}

/** A datable happening tied to one or more places. */
export interface HistoricalEvent {
  id: string;
  name: string;
  /** Best-estimate year; `range` carries the honest uncertainty. */
  year: Year;
  range: YearRange;
  description: string;
  places: string[];
  people: string[];
  scripture: ScriptureRef[];
  /** Where the date comes from — regnal synchronism, eponym list, etc. */
  dating?: string;
}

/** One leg of a journey. */
export interface JourneyLeg {
  fromPlace: string;
  toPlace: string;
  /** Overland, by sea, or an inferred connection with no attested road. */
  mode: 'land' | 'sea' | 'inferred';
  scripture: ScriptureRef[];
  note?: string;
}

/** A traced route: Abraham's migration, the Exodus, a Pauline voyage. */
export interface Journey {
  id: string;
  name: string;
  traveler: string;
  range: YearRange;
  periods: string[];
  summary: string;
  legs: JourneyLeg[];
  scripture: ScriptureRef[];
  /** Honest statement of how firm the route reconstruction is. */
  routeConfidence: Confidence;
  sources: SourceNote[];
}

/** A kingdom or empire whose extent the map can shade. */
export interface Polity {
  id: string;
  name: string;
  range: YearRange;
  /** Coarse territorial extent. Ancient borders were zones, not lines — see note. */
  extent: GeoJSON.Polygon | GeoJSON.MultiPolygon | null;
  color: string;
  summary: string;
  capitalPlaceId: string | null;
  sources: SourceNote[];
}

/** A book of the canon, with the historical window it depicts. */
export interface BookMeta {
  id: string;
  name: string;
  /** Testament and canonical grouping, for the book picker's layout. */
  testament: 'old' | 'new';
  division: string;
  chapters: number;
  /** The period the *narrative* occupies, which is often not when it was written. */
  narrativeRange: YearRange;
  /** Period ids the book's action falls within. */
  periods: string[];
  /**
   * Places mentioned, indexed by chapter. A book present here with an empty map
   * is a book we have not yet indexed — the UI must say so rather than imply the
   * book mentions no places.
   */
  placesByChapter: Record<number, string[]>;
  /** True once every chapter of this book has been indexed against the gazetteer. */
  indexed: boolean;
}

/** Everything, assembled. */
export interface AtlasCorpus {
  places: Place[];
  periods: Period[];
  people: Person[];
  events: HistoricalEvent[];
  journeys: Journey[];
  polities: Polity[];
  books: BookMeta[];
}
