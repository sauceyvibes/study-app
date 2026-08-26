import type { Territory } from '../types';

/**
 * Named areas the map can shade: Roman provinces, geographical regions, and the
 * tribal allotments.
 *
 * The same caution the polities carry applies here and then some: **these are not
 * borders.** A Roman province had a governor and a tax register, but its landward
 * edge was frequently a matter of which community was assessed with which, and
 * the maps in every atlas of the empire disagree with each other by tens of
 * kilometres. The regions are looser still — Gilead and the Shephelah are
 * landforms with names, not jurisdictions — and the tribal allotments in Joshua
 * are a text before they are a map, describing boundaries by a run of towns and
 * landmarks that cannot all be located. Every polygon here is drawn to about a
 * degree of resolution and should be read as a wash of colour saying "around
 * here", never as a line.
 *
 * Why these are separate from `polities.ts`. A polity is a power: it has a
 * capital, it makes war, it falls. A territory is a name for ground. Paul is
 * "forbidden by the Holy Spirit to speak the word in Asia" and writes to "the
 * seven churches that are in Asia"; a reader needs Asia shaded exactly as the
 * empire is shaded, but Asia is not an empire and modelling it as one would put
 * a false claim on the map. Keeping the two collections apart also lets the
 * reader turn one on without the other, which matters when three washes overlap
 * the same coastline.
 */

const ROME_SOURCE = {
  citation: 'Talbert (ed.), Barrington Atlas of the Greek and Roman World',
  note: 'The standard reference for provincial extents; the boundaries drawn here are generalised from it.',
};

const JOSHUA_SOURCE = {
  citation: 'Joshua 13-19, with Aharoni, The Land of the Bible, 235-262',
  note: 'The allotment boundaries are reconstructed from the town lists; many of the towns named are unlocated, so the outlines are approximate throughout.',
};

/** Muted washes that sit inside the parchment plate rather than on top of it. */
const PROVINCE_COLOR = '#6A5A6E';
const REGION_COLOR = '#6E7F5C';

// ── Roman provinces of the New Testament world ───────────────────────────────

const PROVINCES: Territory[] = [
  {
    id: 'province-asia',
    name: 'Asia',
    aliases: ['Province of Asia', 'Roman Asia', 'Asia Minor (province)'],
    ancientNames: { greek: 'Ἀσία' },
    category: 'province',
    range: { start: -133, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[26.0, 40.3], [27.3, 40.4], [29.5, 39.9], [30.7, 38.9], [30.3, 37.7], [28.9, 36.8], [27.2, 36.6], [26.3, 37.6], [26.1, 38.9], [26.0, 40.3]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'Western Asia Minor, bequeathed to Rome by the last king of Pergamum in 133 BC and governed as a senatorial province from Ephesus. It is the densest concentration of New Testament geography outside Judea: the seven churches of Revelation all stand inside it, Paul spends two years at its capital, and "all the residents of Asia heard the word of the Lord" is a claim about this administrative unit. When Acts says the Spirit forbade Paul to speak the word in Asia, it means the province, not the continent.',
    placeId: 'asia',
    polityId: 'rome',
    scripture: [
      { book: 'acts', chapter: 16, verse: 6 },
      { book: 'acts', chapter: 19, verse: 10 },
      { book: 'acts', chapter: 19, verse: 22 },
      { book: '1corinthians', chapter: 16, verse: 19 },
      { book: '2corinthians', chapter: 1, verse: 8 },
      { book: '1peter', chapter: 1, verse: 1 },
      { book: 'revelation', chapter: 1, verse: 4 },
    ],
    sources: [ROME_SOURCE],
    externalSources: [
      {
        author: 'Strabo',
        work: 'Geography',
        locus: '13-14',
        date: 'c. AD 20',
        kind: 'geographer',
        note: 'Two whole books describe the coast and interior of this province city by city, written within a generation of Paul.',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0198',
      },
      {
        author: 'Tacitus',
        work: 'Annals',
        locus: '4.55-56',
        date: 'c. AD 116',
        kind: 'historian',
        note: 'Reports eleven cities of Asia competing before the senate for the right to build a second temple of the imperial cult — the civic rivalry that lies behind Revelation\'s letters to seven of them.',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0078',
      },
    ],
  },
  {
    id: 'province-macedonia',
    name: 'Macedonia',
    aliases: ['Province of Macedonia'],
    ancientNames: { greek: 'Μακεδονία' },
    category: 'province',
    range: { start: -146, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[19.9, 41.9], [22.0, 42.2], [24.2, 41.9], [25.5, 41.2], [24.5, 40.4], [23.0, 40.0], [22.0, 39.6], [20.5, 40.5], [19.9, 41.9]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'Northern Greece, annexed in 146 BC and crossed by the Via Egnatia, the trunk road from the Adriatic to Byzantium. The vision of the man of Macedonia turns Paul west into it, and Philippi, Thessalonica and Berea — the three cities of that first European leg — are all on the road within it. Its congregations remain the ones Paul writes about most warmly and takes money from most reluctantly.',
    placeId: 'macedonia',
    polityId: 'rome',
    scripture: [
      { book: 'acts', chapter: 16, verse: 9, verseEnd: 12 },
      { book: 'acts', chapter: 20, verse: 1 },
      { book: 'romans', chapter: 15, verse: 26 },
      { book: '2corinthians', chapter: 8, verse: 1, verseEnd: 5 },
      { book: 'philippians', chapter: 4, verse: 15 },
    ],
    sources: [ROME_SOURCE],
    externalSources: [
      {
        author: 'Strabo',
        work: 'Geography',
        locus: '7.7.4',
        date: 'c. AD 20',
        kind: 'geographer',
        note: 'Describes the Via Egnatia and gives its length in miles from Apollonia across to the Hebrus — the road every Macedonian city in Acts sits on.',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0198',
      },
    ],
  },
  {
    id: 'province-achaia',
    name: 'Achaia',
    aliases: ['Province of Achaia', 'Achaea'],
    ancientNames: { greek: 'Ἀχαΐα' },
    category: 'province',
    range: { start: -146, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[20.7, 39.2], [22.5, 39.4], [24.0, 38.6], [24.2, 37.6], [23.2, 36.4], [22.0, 36.4], [21.1, 37.4], [20.7, 38.4], [20.7, 39.2]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'Southern Greece, governed from Corinth by a proconsul — which is the office Gallio held when Paul was brought before him, and the reason that hearing can be dated to the year. Athens and Corinth, the two cities of Acts 17-18, are both inside it, and it is one of the two provinces Paul names when he describes the collection for Jerusalem.',
    placeId: 'achaia',
    polityId: 'rome',
    scripture: [
      { book: 'acts', chapter: 18, verse: 12 },
      { book: 'acts', chapter: 18, verse: 27 },
      { book: 'romans', chapter: 15, verse: 26 },
      { book: '1corinthians', chapter: 16, verse: 15 },
      { book: '2corinthians', chapter: 9, verse: 2 },
    ],
    sources: [ROME_SOURCE],
    externalSources: [
      {
        author: 'Gallio inscription',
        work: 'Rescript of Claudius, Delphi',
        locus: 'SIG³ 801D',
        date: 'AD 52',
        kind: 'inscription',
        note: 'Names Gallio as proconsul of Achaia and is dated by imperial acclamation, fixing his term to about AD 51-52 — the anchor for the whole Pauline chronology.',
      },
      {
        author: 'Pausanias',
        work: 'Description of Greece',
        locus: 'books 1-8',
        date: 'c. AD 160',
        kind: 'geographer',
        note: 'A city-by-city description of this province a century after Paul, and the reason its topography is better known than almost anywhere else in the ancient world.',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0160',
      },
    ],
  },
  {
    id: 'province-galatia',
    name: 'Galatia',
    aliases: ['Province of Galatia'],
    ancientNames: { greek: 'Γαλατία' },
    category: 'province',
    range: { start: -25, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[30.5, 39.0], [32.0, 40.8], [34.5, 40.5], [35.5, 39.0], [34.5, 37.3], [32.5, 37.0], [31.0, 37.6], [30.5, 39.0]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'A large inland province created in 25 BC, taking in the old Celtic Galatia in the north and Pisidia and Lycaonia in the south. Which of the two Paul addresses is the oldest live question in Pauline studies: the southern reading puts Galatians among the cities of the first journey — Antioch of Pisidia, Iconium, Lystra, Derbe — and allows an early date; the northern reading puts it among people Acts never names and pushes the letter later.',
    placeId: 'galatia',
    polityId: 'rome',
    scripture: [
      { book: 'acts', chapter: 16, verse: 6 },
      { book: 'acts', chapter: 18, verse: 23 },
      { book: 'galatians', chapter: 1, verse: 2 },
      { book: '1corinthians', chapter: 16, verse: 1 },
      { book: '1peter', chapter: 1, verse: 1 },
    ],
    sources: [
      ROME_SOURCE,
      { citation: 'Ramsay, The Church in the Roman Empire; Mitchell, Anatolia I-II', note: 'The classic statement of the south-Galatian case, and the modern survey of the province.' },
    ],
  },
  {
    id: 'province-cappadocia',
    name: 'Cappadocia',
    aliases: ['Province of Cappadocia'],
    ancientNames: { greek: 'Καππαδοκία' },
    category: 'province',
    range: { start: 17, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.5, 40.3], [36.5, 40.6], [38.5, 39.6], [38.3, 38.0], [36.5, 37.4], [34.8, 37.6], [34.5, 40.3]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'The high volcanic plateau of eastern Asia Minor, annexed by Tiberius in AD 17. Cappadocians are among the pilgrims at Pentecost, and 1 Peter is addressed to exiles scattered across it — evidence for Jewish and then Christian communities well inland, away from the coastal cities the narrative of Acts follows.',
    placeId: 'cappadocia',
    polityId: 'rome',
    scripture: [
      { book: 'acts', chapter: 2, verse: 9 },
      { book: '1peter', chapter: 1, verse: 1 },
    ],
    sources: [ROME_SOURCE],
  },
  {
    id: 'province-bithynia-pontus',
    name: 'Bithynia and Pontus',
    aliases: ['Bithynia', 'Pontus', 'Province of Bithynia'],
    ancientNames: { greek: 'Βιθυνία καὶ Πόντος' },
    category: 'province',
    range: { start: -63, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[28.8, 40.6], [30.0, 41.3], [33.0, 42.1], [37.0, 41.6], [39.5, 41.0], [38.5, 40.2], [35.0, 40.6], [32.0, 40.2], [29.6, 40.2], [28.8, 40.6]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'The Black Sea coast of Asia Minor, a single province from 63 BC. Paul tries to enter Bithynia and is prevented, and turns west to Troas and the crossing to Europe instead — so the province is defined in Acts by a road not taken. Both its halves appear in the address of 1 Peter, and Aquila was a Jew of Pontus.',
    placeId: 'bithynia',
    polityId: 'rome',
    scripture: [
      { book: 'acts', chapter: 2, verse: 9 },
      { book: 'acts', chapter: 16, verse: 7 },
      { book: 'acts', chapter: 18, verse: 2 },
      { book: '1peter', chapter: 1, verse: 1 },
    ],
    sources: [ROME_SOURCE],
    externalSources: [
      {
        author: 'Pliny the Younger',
        work: 'Letters',
        locus: '10.96-97',
        date: 'c. AD 112',
        kind: 'historian',
        note: 'Writing as governor of this province, Pliny asks Trajan how to try Christians, describes their practice of meeting before dawn to sing to Christ "as to a god", and reports the movement spread through villages and countryside. It is the earliest non-Christian description of Christian worship, and it comes from one of the two provinces 1 Peter addresses.',
      },
    ],
  },
  {
    id: 'province-cilicia',
    name: 'Cilicia',
    aliases: ['Province of Cilicia'],
    ancientNames: { greek: 'Κιλικία' },
    category: 'province',
    range: { start: -64, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[32.5, 36.4], [34.0, 37.2], [36.3, 37.1], [36.6, 36.2], [35.5, 36.0], [34.0, 36.2], [32.5, 36.0], [32.5, 36.4]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'The coastal plain and mountains of south-eastern Asia Minor, with Tarsus as its chief city — so this is Paul\'s home province, and the "no ordinary city" of his answer to the tribune is in it. He spends the silent years after his conversion in "the regions of Syria and Cilicia", and the Jerusalem council\'s letter is addressed to the believers there.',
    placeId: 'cilicia',
    polityId: 'rome',
    scripture: [
      { book: 'acts', chapter: 15, verse: 23 },
      { book: 'acts', chapter: 21, verse: 39 },
      { book: 'acts', chapter: 22, verse: 3 },
      { book: 'acts', chapter: 23, verse: 34 },
      { book: 'galatians', chapter: 1, verse: 21 },
    ],
    sources: [ROME_SOURCE],
  },
  {
    id: 'province-pamphylia-lycia',
    name: 'Pamphylia and Lycia',
    aliases: ['Pamphylia', 'Lycia'],
    ancientNames: { greek: 'Παμφυλία' },
    category: 'province',
    range: { start: 43, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[29.0, 36.9], [31.5, 37.2], [32.4, 36.7], [31.0, 36.2], [29.6, 36.1], [28.9, 36.4], [29.0, 36.9]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'The southern coast of Asia Minor. Perga in Pamphylia is where John Mark leaves the first journey and goes home — the desertion that splits Paul and Barnabas two chapters later. Myra in Lycia is where the centurion escorting Paul to Rome transfers him to an Alexandrian grain ship, and Patara is a port he sails from.',
    placeId: 'pamphylia',
    polityId: 'rome',
    scripture: [
      { book: 'acts', chapter: 2, verse: 10 },
      { book: 'acts', chapter: 13, verse: 13 },
      { book: 'acts', chapter: 21, verse: 1 },
      { book: 'acts', chapter: 27, verse: 5 },
    ],
    sources: [ROME_SOURCE],
  },
  {
    id: 'province-syria',
    name: 'Syria',
    aliases: ['Province of Syria', 'Roman Syria'],
    ancientNames: { greek: 'Συρία' },
    category: 'province',
    range: { start: -64, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.0, 37.2], [38.5, 37.0], [39.0, 35.0], [37.0, 33.2], [35.9, 32.6], [35.2, 33.1], [35.1, 35.5], [35.0, 37.2]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'The great eastern province, governed from Antioch by a legate with legions — and, until AD 6, the authority Judea answered to, which is why Luke dates the census by "Quirinius, governor of Syria". Antioch is where the disciples were first called Christians and where both of the first two missionary journeys begin and end.',
    placeId: 'syria-1',
    polityId: 'rome',
    scripture: [
      { book: 'matthew', chapter: 4, verse: 24 },
      { book: 'luke', chapter: 2, verse: 2 },
      { book: 'acts', chapter: 11, verse: 26 },
      { book: 'acts', chapter: 15, verse: 23 },
      { book: 'galatians', chapter: 1, verse: 21 },
    ],
    sources: [ROME_SOURCE],
    externalSources: [
      {
        author: 'Josephus',
        work: 'Antiquities of the Jews',
        locus: '18.1-4',
        date: 'c. AD 94',
        kind: 'historian',
        note: 'Records Quirinius arriving as legate of Syria to assess Judea after Archelaus\' deposition, and the revolt the census provoked. The relation between this census and Luke 2:2 is one of the sharpest chronological problems in the New Testament.',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0146',
      },
    ],
  },
  {
    id: 'province-judaea',
    name: 'Judaea (Roman province)',
    aliases: ['Provincia Iudaea', 'Roman Judea'],
    ancientNames: { greek: 'Ἰουδαία' },
    category: 'province',
    range: { start: 6, end: 135 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.4, 31.2], [34.9, 32.5], [35.3, 32.9], [35.9, 32.3], [35.9, 31.1], [35.3, 30.8], [34.5, 30.9], [34.4, 31.2]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'The Roman province created in AD 6 when Archelaus was deposed, governed by a prefect from Caesarea and answerable to the legate of Syria. Its extent shifted repeatedly — Galilee was under Antipas for most of the Gospel period and the whole was briefly reunited under Agrippa I — so the outline here is the province at its ordinary first-century extent, not a fixed thing.',
    placeId: 'judea-1',
    polityId: 'rome',
    scripture: [
      { book: 'luke', chapter: 3, verse: 1 },
      { book: 'acts', chapter: 12, verse: 19 },
      { book: 'acts', chapter: 23, verse: 34 },
      { book: 'acts', chapter: 26, verse: 30 },
    ],
    sources: [ROME_SOURCE],
    externalSources: [
      {
        author: 'Pilate stone',
        work: 'Latin dedicatory inscription, Israel Museum',
        locus: 'found at Caesarea, 1961',
        date: 'AD 26-36',
        kind: 'inscription',
        note: 'Gives the governor\'s title in this period as praefectus rather than procurator — a correction to Tacitus that the Gospels\' vaguer ἡγεμών happens to survive.',
      },
      {
        author: 'Tacitus',
        work: 'Annals',
        locus: '15.44',
        date: 'c. AD 116',
        kind: 'historian',
        note: 'Refers to "Christus", executed under Tiberius by the procurator Pontius Pilate — the earliest surviving Roman notice of the crucifixion, written from this province\'s records or their reputation.',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0078',
      },
    ],
  },
  {
    id: 'province-crete',
    name: 'Crete',
    aliases: ['Creta'],
    ancientNames: { greek: 'Κρήτη' },
    category: 'province',
    range: { start: -67, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[23.5, 35.3], [24.8, 35.7], [26.3, 35.3], [26.2, 34.9], [24.7, 34.9], [23.5, 35.1], [23.5, 35.3]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'The island, joined with Cyrenaica as one province. The ship carrying Paul to Rome coasts along its southern shore and shelters at Fair Havens, and the decision to press on from there for a better harbour is what puts them into the storm. Titus is left on the island to appoint elders town by town.',
    placeId: null,
    polityId: 'rome',
    scripture: [
      { book: 'acts', chapter: 2, verse: 11 },
      { book: 'acts', chapter: 27, verse: 7, verseEnd: 13 },
      { book: 'titus', chapter: 1, verse: 5 },
    ],
    sources: [ROME_SOURCE],
  },
  {
    id: 'province-cyprus',
    name: 'Cyprus',
    aliases: ['Kypros'],
    ancientNames: { greek: 'Κύπρος' },
    category: 'province',
    range: { start: -58, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[32.3, 35.2], [34.0, 35.7], [34.6, 35.5], [34.0, 34.6], [32.9, 34.6], [32.3, 34.9], [32.3, 35.2]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'Barnabas\' home island and the first stop of the first missionary journey, crossed from Salamis to Paphos. Luke calls its governor a proconsul, which is correct for a senatorial province and would have been wrong a few decades earlier — one of the small administrative accuracies that recommend his account.',
    placeId: null,
    polityId: 'rome',
    scripture: [
      { book: 'acts', chapter: 4, verse: 36 },
      { book: 'acts', chapter: 13, verse: 4, verseEnd: 12 },
      { book: 'acts', chapter: 15, verse: 39 },
      { book: 'acts', chapter: 27, verse: 4 },
    ],
    sources: [ROME_SOURCE],
    externalSources: [
      {
        author: 'Cypriot proconsular inscriptions',
        work: 'Inscriptions from Soloi and Rome naming the Sergii Paulli',
        kind: 'inscription',
        note: 'Attest the family in the island\'s administration in the right period. Whether any names the Sergius Paulus of Acts 13 is disputed, but the office and the family are both securely on Cyprus.',
      },
    ],
  },
  {
    id: 'province-illyricum',
    name: 'Illyricum',
    aliases: ['Dalmatia'],
    ancientNames: { greek: 'Ἰλλυρικόν' },
    category: 'province',
    range: { start: -27, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[15.5, 44.5], [19.0, 44.0], [19.8, 42.4], [18.5, 42.2], [16.0, 43.4], [15.5, 44.5]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'The Adriatic hinterland north-west of Macedonia. Paul tells the Romans he has preached "from Jerusalem and as far round as Illyricum" — the furthest north-west point he claims, and the outer edge of the mission before he turns his mind to Spain. Titus later goes to Dalmatia, the province\'s southern half.',
    placeId: null,
    polityId: 'rome',
    scripture: [
      { book: 'romans', chapter: 15, verse: 19 },
      { book: '2timothy', chapter: 4, verse: 10 },
    ],
    sources: [ROME_SOURCE],
  },
  {
    id: 'region-italy',
    name: 'Italy',
    aliases: ['Italia'],
    ancientNames: { greek: 'Ἰταλία' },
    category: 'province',
    range: { start: -100, end: 476 },
    extent: {
      type: 'Polygon',
      coordinates: [[[7.6, 44.1], [10.5, 46.4], [13.6, 46.5], [13.5, 45.6], [18.5, 40.2], [17.9, 39.9], [15.6, 37.9], [15.9, 40.0], [12.3, 41.3], [10.2, 42.9], [8.2, 44.4], [7.6, 44.1]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'Not a province but the peninsula itself, exempt from provincial government. Aquila and Priscilla have "recently come from Italy" because Claudius expelled the Jews from Rome; the centurion who takes Paul north belongs to the Augustan Cohort and sails for Italy; and the journey that ends at Puteoli and then up the Appian Way is the last movement in Acts.',
    placeId: null,
    polityId: 'rome',
    scripture: [
      { book: 'acts', chapter: 18, verse: 2 },
      { book: 'acts', chapter: 27, verse: 1 },
      { book: 'acts', chapter: 28, verse: 13, verseEnd: 16 },
      { book: 'hebrews', chapter: 13, verse: 24 },
    ],
    sources: [ROME_SOURCE],
    externalSources: [
      {
        author: 'Suetonius',
        work: 'Life of Claudius',
        locus: '25.4',
        date: 'c. AD 121',
        kind: 'historian',
        note: 'Records Claudius expelling the Jews from Rome because they were "constantly rioting at the instigation of Chrestus" — the expulsion Acts 18:2 gives as the reason Aquila and Priscilla were in Corinth when Paul arrived.',
        url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Suetonius/12Caesars/home.html',
      },
    ],
  },
  {
    id: 'region-spain',
    name: 'Spain',
    aliases: ['Hispania', 'Tarshish (traditional)'],
    ancientNames: { greek: 'Σπανία' },
    category: 'province',
    range: { start: -197, end: 476 },
    extent: {
      type: 'Polygon',
      coordinates: [[[-9.3, 43.8], [-1.8, 43.4], [3.3, 41.9], [-0.5, 38.0], [-5.6, 36.0], [-9.0, 37.0], [-9.5, 41.0], [-9.3, 43.8]]],
    },
    color: PROVINCE_COLOR,
    summary:
      'The western limit of Paul\'s ambition. He tells the Romans twice that he means to go on to Spain and hopes to be sent there by them — the reason Romans is written at all, on the usual reading. Whether he ever went is unknown; Acts ends before it, and the earliest claim that he reached "the limit of the west" is a sentence in Clement that may or may not mean Spain.',
    placeId: null,
    polityId: 'rome',
    scripture: [
      { book: 'romans', chapter: 15, verse: 24 },
      { book: 'romans', chapter: 15, verse: 28 },
    ],
    sources: [ROME_SOURCE],
    externalSources: [
      {
        author: 'Clement of Rome',
        work: '1 Clement',
        locus: '5.7',
        date: 'c. AD 96',
        kind: 'historian',
        note: 'Says Paul taught righteousness to the whole world and came "to the limit of the west" before his witness before the rulers. Written at Rome within a generation, which is why it is taken seriously — but from Rome the phrase could as easily mean Rome itself.',
      },
    ],
  },
];

// ── Regions of the land ──────────────────────────────────────────────────────

const REGIONS: Territory[] = [
  {
    id: 'region-galilee',
    name: 'Galilee',
    aliases: ['The Galilee', 'Galilee of the Gentiles'],
    ancientNames: { hebrew: 'גָּלִיל', hebrewTranslit: 'Galil', greek: 'Γαλιλαία' },
    category: 'region',
    range: { start: -900, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.0, 32.7], [35.1, 33.3], [35.6, 33.3], [35.7, 32.7], [35.5, 32.5], [35.1, 32.6], [35.0, 32.7]]],
    },
    color: REGION_COLOR,
    summary:
      'The northern hill country and the lake basin below it, under Herod Antipas through the whole of the Gospel period and never part of the prefecture. Almost all of Jesus\' public activity happens inside this outline, and its distance from Jerusalem — three days\' walk, with Samaria in between — is the background to a great deal of what the Gospels report about how he was received.',
    placeId: 'galilee-1',
    polityId: 'herodian',
    scripture: [
      { book: 'isaiah', chapter: 9, verse: 1 },
      { book: 'matthew', chapter: 4, verse: 12, verseEnd: 17 },
      { book: 'mark', chapter: 1, verse: 14 },
      { book: 'luke', chapter: 3, verse: 1 },
      { book: 'john', chapter: 4, verse: 43, verseEnd: 45 },
      { book: 'acts', chapter: 9, verse: 31 },
    ],
    sources: [
      { citation: 'Aharoni, The Land of the Bible, 32-35', note: 'On the Upper and Lower Galilee as distinct landforms.' },
    ],
    externalSources: [
      {
        author: 'Josephus',
        work: 'The Jewish War',
        locus: '3.35-43',
        date: 'c. AD 75',
        kind: 'historian',
        note: 'Gives the boundaries of Upper and Lower Galilee, its fertility and its population — and, as its commander in the revolt, from first-hand knowledge of the ground.',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0147',
      },
    ],
  },
  {
    id: 'region-samaria',
    name: 'Samaria',
    aliases: ['Samaritan country'],
    ancientNames: { hebrew: 'שֹׁמְרוֹן', hebrewTranslit: 'Shomron', greek: 'Σαμάρεια' },
    category: 'region',
    range: { start: -880, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.9, 32.1], [35.0, 32.6], [35.6, 32.6], [35.5, 32.0], [35.1, 31.95], [34.9, 32.1]]],
    },
    color: REGION_COLOR,
    summary:
      'The central hill country between Judea and Galilee, and the reason travellers between them either went through it or went round. Its people worshipped on Mount Gerizim rather than at Jerusalem, which is the point at issue in the conversation at Jacob\'s well and the edge that gives the parable of the good Samaritan its force. Philip\'s mission there in Acts 8 is the first step of the gospel outside Judaism proper.',
    placeId: 'samaria-2',
    polityId: 'rome',
    scripture: [
      { book: '2kings', chapter: 17, verse: 24, verseEnd: 41 },
      { book: 'luke', chapter: 10, verse: 33 },
      { book: 'luke', chapter: 17, verse: 11 },
      { book: 'john', chapter: 4, verse: 4, verseEnd: 42 },
      { book: 'acts', chapter: 1, verse: 8 },
      { book: 'acts', chapter: 8, verse: 5, verseEnd: 25 },
    ],
    sources: [],
    externalSources: [
      {
        author: 'Josephus',
        work: 'Antiquities of the Jews',
        locus: '18.29-30; 20.118-136',
        date: 'c. AD 94',
        kind: 'historian',
        note: 'Records Samaritans scattering bones in the temple courts at a Passover, and a later killing of Galilean pilgrims crossing Samaria that brought the province to the edge of war — the hostility Luke 9:53 assumes.',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0146',
      },
    ],
  },
  {
    id: 'region-judea',
    name: 'Judea',
    aliases: ['Judaea', 'The hill country of Judah'],
    ancientNames: { hebrew: 'יְהוּדָה', hebrewTranslit: 'Yehudah', greek: 'Ἰουδαία' },
    category: 'region',
    range: { start: -931, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.9, 31.2], [34.9, 31.95], [35.5, 31.95], [35.6, 31.3], [35.2, 31.0], [34.9, 31.2]]],
    },
    color: REGION_COLOR,
    summary:
      'The southern hill country around Jerusalem, ridged and dry, dropping east to the Dead Sea and west through the Shephelah to the coastal plain. Used loosely in the Gospels for the whole south and precisely for this upland; the wilderness on its eastern side is where John baptised and where Qumran sits.',
    placeId: 'judea-2',
    polityId: 'rome',
    scripture: [
      { book: 'matthew', chapter: 2, verse: 1 },
      { book: 'matthew', chapter: 3, verse: 1 },
      { book: 'luke', chapter: 1, verse: 39 },
      { book: 'john', chapter: 11, verse: 7 },
      { book: 'acts', chapter: 1, verse: 8 },
    ],
    sources: [],
  },
  {
    id: 'region-idumea',
    name: 'Idumea',
    aliases: ['Idumaea'],
    ancientNames: { greek: 'Ἰδουμαία' },
    category: 'region',
    range: { start: -400, end: 135 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.7, 30.6], [34.8, 31.3], [35.4, 31.2], [35.3, 30.5], [34.9, 30.4], [34.7, 30.6]]],
    },
    color: REGION_COLOR,
    summary:
      'The southern district settled by Edomites after the fall of Judah, forcibly converted to Judaism under the Hasmonean John Hyrcanus around 110 BC — which is how Herod the Great came to be an Idumean and a Jew, and why his legitimacy was always in question. Crowds come from here to hear Jesus in Mark 3.',
    placeId: null,
    polityId: 'herodian',
    scripture: [{ book: 'mark', chapter: 3, verse: 8 }],
    sources: [],
    externalSources: [
      {
        author: 'Josephus',
        work: 'Antiquities of the Jews',
        locus: '13.257-258',
        date: 'c. AD 94',
        kind: 'historian',
        note: 'Records Hyrcanus subduing the Idumeans and permitting them to stay only on condition of circumcision and the laws of the Jews — the event that produced the Herodian dynasty a few generations later.',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0146',
      },
    ],
  },
  {
    id: 'region-perea',
    name: 'Perea',
    aliases: ['Peraea', 'Beyond the Jordan'],
    ancientNames: { greek: 'Περαία' },
    category: 'region',
    range: { start: -100, end: 135 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.55, 31.5], [35.6, 32.3], [36.0, 32.3], [36.0, 31.4], [35.7, 31.3], [35.55, 31.5]]],
    },
    color: REGION_COLOR,
    summary:
      'The strip east of the Jordan held by Herod Antipas along with Galilee, which is why a Galilean travelling to Jerusalem could go down the east bank and avoid Samaria — the route behind the "beyond the Jordan" passages. John was imprisoned and killed at Machaerus inside it.',
    placeId: null,
    polityId: 'herodian',
    scripture: [
      { book: 'matthew', chapter: 19, verse: 1 },
      { book: 'mark', chapter: 10, verse: 1 },
      { book: 'john', chapter: 10, verse: 40 },
    ],
    sources: [],
    externalSources: [
      {
        author: 'Josephus',
        work: 'Antiquities of the Jews',
        locus: '18.116-119',
        date: 'c. AD 94',
        kind: 'historian',
        note: 'Reports John the Baptist\'s execution at Machaerus, giving Antipas\' motive as fear of the crowd\'s response to his preaching rather than the dance the Gospels describe — an independent notice of the same event with a different explanation.',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0146',
      },
    ],
  },
  {
    id: 'region-decapolis',
    name: 'The Decapolis',
    aliases: ['Decapolis', 'The Ten Cities'],
    ancientNames: { greek: 'Δεκάπολις' },
    category: 'region',
    range: { start: -63, end: 300 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.6, 32.2], [35.7, 33.0], [36.5, 32.9], [36.6, 32.1], [36.0, 31.9], [35.6, 32.2]]],
    },
    color: REGION_COLOR,
    summary:
      'A league of Greek cities east and south-east of the lake — Gerasa, Gadara, Pella, Scythopolis and the rest — Hellenistic in culture and largely Gentile in population. The healed demoniac is sent home to proclaim what happened "in the Decapolis", and the presence of a large herd of pigs in that account is a fact about this region rather than an oddity.',
    placeId: 'decapolis',
    polityId: 'rome',
    scripture: [
      { book: 'matthew', chapter: 4, verse: 25 },
      { book: 'mark', chapter: 5, verse: 20 },
      { book: 'mark', chapter: 7, verse: 31 },
    ],
    sources: [],
    externalSources: [
      {
        author: 'Pliny the Elder',
        work: 'Natural History',
        locus: '5.74',
        date: 'c. AD 77',
        kind: 'historian',
        note: 'Gives the earliest surviving list of the ten cities and notes that authorities disagree about which they are — so even in antiquity the membership was not fixed.',
        url: 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0137',
      },
    ],
  },
  {
    id: 'region-ituraea-trachonitis',
    name: 'Ituraea and Trachonitis',
    aliases: ['Ituraea', 'Trachonitis', 'Gaulanitis'],
    ancientNames: { greek: 'Ἰτουραία καὶ Τραχωνῖτις' },
    category: 'region',
    range: { start: -30, end: 100 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.7, 33.0], [35.9, 33.7], [36.9, 33.5], [36.8, 32.8], [36.0, 32.8], [35.7, 33.0]]],
    },
    color: REGION_COLOR,
    summary:
      'The volcanic uplands north-east of the lake, ruled by Herod Philip, who rebuilt Paneas as Caesarea Philippi. Luke names this tetrarchy in his six-fold synchronism dating the start of John\'s preaching — an unusually specific piece of dating for an unusually obscure territory, and one that has held up.',
    placeId: null,
    polityId: 'herodian',
    scripture: [{ book: 'luke', chapter: 3, verse: 1 }],
    sources: [],
  },
  {
    id: 'region-gilead',
    name: 'Gilead',
    aliases: ['The land of Gilead'],
    ancientNames: { hebrew: 'גִּלְעָד', hebrewTranslit: 'Gilad' },
    category: 'region',
    range: { start: -1400, end: 100 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.6, 31.9], [35.7, 32.6], [36.2, 32.6], [36.2, 31.8], [35.8, 31.7], [35.6, 31.9]]],
    },
    color: REGION_COLOR,
    summary:
      'The wooded highland east of the Jordan, split by the Jabbok. Jacob and Laban make their covenant here, Jephthah and Elijah come from it, and its balm is proverbial enough that Jeremiah can ask whether there is any. Reuben, Gad and half of Manasseh settle it.',
    placeId: null,
    polityId: null,
    scripture: [
      { book: 'genesis', chapter: 31, verse: 21, verseEnd: 25 },
      { book: 'numbers', chapter: 32, verse: 1 },
      { book: 'judges', chapter: 11, verse: 1 },
      { book: '1kings', chapter: 17, verse: 1 },
      { book: 'jeremiah', chapter: 8, verse: 22 },
    ],
    sources: [],
  },
  {
    id: 'region-bashan',
    name: 'Bashan',
    aliases: ['The land of Bashan'],
    ancientNames: { hebrew: 'בָּשָׁן', hebrewTranslit: 'Bashan' },
    category: 'region',
    range: { start: -1400, end: -100 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.8, 32.6], [35.9, 33.3], [36.8, 33.2], [36.7, 32.6], [35.8, 32.6]]],
    },
    color: REGION_COLOR,
    summary:
      'The high basalt plain north-east of the lake, taken from Og and given to half of Manasseh. Its pasture was famous — the "bulls of Bashan" of Psalm 22 and the "cows of Bashan" of Amos are both drawing on the same reputation for well-fed cattle — and its oaks stand alongside the cedars of Lebanon in the prophets.',
    placeId: null,
    polityId: null,
    scripture: [
      { book: 'numbers', chapter: 21, verse: 33, verseEnd: 35 },
      { book: 'deuteronomy', chapter: 3, verse: 1, verseEnd: 13 },
      { book: 'psalms', chapter: 22, verse: 12 },
      { book: 'amos', chapter: 4, verse: 1 },
    ],
    sources: [],
  },
  {
    id: 'region-negev',
    name: 'The Negev',
    aliases: ['Negeb', 'The South'],
    ancientNames: { hebrew: 'נֶגֶב', hebrewTranslit: 'Negev' },
    category: 'region',
    range: { start: -2000, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.3, 30.0], [34.4, 31.3], [35.3, 31.3], [35.4, 30.2], [34.9, 29.6], [34.3, 30.0]]],
    },
    color: REGION_COLOR,
    summary:
      'The dry south, below the line where rainfall stops supporting settled farming. Abraham and Isaac move through it between wells; it is the Simeonite allotment on paper and pastoral country in practice; and the caravan route to the Red Sea and to Arabia runs across it, which is what made Beersheba and later Petra worth holding.',
    placeId: null,
    polityId: null,
    scripture: [
      { book: 'genesis', chapter: 12, verse: 9 },
      { book: 'genesis', chapter: 20, verse: 1 },
      { book: 'numbers', chapter: 13, verse: 17 },
      { book: 'joshua', chapter: 15, verse: 21 },
    ],
    sources: [
      { citation: 'Aharoni, The Land of the Bible, 27-31', note: 'On the Negev as a rainfall boundary rather than a political one.' },
    ],
  },
  {
    id: 'region-shephelah',
    name: 'The Shephelah',
    aliases: ['The lowland', 'The foothills'],
    ancientNames: { hebrew: 'שְׁפֵלָה', hebrewTranslit: 'Shephelah' },
    category: 'region',
    range: { start: -1400, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.75, 31.3], [34.8, 31.85], [35.1, 31.85], [35.05, 31.3], [34.75, 31.3]]],
    },
    color: REGION_COLOR,
    summary:
      'The belt of low chalk hills between the coastal plain and the Judean highland, cut by five valleys running east. It is the frontier zone between Israel and Philistia — the Elah valley fight, Samson\'s raids, the fortress line at Lachish and Azekah — and Sennacherib\'s stripping of its towns in 701 BC is what reduced Judah to the hill country alone.',
    placeId: null,
    polityId: 'judah',
    scripture: [
      { book: 'joshua', chapter: 15, verse: 33, verseEnd: 44 },
      { book: '1samuel', chapter: 17, verse: 1, verseEnd: 3 },
      { book: '2kings', chapter: 18, verse: 13 },
      { book: '2chronicles', chapter: 28, verse: 18 },
    ],
    sources: [],
    externalSources: [
      {
        author: 'Sennacherib\'s Annals and the Lachish reliefs',
        work: 'Taylor Prism; palace reliefs, British Museum',
        locus: 'Nineveh, Room XXXVI',
        date: '701-691 BC',
        kind: 'inscription',
        note: 'Claim forty-six walled cities of Judah taken, and depict the siege of Lachish in detail — the ramp, the siege engines, the deportation. The ramp itself was later excavated at the site.',
      },
    ],
  },
  {
    id: 'region-sharon',
    name: 'The Plain of Sharon',
    aliases: ['Sharon'],
    ancientNames: { hebrew: 'שָׁרוֹן', hebrewTranslit: 'Sharon' },
    category: 'region',
    range: { start: -1400, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.75, 32.0], [34.85, 32.55], [35.05, 32.5], [34.95, 31.95], [34.75, 32.0]]],
    },
    color: REGION_COLOR,
    summary:
      'The coastal plain between Joppa and Carmel, marshy and oak-forested in antiquity rather than the farmland it is now — which is why the international highway skirted its inland edge instead of running down the middle of it. Peter\'s healing of Aeneas at Lydda is heard of "by all the residents of Lydda and Sharon".',
    placeId: null,
    polityId: null,
    scripture: [
      { book: '1chronicles', chapter: 27, verse: 29 },
      { book: 'songofsongs', chapter: 2, verse: 1 },
      { book: 'isaiah', chapter: 35, verse: 2 },
      { book: 'acts', chapter: 9, verse: 35 },
    ],
    sources: [],
  },
  {
    id: 'region-jezreel-valley',
    name: 'The Jezreel Valley',
    aliases: ['Esdraelon', 'Valley of Jezreel', 'Plain of Megiddo'],
    ancientNames: { hebrew: 'עֵמֶק יִזְרְעֶאל', hebrewTranslit: 'Emeq Yizreel' },
    category: 'region',
    range: { start: -2000, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.0, 32.5], [35.05, 32.75], [35.55, 32.65], [35.5, 32.4], [35.0, 32.5]]],
    },
    color: REGION_COLOR,
    summary:
      'The broad flat valley cutting north-west across the country between Galilee and Samaria — the only easy passage between the coast and the Jordan, which is why the international highway runs through it and why so much fighting happened here. Deborah and Barak, Gideon, Saul at Gilboa, Josiah at Megiddo, and, in Revelation, Armageddon: the mountain of Megiddo at its western end.',
    placeId: null,
    polityId: null,
    scripture: [
      { book: 'joshua', chapter: 17, verse: 16 },
      { book: 'judges', chapter: 5, verse: 19, verseEnd: 21 },
      { book: 'judges', chapter: 6, verse: 33 },
      { book: '1samuel', chapter: 31, verse: 1 },
      { book: '2kings', chapter: 23, verse: 29 },
      { book: 'revelation', chapter: 16, verse: 16 },
    ],
    sources: [],
  },
  {
    id: 'region-goshen',
    name: 'The land of Goshen',
    aliases: ['Goshen', 'Land of Rameses'],
    ancientNames: { hebrew: 'גֹּשֶׁן', hebrewTranslit: 'Goshen' },
    category: 'region',
    range: { start: -1900, end: -1200 },
    extent: {
      type: 'Polygon',
      coordinates: [[[31.2, 30.4], [31.4, 30.9], [32.3, 30.8], [32.2, 30.3], [31.2, 30.4]]],
    },
    color: REGION_COLOR,
    summary:
      'The eastern Delta district Joseph settles his family in — good pasture, on the frontier rather than in the Egyptian heartland, which suits both a herding people and an Egyptian administration\'s preference for keeping them at the edge. The Wadi Tumilat and the area around Tell el-Dab\'a are the usual identification.',
    placeId: 'goshen',
    polityId: 'egypt',
    scripture: [
      { book: 'genesis', chapter: 45, verse: 10 },
      { book: 'genesis', chapter: 47, verse: 6, verseEnd: 11 },
      { book: 'exodus', chapter: 8, verse: 22 },
      { book: 'exodus', chapter: 9, verse: 26 },
    ],
    sources: [
      { citation: 'Bietak, Avaris: The Capital of the Hyksos', note: 'On the Asiatic settlement at Tell el-Dab\'a in the eastern Delta.' },
    ],
  },
  {
    id: 'region-arabah',
    name: 'The Arabah',
    aliases: ['Wilderness of the Arabah', 'The rift valley'],
    ancientNames: { hebrew: 'עֲרָבָה', hebrewTranslit: 'Aravah' },
    category: 'region',
    range: { start: -2000, end: 400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.0, 29.5], [35.1, 31.2], [35.5, 31.3], [35.4, 29.5], [35.0, 29.5]]],
    },
    color: REGION_COLOR,
    summary:
      'The floor of the rift valley south of the Dead Sea, running down to the Gulf of Aqaba — the driest inhabited country in the region and the route to Ezion-geber and the Red Sea. Its copper, worked at Timna and in the Wadi Faynan, is the resource Edom controlled and Judah repeatedly tried to reach.',
    placeId: null,
    polityId: 'edom',
    scripture: [
      { book: 'deuteronomy', chapter: 1, verse: 1 },
      { book: 'deuteronomy', chapter: 2, verse: 8 },
      { book: '2kings', chapter: 14, verse: 22 },
    ],
    sources: [],
  },
];

// ── Tribal allotments ────────────────────────────────────────────────────────

/**
 * Joshua 13-19 divides the land among the tribes by listing boundary points and
 * towns. A great many of those towns are unlocated, so what is drawn here is the
 * shape scholarship reconstructs from the ones that are — and the reconstructions
 * differ. Dan is drawn in its original coastal allotment rather than at its later
 * northern seat, because that is what the allotment text describes.
 */
function allotment(
  id: string,
  name: string,
  color: string,
  coordinates: [number, number][],
  summary: string,
  scripture: Territory['scripture'],
): Territory {
  return {
    id: `tribe-${id}`,
    name,
    aliases: [`Tribe of ${name}`, `Allotment of ${name}`],
    ancientNames: {},
    category: 'tribal-allotment',
    range: { start: -1200, end: -722 },
    extent: { type: 'Polygon', coordinates: [coordinates] },
    color,
    summary,
    placeId: null,
    polityId: null,
    scripture,
    sources: [JOSHUA_SOURCE],
  };
}

const ALLOTMENTS: Territory[] = [
  allotment(
    'judah',
    'Judah',
    '#7A6247',
    [[34.5, 31.0], [34.7, 31.75], [35.5, 31.75], [35.5, 31.0], [34.9, 30.85], [34.5, 31.0]],
    'The largest allotment, from the Dead Sea west to the coast and south into the Negev, and the one that becomes the southern kingdom. Its western edge was never securely held: the Philistine cities in the coastal plain are inside the boundary as described and outside it in practice.',
    [{ book: 'joshua', chapter: 15, verse: 1, verseEnd: 63 }],
  ),
  allotment(
    'benjamin',
    'Benjamin',
    '#8B7A5A',
    [[35.0, 31.75], [35.05, 31.95], [35.5, 31.95], [35.45, 31.75], [35.0, 31.75]],
    'A narrow strip between Judah and Ephraim holding the ridge route and the passes down to Jericho — small, and strategically worth more than its size. Jerusalem sits on its southern border, Saul came from it, and so, much later, did Paul.',
    [{ book: 'joshua', chapter: 18, verse: 11, verseEnd: 28 }],
  ),
  allotment(
    'simeon',
    'Simeon',
    '#8F7A5F',
    [[34.4, 30.9], [34.5, 31.35], [35.1, 31.3], [35.0, 30.8], [34.4, 30.9]],
    'An enclave inside Judah in the dry south around Beersheba, which the text itself explains as a portion taken out of Judah\'s share because Judah\'s was too large. The tribe is absorbed early and effectively disappears from the narrative.',
    [{ book: 'joshua', chapter: 19, verse: 1, verseEnd: 9 }],
  ),
  allotment(
    'dan',
    'Dan',
    '#8A5C4E',
    [[34.75, 31.85], [34.8, 32.1], [35.1, 32.05], [35.05, 31.8], [34.75, 31.85]],
    'The original coastal allotment west of Benjamin, along the Sorek valley — Philistine frontier country, which is the setting of the Samson cycle. Judges 18 has the tribe fail to hold it and migrate north to take Laish, renaming it Dan, which is why the phrase "from Dan to Beersheba" points to the far north.',
    [
      { book: 'joshua', chapter: 19, verse: 40, verseEnd: 48 },
      { book: 'judges', chapter: 18, verse: 1, verseEnd: 31 },
    ],
  ),
  allotment(
    'ephraim',
    'Ephraim',
    '#6B7A55',
    [[34.95, 31.95], [35.0, 32.3], [35.5, 32.3], [35.5, 31.95], [34.95, 31.95]],
    'The central highland north of Benjamin, and the political heart of the north — Shiloh, Shechem and Bethel are in or on its edges. Joshua is an Ephraimite, and the prophets use "Ephraim" as a name for the whole northern kingdom.',
    [{ book: 'joshua', chapter: 16, verse: 5, verseEnd: 10 }],
  ),
  allotment(
    'manasseh-west',
    'Manasseh (west)',
    '#6E7F5C',
    [[34.9, 32.3], [34.95, 32.6], [35.55, 32.55], [35.5, 32.3], [34.9, 32.3]],
    'The northern half of the central hills, running down to the Jezreel valley — the only tribe settled on both sides of the Jordan. Its share includes the Canaanite chariot cities along the valley, which Judges 1 admits were not taken.',
    [{ book: 'joshua', chapter: 17, verse: 7, verseEnd: 18 }],
  ),
  allotment(
    'issachar',
    'Issachar',
    '#7F8A5C',
    [[35.1, 32.5], [35.15, 32.8], [35.6, 32.7], [35.5, 32.45], [35.1, 32.5]],
    'The eastern Jezreel valley and the hills above it, some of the best farmland in the country — and directly on the international highway, which is a mixed inheritance.',
    [{ book: 'joshua', chapter: 19, verse: 17, verseEnd: 23 }],
  ),
  allotment(
    'zebulun',
    'Zebulun',
    '#5F7E6E',
    [[35.0, 32.7], [35.05, 32.95], [35.4, 32.9], [35.35, 32.65], [35.0, 32.7]],
    'Lower Galilee between the Jezreel valley and the hills, landlocked despite Jacob\'s blessing placing it at the seashore. Nazareth is inside it, which is why Matthew quotes Isaiah on Zebulun and Naphtali when the ministry begins.',
    [
      { book: 'joshua', chapter: 19, verse: 10, verseEnd: 16 },
      { book: 'matthew', chapter: 4, verse: 13, verseEnd: 16 },
    ],
  ),
  allotment(
    'asher',
    'Asher',
    '#5E7A78',
    [[35.0, 32.9], [35.05, 33.25], [35.35, 33.2], [35.3, 32.85], [35.0, 32.9]],
    'The coastal strip north of Carmel toward Tyre and Sidon — rich country, and never really taken: Judges lists Acco, Sidon and Achzib among the towns whose inhabitants Asher lived among rather than drove out.',
    [{ book: 'joshua', chapter: 19, verse: 24, verseEnd: 31 }],
  ),
  allotment(
    'naphtali',
    'Naphtali',
    '#4E6B7A',
    [[35.3, 32.8], [35.35, 33.3], [35.65, 33.25], [35.6, 32.75], [35.3, 32.8]],
    'Upper Galilee and the western shore of the lake, from Hazor down to the Sea of Galilee. Capernaum, Bethsaida and the whole lakeside setting of the Gospels lie within it — the reason Isaiah\'s line about Galilee of the nations is quoted at the start of the ministry.',
    [
      { book: 'joshua', chapter: 19, verse: 32, verseEnd: 39 },
      { book: 'isaiah', chapter: 9, verse: 1 },
    ],
  ),
  allotment(
    'reuben',
    'Reuben',
    '#8B6B5A',
    [[35.5, 31.2], [35.55, 31.8], [36.0, 31.8], [35.95, 31.2], [35.5, 31.2]],
    'The Transjordanian plateau east of the Dead Sea, taken from Sihon. Its border with Moab moved back and forth for centuries — the Mesha Stele has Moab reclaiming towns from it — and the tribe fades from the record early.',
    [
      { book: 'joshua', chapter: 13, verse: 15, verseEnd: 23 },
      { book: 'numbers', chapter: 32, verse: 33, verseEnd: 38 },
    ],
  ),
  allotment(
    'gad',
    'Gad',
    '#8B7A6A',
    [[35.55, 31.8], [35.6, 32.4], [36.1, 32.4], [36.0, 31.8], [35.55, 31.8]],
    'Southern Gilead, between Reuben and the half-tribe of Manasseh. Gad and Reuben ask for the eastern land because it suits their herds, and are made to cross and fight with the others first — a bargain the text takes some trouble over.',
    [
      { book: 'joshua', chapter: 13, verse: 24, verseEnd: 28 },
      { book: 'numbers', chapter: 32, verse: 1, verseEnd: 32 },
    ],
  ),
  allotment(
    'manasseh-east',
    'Manasseh (east)',
    '#6A7F6C',
    [[35.7, 32.4], [35.8, 33.0], [36.5, 32.95], [36.4, 32.4], [35.7, 32.4]],
    'Northern Gilead and Bashan, the half-tribe settled east of the Jordan. It is the furthest-flung allotment and the first to be stripped away, deported by Tiglath-pileser III a decade before Samaria fell.',
    [
      { book: 'joshua', chapter: 13, verse: 29, verseEnd: 31 },
      { book: '1chronicles', chapter: 5, verse: 23, verseEnd: 26 },
    ],
  ),
];

export const TERRITORIES: Territory[] = [...PROVINCES, ...REGIONS, ...ALLOTMENTS];

export const TERRITORY_BY_ID: ReadonlyMap<string, Territory> = new Map(
  TERRITORIES.map((t) => [t.id, t]),
);

/** Category labels for the map key and the panels. */
export const TERRITORY_CATEGORY_LABEL: Record<Territory['category'], string> = {
  province: 'Roman province',
  region: 'Region',
  'tribal-allotment': 'Tribal allotment',
  district: 'District',
};
