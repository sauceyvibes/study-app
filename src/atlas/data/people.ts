import type { Person } from '../types';

/**
 * People the atlas can put on a map.
 *
 * Floruit ranges for the patriarchs are intentionally wide — they are inferences
 * from cultural setting, not synchronisms, and a narrow range would imply a
 * precision nobody has. Monarchic dates follow Thiele's regnal reconstruction.
 */
export const PEOPLE: Person[] = [
  {
    id: 'abraham',
    name: 'Abraham',
    aliases: ['Abram'],
    ancientNames: { hebrew: 'אַבְרָהָם', hebrewTranslit: 'Avraham', greek: 'Ἀβραάμ' },
    floruit: { start: -2000, end: -1800 },
    role: 'Patriarch',
    description:
      'Leaves Ur and then Harran for Canaan on a promise of land and descendants, and lives in it as a resident alien without ever holding more than a burial plot. The narrative pattern — long-distance movement between Mesopotamia, Canaan and Egypt by a tent-dwelling pastoralist with substantial herds — fits Middle Bronze Age conditions well.',
    places: ['ur', 'harran', 'shechem', 'bethel', 'ai', 'hebron', 'beersheba', 'goshen', 'jerusalem'],
    scripture: [
      { book: 'genesis', chapter: 12 },
      { book: 'genesis', chapter: 15 },
      { book: 'genesis', chapter: 22 },
      { book: 'hebrews', chapter: 11, verse: 8, verseEnd: 19 },
    ],
  },
  {
    id: 'jacob',
    name: 'Jacob',
    aliases: ['Israel'],
    ancientNames: { hebrew: 'יַעֲקֹב', hebrewTranslit: 'Ya\'aqov', greek: 'Ἰακώβ' },
    floruit: { start: -1900, end: -1700 },
    role: 'Patriarch',
    description:
      'Abraham\'s grandson, whose renaming as Israel gives the nation its name. His life traces a circuit: out of Canaan to Harran to escape Esau, back across the Jabbok, and finally down to Egypt in famine.',
    places: ['beersheba', 'bethel', 'harran', 'succoth', 'shechem', 'hebron', 'goshen'],
    scripture: [
      { book: 'genesis', chapter: 28 },
      { book: 'genesis', chapter: 32 },
      { book: 'genesis', chapter: 46 },
    ],
  },
  {
    id: 'joseph',
    name: 'Joseph',
    aliases: ['Zaphenath-paneah'],
    ancientNames: { hebrew: 'יוֹסֵף', hebrewTranslit: 'Yosef', greek: 'Ἰωσήφ' },
    floruit: { start: -1900, end: -1750 },
    role: 'Patriarch, Egyptian official',
    description:
      'Sold into Egypt and rising to administer it through a famine. The Egyptian colouring of the story — the titles, the investiture with a signet and gold chain, the price paid for him, the embalming — is consistent with genuine Egyptian practice, though he is not identifiable in Egyptian records.',
    places: ['shechem', 'goshen', 'memphis', 'hebron'],
    scripture: [
      { book: 'genesis', chapter: 37 },
      { book: 'genesis', chapter: 41 },
      { book: 'genesis', chapter: 50 },
    ],
  },
  {
    id: 'moses',
    name: 'Moses',
    aliases: [],
    ancientNames: { hebrew: 'מֹשֶׁה', hebrewTranslit: 'Mosheh', greek: 'Μωϋσῆς' },
    floruit: { start: -1350, end: -1230 },
    role: 'Prophet, lawgiver',
    description:
      'Leads Israel out of Egypt, receives the covenant at Sinai, and dies within sight of Canaan. His name is Egyptian in form — the element found in Thutmose and Rameses — which is a small but real point in favour of the tradition\'s Egyptian setting. The floruit given here follows the late-date reconstruction; on the early date it falls roughly 150 years earlier.',
    places: ['rameses', 'goshen', 'red-sea-crossing', 'mount-sinai', 'kadesh-barnea', 'heshbon', 'mount-nebo'],
    scripture: [
      { book: 'exodus', chapter: 3 },
      { book: 'exodus', chapter: 20 },
      { book: 'deuteronomy', chapter: 34 },
    ],
  },
  {
    id: 'joshua',
    name: 'Joshua',
    aliases: ['Hoshea', 'Jeshua'],
    ancientNames: { hebrew: 'יְהוֹשֻׁעַ', hebrewTranslit: 'Yehoshua', greek: 'Ἰησοῦς' },
    floruit: { start: -1250, end: -1180 },
    role: 'Military leader',
    description:
      'Moses\' successor, who leads the crossing of the Jordan and the campaigns in Canaan, then presides over the covenant renewal at Shechem.',
    places: ['jericho', 'ai', 'gibeon', 'hazor', 'lachish', 'shechem', 'shiloh', 'kadesh-barnea'],
    scripture: [
      { book: 'joshua', chapter: 1 },
      { book: 'joshua', chapter: 6 },
      { book: 'joshua', chapter: 24 },
    ],
  },
  {
    id: 'samuel',
    name: 'Samuel',
    aliases: [],
    ancientNames: { hebrew: 'שְׁמוּאֵל', hebrewTranslit: 'Shmuel', greek: 'Σαμουήλ' },
    floruit: { start: -1080, end: -1010 },
    role: 'Prophet, last of the judges',
    description:
      'Raised at the Shiloh sanctuary, he judges Israel from a circuit of towns and reluctantly anoints first Saul and then David — the pivot between the tribal period and the monarchy.',
    places: ['shiloh', 'mizpah', 'bethlehem'],
    scripture: [
      { book: '1samuel', chapter: 3 },
      { book: '1samuel', chapter: 8 },
      { book: '1samuel', chapter: 16 },
    ],
  },
  {
    id: 'david',
    name: 'David',
    aliases: [],
    ancientNames: { hebrew: 'דָּוִד', hebrewTranslit: 'David', greek: 'Δαυίδ' },
    floruit: { start: -1010, end: -970 },
    role: 'King of Israel',
    description:
      'Shepherd, outlaw, mercenary and king, who takes Jerusalem and makes it a capital. The Tel Dan stele\'s reference to the "House of David" within about a century and a half of his reign establishes the dynasty as historical; the extent of his kingdom remains argued.',
    places: ['bethlehem', 'gath', 'en-gedi', 'hebron', 'jerusalem', 'rabbah-ammon'],
    scripture: [
      { book: '1samuel', chapter: 17 },
      { book: '2samuel', chapter: 5 },
      { book: '2samuel', chapter: 11 },
    ],
  },
  {
    id: 'solomon',
    name: 'Solomon',
    aliases: ['Jedidiah'],
    ancientNames: { hebrew: 'שְׁלֹמֹה', hebrewTranslit: 'Shlomo', greek: 'Σολομών' },
    floruit: { start: -970, end: -931 },
    role: 'King of Israel',
    description:
      'Builds the temple and an administrative state, with a Red Sea fleet and a building programme at Hazor, Megiddo and Gezer. Whether the monumental architecture traditionally credited to him belongs to his reign or to the ninth-century Omrides is the central question of the low-chronology debate.',
    places: ['jerusalem', 'gibeon', 'megiddo', 'hazor', 'ezion-geber', 'tyre'],
    scripture: [
      { book: '1kings', chapter: 3 },
      { book: '1kings', chapter: 6 },
      { book: '1kings', chapter: 9 },
    ],
  },
  {
    id: 'elijah',
    name: 'Elijah',
    aliases: ['Elias'],
    ancientNames: { hebrew: 'אֵלִיָּהוּ', hebrewTranslit: 'Eliyahu', greek: 'Ἠλίας' },
    floruit: { start: -875, end: -850 },
    role: 'Prophet',
    description:
      'Confronts Ahab and Jezebel over the Tyrian Baal cult, wins the contest on Carmel, then flees to Horeb. His circuit runs from Phoenician territory to the southern desert — the geography of the stories is itself part of their argument.',
    places: ['mount-carmel', 'samaria-city', 'jezreel', 'beersheba', 'mount-sinai', 'sidon'],
    scripture: [
      { book: '1kings', chapter: 17 },
      { book: '1kings', chapter: 18 },
      { book: '1kings', chapter: 19 },
    ],
  },
  {
    id: 'hezekiah',
    name: 'Hezekiah',
    aliases: [],
    ancientNames: { hebrew: 'חִזְקִיָּהוּ', hebrewTranslit: 'Chizqiyahu' },
    floruit: { start: -715, end: -686 },
    role: 'King of Judah',
    description:
      'Reforms the cult, fortifies Jerusalem and cuts the Siloam tunnel in preparation for the Assyrian assault of 701 BC. Sennacherib\'s own annals record besieging him but not taking the city — an unusual admission by omission in a genre built on total victory.',
    places: ['jerusalem', 'lachish'],
    scripture: [
      { book: '2kings', chapter: 18 },
      { book: '2kings', chapter: 19 },
      { book: 'isaiah', chapter: 36 },
    ],
  },
  {
    id: 'jeremiah',
    name: 'Jeremiah',
    aliases: [],
    ancientNames: { hebrew: 'יִרְמְיָהוּ', hebrewTranslit: 'Yirmeyahu', greek: 'Ἰερεμίας' },
    floruit: { start: -627, end: -580 },
    role: 'Prophet',
    description:
      'Preaches through Judah\'s final decades and the destruction of Jerusalem, is imprisoned for counselling submission to Babylon, and is finally taken to Egypt against his will. Several officials named in his book are attested on seal impressions from Jerusalem.',
    places: ['jerusalem', 'mizpah', 'lachish', 'memphis'],
    scripture: [
      { book: 'jeremiah', chapter: 1 },
      { book: 'jeremiah', chapter: 38 },
      { book: 'jeremiah', chapter: 43 },
    ],
  },
  {
    id: 'ezekiel',
    name: 'Ezekiel',
    aliases: [],
    ancientNames: { hebrew: 'יְחֶזְקֵאל', hebrewTranslit: 'Yechezqel', greek: 'Ἰεζεκιήλ' },
    floruit: { start: -593, end: -570 },
    role: 'Prophet, priest',
    description:
      'Deported in 597 BC, he prophesies from the Judean settlements in Babylonia. His book is unusually precisely dated, giving a sequence of regnal-year datelines that can be converted to specific days.',
    places: ['jerusalem', 'babylon', 'nippur', 'tyre'],
    scripture: [
      { book: 'ezekiel', chapter: 1 },
      { book: 'ezekiel', chapter: 10 },
      { book: 'ezekiel', chapter: 37 },
    ],
  },
  {
    id: 'nehemiah',
    name: 'Nehemiah',
    aliases: [],
    ancientNames: { hebrew: 'נְחֶמְיָה', hebrewTranslit: 'Nechemyah' },
    floruit: { start: -445, end: -425 },
    role: 'Governor of Yehud',
    description:
      'Cupbearer to Artaxerxes I, sent to Jerusalem to rebuild the walls, which he does in the face of organised opposition from the neighbouring provincial governors. Sanballat of Samaria, his chief opponent, is named independently in the Elephantine papyri.',
    places: ['susa', 'jerusalem', 'samaria-city'],
    scripture: [
      { book: 'nehemiah', chapter: 1 },
      { book: 'nehemiah', chapter: 4 },
      { book: 'nehemiah', chapter: 6 },
    ],
  },
  {
    id: 'jesus',
    name: 'Jesus',
    aliases: ['Jesus of Nazareth', 'Yeshua', 'Christ', 'Messiah'],
    ancientNames: {
      hebrew: 'יֵשׁוּעַ',
      hebrewTranslit: 'Yeshua',
      greek: 'Ἰησοῦς',
      greekTranslit: 'Iesous',
    },
    floruit: { start: -4, end: 33 },
    role: 'Teacher, prophet, Messiah',
    description:
      'Born in the last years of Herod the Great, raised in Nazareth, active in Galilee and Judea, and executed in Jerusalem under Pontius Pilate. The crucifixion under Pilate is referred to by Tacitus and Josephus independently of Christian sources. The date of the crucifixion is most often placed in AD 30 or 33, both of which satisfy the Passover and prefecture constraints.',
    places: ['bethlehem', 'nazareth', 'capernaum', 'sea-of-galilee', 'cana', 'bethsaida', 'caesarea-philippi', 'jericho', 'bethany', 'jerusalem', 'tyre', 'sidon'],
    scripture: [
      { book: 'luke', chapter: 2 },
      { book: 'mark', chapter: 1 },
      { book: 'john', chapter: 19 },
    ],
  },
  {
    id: 'peter',
    name: 'Peter',
    aliases: ['Simon', 'Simon Peter', 'Cephas'],
    ancientNames: { greek: 'Πέτρος', greekTranslit: 'Petros', hebrew: 'כֵּיפָא', hebrewTranslit: 'Kepha' },
    floruit: { start: 28, end: 65 },
    role: 'Apostle',
    description:
      'A fisherman from Bethsaida living at Capernaum, the first of the Twelve and the leader of the Jerusalem community in the earliest years. His visit to Cornelius at Caesarea opens the mission to Gentiles; he is later in Antioch, and tradition places his death in Rome under Nero.',
    places: ['bethsaida', 'capernaum', 'sea-of-galilee', 'caesarea-philippi', 'jerusalem', 'caesarea-maritima', 'antioch-syria', 'rome'],
    scripture: [
      { book: 'matthew', chapter: 16, verse: 13, verseEnd: 20 },
      { book: 'acts', chapter: 2 },
      { book: 'acts', chapter: 10 },
    ],
  },
  {
    id: 'paul',
    name: 'Paul',
    aliases: ['Saul', 'Saul of Tarsus', 'Paulus'],
    ancientNames: {
      hebrew: 'שָׁאוּל',
      hebrewTranslit: 'Sha\'ul',
      greek: 'Παῦλος',
      greekTranslit: 'Paulos',
    },
    floruit: { start: 33, end: 67 },
    role: 'Apostle, missionary',
    description:
      'A Diaspora Jew from Tarsus, Pharisee-trained and a Roman citizen, who moves from persecuting the movement to founding congregations across the eastern Mediterranean. His chronology is fixed by the Gallio inscription at Corinth; his letters are the earliest surviving Christian writings.',
    places: ['tarsus', 'damascus', 'jerusalem', 'antioch-syria', 'paphos', 'antioch-pisidia', 'iconium', 'lystra', 'troas', 'philippi', 'thessalonica', 'berea', 'athens', 'corinth', 'ephesus', 'miletus', 'caesarea-maritima', 'malta', 'puteoli', 'rome'],
    scripture: [
      { book: 'acts', chapter: 9 },
      { book: 'acts', chapter: 17 },
      { book: 'galatians', chapter: 1 },
    ],
  },
  {
    id: 'barnabas',
    name: 'Barnabas',
    aliases: ['Joseph'],
    ancientNames: { greek: 'Βαρναβᾶς' },
    floruit: { start: 33, end: 60 },
    role: 'Apostle',
    description:
      'A Levite from Cyprus who vouches for Paul when the Jerusalem community distrusts him, and who partners with him on the first journey before they separate over John Mark.',
    places: ['jerusalem', 'antioch-syria', 'paphos', 'antioch-pisidia', 'iconium', 'lystra'],
    scripture: [
      { book: 'acts', chapter: 4, verse: 36, verseEnd: 37 },
      { book: 'acts', chapter: 13 },
      { book: 'acts', chapter: 15, verse: 36, verseEnd: 41 },
    ],
  },
  {
    id: 'lydia',
    name: 'Lydia',
    aliases: ['Lydia of Thyatira'],
    ancientNames: { greek: 'Λυδία' },
    floruit: { start: 49, end: 60 },
    role: 'Merchant, host of the Philippian church',
    description:
      'A dealer in purple textiles from Thyatira, living in Philippi — a businesswoman in a luxury trade. The first named convert in Europe, and the congregation there meets in her house.',
    places: ['philippi'],
    scripture: [{ book: 'acts', chapter: 16, verse: 14, verseEnd: 15 }],
  },
  {
    id: 'priscilla',
    name: 'Priscilla',
    aliases: ['Prisca'],
    ancientNames: { greek: 'Πρίσκιλλα' },
    floruit: { start: 49, end: 65 },
    role: 'Teacher, co-worker of Paul',
    description:
      'Expelled from Rome under Claudius, she and her husband Aquila work with Paul at Corinth and Ephesus and instruct Apollos. She is named before Aquila in four of the six references to the couple, which is unusual enough to be worth noticing.',
    places: ['rome', 'corinth', 'ephesus'],
    scripture: [
      { book: 'acts', chapter: 18, verse: 2, verseEnd: 3 },
      { book: 'acts', chapter: 18, verse: 24, verseEnd: 26 },
      { book: 'romans', chapter: 16, verse: 3 },
    ],
  },
  {
    id: 'ruth',
    name: 'Ruth',
    aliases: [],
    ancientNames: { hebrew: 'רוּת', hebrewTranslit: 'Rut', greek: 'Ῥούθ' },
    floruit: { start: -1150, end: -1100 },
    role: 'Moabite ancestor of David',
    description:
      'A Moabite widow who returns to Bethlehem with her mother-in-law and marries Boaz. Her inclusion in David\'s genealogy — and Matthew\'s — is pointed, given the standing hostility between Israel and Moab.',
    places: ['bethlehem', 'dibon'],
    scripture: [
      { book: 'ruth', chapter: 1 },
      { book: 'ruth', chapter: 4 },
    ],
  },
  {
    id: 'jonah',
    name: 'Jonah',
    aliases: [],
    ancientNames: { hebrew: 'יוֹנָה', hebrewTranslit: 'Yonah', greek: 'Ἰωνᾶς' },
    floruit: { start: -790, end: -750 },
    role: 'Prophet',
    description:
      'Named in 2 Kings 14:25 as a prophet under Jeroboam II, and the subject of the book that sends him to Nineveh — in the wrong direction first. Whether the book is read as narrative history or as a prophetic parable is an old question and does not affect its geography.',
    places: ['nineveh'],
    scripture: [
      { book: 'jonah', chapter: 1 },
      { book: 'jonah', chapter: 3 },
      { book: '2kings', chapter: 14, verse: 25 },
    ],
  },
];
