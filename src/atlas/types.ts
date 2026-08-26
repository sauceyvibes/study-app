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

/**
 * What kind of witness an outside source is.
 *
 * The distinction is not decoration. A reader weighing whether Ephesus really
 * held a riot in a theatre seating twenty-four thousand should be able to see at
 * a glance that Luke's account is corroborated by an excavated building
 * (`excavation`) and by a geographer writing a generation earlier (`geographer`),
 * and that those are different kinds of claim from a Christian historian writing
 * three centuries later (`historian`).
 */
export type WitnessKind =
  | 'historian'
  | 'geographer'
  | 'inscription'
  | 'papyrus'
  | 'excavation'
  | 'reference';

/**
 * A witness from outside the biblical text.
 *
 * This is the atlas's answer to "who else says so". Josephus on the temple
 * porticoes, Strabo on the harbour at Ephesus, the Gallio inscription at Delphi,
 * the Pilate stone from Caesarea — each named, located in its own work, and
 * linked to a public-domain text where one exists, so the claim can be checked
 * rather than taken.
 */
export interface ExternalSource {
  /** The ancient author, or the excavator/institution for material evidence. */
  author: string;
  /** The work, inscription or report. */
  work: string;
  /** Book and section, catalogue number, or stratum — however that work is cited. */
  locus?: string;
  /** Roughly when the witness was written, for weighing distance from the events. */
  date?: string;
  kind: WitnessKind;
  /** What this witness actually says about the entry. Stated fairly. */
  note: string;
  /** A public-domain text or catalogue record, where one exists. */
  url?: string;
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
  /**
   * The settlement this place sits inside or beside.
   *
   * A gate, a portico, a pool or a lecture hall is not a rival to the city that
   * contains it, and drawing it as one would clutter the plate at every zoom.
   * Recording the containment lets the map hold both: the city at a glance, and
   * its named interior once the reader has zoomed in far enough to want it.
   */
  parentPlaceId?: string | null;
  /** `in` for a location within the settlement, `near` for one in its vicinity. */
  siteRelation?: 'in' | 'near';
  /** Disambiguated Strong's numbers, which key the lexicon and concordance links. */
  strongs?: string[];
  /** Witnesses from outside the biblical text. */
  externalSources?: ExternalSource[];
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

/**
 * Who a named figure is, at the coarsest useful grain.
 *
 * `group` is not a person at all — it is a people reckoned from an ancestor, the
 * Perizzites or the Cherethites, which the sources name exactly as they name
 * individuals. Keeping them in the same collection is right (they share every
 * field that matters) but the interface must not offer a group a biography.
 */
export type PersonKind = 'male' | 'female' | 'group';

/** Family links, as the genealogies give them. */
export interface PersonRelations {
  father?: string;
  mother?: string;
  siblings: string[];
  partners: string[];
  offspring: string[];
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
  kind?: PersonKind;
  /** Tribe or nation as the source assigns it, e.g. "Tribe of Levi", "Edom". */
  tribe?: string;
  /** Period ids the figure's lifetime falls within. */
  periods?: string[];
  /** Family links by person id, resolved against this same collection. */
  relations?: PersonRelations;
  /** Disambiguated Strong's numbers for every form of the name. */
  strongs?: string[];
  sources?: SourceNote[];
  externalSources?: ExternalSource[];
}

/**
 * Something named in the text that is not a person and not a place.
 *
 * Gods and angels, festivals and months, sects and schools, musical directions
 * in the psalm headings, the constellations of Job. A study tool has to let you
 * look these up — "Pharisee", "Passover", "Selah", "Molech" are exactly the words
 * a reader stops on — but none of them has a location, and a map that pinned
 * them would be inventing geography the text does not have. So they live in
 * search and in their own panel, and never on the plate.
 */
export type TopicCategory =
  | 'deity'
  | 'festival'
  | 'month'
  | 'people-group'
  | 'title'
  | 'music'
  | 'star'
  | 'other';

export interface Topic {
  id: string;
  name: string;
  aliases: string[];
  ancientNames: AncientNames;
  category: TopicCategory;
  /** The source's own one-line classification, e.g. "Name of the 1st month". */
  role: string;
  description: string;
  scripture: ScriptureRef[];
  strongs?: string[];
  sources: SourceNote[];
  externalSources?: ExternalSource[];
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
  /**
   * The line colour that identifies this route on the map and in the key. Each
   * journey gets its own hue so overlapping itineraries (Paul's four) stay
   * legible; travel mode is shown by line style, not colour.
   */
  color: string;
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

/**
 * What sort of area a territory is.
 *
 * Kept apart from `Polity` on purpose. A polity is a power — it has a capital, it
 * makes war, it ends. A territory is a name for a piece of ground: the Roman
 * province of Asia, the region of Galilee, the allotment of Judah. Paul writes to
 * "the churches of Asia" and Luke has the Spirit forbid him to speak the word in
 * Asia; the reader needs that shaded on the map the way the empire is, but Asia
 * is not an empire and saying so would be wrong.
 */
export type TerritoryCategory = 'province' | 'region' | 'tribal-allotment' | 'district';

/** A named area the map can shade. */
export interface Territory {
  id: string;
  name: string;
  aliases: string[];
  ancientNames: AncientNames;
  category: TerritoryCategory;
  /** Years the name denotes this area. Provinces have sharp dates; regions do not. */
  range: YearRange;
  /**
   * Coarse extent, at about a degree of resolution. As with polities these are
   * zones, not surveyed boundaries — and for a Roman province the landward edge
   * is frequently a scholarly reconstruction rather than a recorded line.
   */
  extent: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  color: string;
  summary: string;
  /** The gazetteer point of the same name, where one exists. */
  placeId?: string | null;
  /** The polity that governed it, e.g. Rome for a Roman province. */
  polityId?: string | null;
  scripture: ScriptureRef[];
  sources: SourceNote[];
  externalSources?: ExternalSource[];
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
  territories: Territory[];
  topics: Topic[];
  books: BookMeta[];
}
