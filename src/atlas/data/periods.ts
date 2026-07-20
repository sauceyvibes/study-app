import type { Period } from '../types';

/**
 * The timeline's spine.
 *
 * Boundaries between periods are scholarly conventions, not events — the "Divided
 * Monarchy" did not begin on a particular morning. Where a boundary is genuinely
 * disputed (most sharply, the date of the Exodus) the summary says so rather than
 * the app quietly picking a side.
 *
 * Dates for the monarchy follow the Thiele/Galil synchronisms, which are the most
 * widely used reconstruction of the Hebrew regnal data. Neo-Assyrian and
 * Neo-Babylonian anchors come from the Assyrian eponym canon and the Babylonian
 * Chronicles, which are fixed to the day by astronomical records.
 */
export const PERIODS: Period[] = [
  {
    id: 'patriarchal',
    name: 'The Patriarchal Age',
    range: { start: -2100, end: -1550 },
    summary:
      'The migrations of Abraham, Isaac, Jacob and Joseph, from Ur and Harran into Canaan and finally into Egypt. No extrabiblical text names any patriarch, so the period is dated by cultural fit rather than synchronism: the personal names, the price of a slave, the treaty forms and the pattern of tent-dwelling pastoralism moving between unwalled highland sites all suit the Middle Bronze Age. Estimates for Abraham range across roughly three centuries.',
    books: ['genesis', 'job'],
  },
  {
    id: 'egypt-exodus',
    name: 'Egypt and the Exodus',
    range: { start: -1550, end: -1200 },
    summary:
      'Israel in Egypt, the departure, and the wilderness generation. Two reconstructions hold the field. The early date (c. 1446 BC) takes 1 Kings 6:1 at face value. The late date (c. 1250 BC) follows the store-city name Rameses and the destruction layers at several Canaanite sites. The atlas carries both and marks which sites each depends on.',
    books: ['exodus', 'leviticus', 'numbers', 'deuteronomy'],
  },
  {
    id: 'conquest-judges',
    name: 'Settlement and the Judges',
    range: { start: -1200, end: -1050 },
    summary:
      'Israel takes shape in the central highlands. Survey archaeology shows a sharp rise in small unwalled villages in the hill country in Iron Age I, with a distinctive material culture. How that settlement relates to the campaigns in Joshua is one of the most contested questions in the field; the atlas presents the biblical itinerary and the excavation record side by side without collapsing them.',
    books: ['joshua', 'judges', 'ruth'],
  },
  {
    id: 'united-monarchy',
    name: 'The United Monarchy',
    range: { start: -1050, end: -931 },
    summary:
      'Saul, David and Solomon. Jerusalem becomes a capital and a sanctuary city. The Tel Dan inscription (9th c. BC) refers to the "House of David", establishing the dynasty as historical; the territorial reach of the united kingdom remains debated between maximalist and minimalist readings of the tenth-century strata.',
    books: ['1samuel', '2samuel', '1kings', '1chronicles', 'psalms', 'proverbs', 'ecclesiastes', 'songofsongs'],
  },
  {
    id: 'divided-monarchy',
    name: 'The Divided Monarchy',
    range: { start: -931, end: -722 },
    summary:
      'After Solomon the kingdom splits: Israel in the north under Jeroboam, Judah in the south under Rehoboam. This is the best-attested stretch of Israelite history, with Israelite and Judahite kings named in Assyrian royal inscriptions and the Moabite Mesha Stele. It ends with the Assyrian destruction of Samaria in 722 BC.',
    books: ['1kings', '2kings', '2chronicles', 'amos', 'hosea', 'jonah', 'micah', 'isaiah'],
  },
  {
    id: 'judah-alone',
    name: 'Judah Alone',
    range: { start: -722, end: -586 },
    summary:
      'The northern kingdom is gone; Judah survives as an Assyrian and then Babylonian vassal. Sennacherib\'s 701 BC campaign, recorded in his own annals, on the Lachish reliefs and in 2 Kings, is the single best-documented event in the Hebrew Bible. The period closes with the Babylonian destruction of Jerusalem.',
    books: ['2kings', '2chronicles', 'isaiah', 'jeremiah', 'nahum', 'habakkuk', 'zephaniah'],
  },
  {
    id: 'exile',
    name: 'The Babylonian Exile',
    range: { start: -586, end: -538 },
    summary:
      'Jerusalem and the temple are destroyed and the Judahite elite deported to Babylonia. Cuneiform ration tablets from Babylon name Jehoiachin of Judah and his sons, and the Al-Yahudu archive documents a Judean community settled on the Chebar canal — the exile is visible in the administrative record, not only the biblical one.',
    books: ['ezekiel', 'daniel', 'lamentations', 'obadiah'],
  },
  {
    id: 'return',
    name: 'Return and Restoration',
    range: { start: -538, end: -332 },
    summary:
      'Cyrus takes Babylon and permits repatriation of deported peoples, a policy independently attested on the Cyrus Cylinder. Judah becomes the small Persian province of Yehud. The temple is rebuilt, and later Jerusalem\'s walls under Nehemiah.',
    books: ['ezra', 'nehemiah', 'esther', 'haggai', 'zechariah', 'malachi', 'joel'],
  },
  {
    id: 'second-temple',
    name: 'Hellenistic and Hasmonean',
    range: { start: -332, end: -63 },
    summary:
      'Alexander\'s conquest brings the region into the Greek world; after his death it is fought over by the Ptolemies and Seleucids. The Maccabean revolt against Antiochus IV produces an independent Jewish state under the Hasmoneans, which lasts until Pompey takes Jerusalem in 63 BC. No book of the Protestant canon narrates this period, but it forms the world the Gospels open onto.',
    books: [],
  },
  {
    id: 'roman-judea',
    name: 'Roman Judea and the Ministry of Jesus',
    range: { start: -63, end: 70 },
    summary:
      'Herodian client kingship under Rome, then direct prefectural rule. Jesus\' ministry falls in the late 20s and early 30s AD, dated by Luke\'s synchronism to the fifteenth year of Tiberius and by Pilate\'s prefecture (AD 26-36), which is confirmed by the Pilate inscription from Caesarea. The period ends with the destruction of the temple in AD 70.',
    books: ['matthew', 'mark', 'luke', 'john'],
  },
  {
    id: 'apostolic',
    name: 'The Apostolic Age',
    range: { start: 30, end: 100 },
    summary:
      'The movement spreads from Jerusalem through the synagogues and cities of the eastern Mediterranean to Rome. Paul\'s chronology is anchored by the Gallio inscription from Delphi, which fixes his Corinthian hearing to AD 51-52 and gives the whole missionary sequence a datable peg.',
    books: ['acts', 'romans', '1corinthians', '2corinthians', 'galatians', 'ephesians', 'philippians', 'colossians', '1thessalonians', '2thessalonians', '1timothy', '2timothy', 'titus', 'philemon', 'hebrews', 'james', '1peter', '2peter', '1john', '2john', '3john', 'jude', 'revelation'],
  },
];

/** The full span the timeline slider covers. */
export const TIMELINE_BOUNDS: { start: number; end: number } = {
  start: -2100,
  end: 100,
};

export const PERIOD_BY_ID: ReadonlyMap<string, Period> = new Map(
  PERIODS.map((p) => [p.id, p]),
);

/**
 * The period containing `year`, or the nearest one if the year falls outside.
 *
 * Periods overlap where the history does. AD 46 sits inside both Roman Judea
 * (63 BC – AD 70) and the Apostolic Age (AD 30 – 100), and a reader who has just
 * opened Acts expects to be told the latter. So among the candidates we take the
 * one that began most recently, which is reliably the more specific description
 * of what is happening at that moment.
 */
export function periodForYear(year: number): Period {
  const candidates = PERIODS.filter(
    (p) => year >= p.range.start && (p.range.end === null || year <= p.range.end),
  );

  if (candidates.length > 0) {
    return candidates.reduce((best, p) => (p.range.start > best.range.start ? p : best));
  }
  // Clamp to the ends rather than returning undefined; the slider is bounded, so
  // this only fires for out-of-range programmatic calls.
  return year < TIMELINE_BOUNDS.start ? PERIODS[0]! : PERIODS[PERIODS.length - 1]!;
}
