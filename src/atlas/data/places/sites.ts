import type { ExternalSource, Place } from '../../types';

/**
 * Named locations *inside* places.
 *
 * The gazetteers this atlas is built on catalogue settlements and natural
 * features, because that is what a gazetteer is for. But a great deal of the
 * biblical narrative happens at an address rather than in a city: Paul argues
 * daily in the hall of Tyrannus, not merely "in Ephesus"; Gallio hears the case
 * from the bema in the Corinthian forum; the apostles teach in Solomon's
 * Portico; the riot fills a theatre that still stands and still seats
 * twenty-four thousand. A reader studying Acts 19 needs the hall, and no
 * gazetteer has a row for it.
 *
 * So these are written by hand. Each carries the settlement it belongs to
 * (`parentPlaceId`), which keeps the plate clean — a city stays one dot until
 * the reader zooms far enough in to want its interior — and each carries what
 * the atlas asks of every entry: an honest confidence rating, and named
 * witnesses from outside the biblical text where any exist.
 *
 * On the confidence ratings here in particular. A building excavated and
 * identified by an inscription is `certain`. A building excavated and
 * identified by argument is `probable`. Where two serious proposals compete —
 * where the praetorium was, where Golgotha was — the entry is `contested` and
 * names both. And where the text describes a building nobody has ever found,
 * the entry says so and is rated `conjectural`, sitting at its city's
 * coordinates because that is genuinely all we know.
 */

// ── Witnesses cited more than once ───────────────────────────────────────────

const JOSEPHUS_ANTIQUITIES = 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0146';
const JOSEPHUS_WAR = 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0147';
const STRABO = 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0198';
const PAUSANIAS = 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0160';
const PLINY = 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0137';
const TACITUS_ANNALS = 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.02.0078';
const SUETONIUS = 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Suetonius/12Caesars/home.html';

function josephusWar(locus: string, note: string): ExternalSource {
  return { author: 'Josephus', work: 'The Jewish War', locus, date: 'c. AD 75', kind: 'historian', note, url: JOSEPHUS_WAR };
}

function josephusAnt(locus: string, note: string): ExternalSource {
  return { author: 'Josephus', work: 'Antiquities of the Jews', locus, date: 'c. AD 94', kind: 'historian', note, url: JOSEPHUS_ANTIQUITIES };
}

function strabo(locus: string, note: string): ExternalSource {
  return { author: 'Strabo', work: 'Geography', locus, date: 'c. AD 20', kind: 'geographer', note, url: STRABO };
}

function pausanias(locus: string, note: string): ExternalSource {
  return { author: 'Pausanias', work: 'Description of Greece', locus, date: 'c. AD 160', kind: 'geographer', note, url: PAUSANIAS };
}

// ── Ephesus ──────────────────────────────────────────────────────────────────

const EPHESUS_SITES: Place[] = [
  {
    id: 'hall-of-tyrannus',
    name: 'The hall of Tyrannus',
    aliases: ['Lecture hall of Tyrannus', 'School of Tyrannus', 'Tyrannus'],
    modernName: null,
    ancientNames: { greek: 'σχολὴ Τυράννου', greekTranslit: 'scholē Tyrannou' },
    // Ephesus itself. The building has never been identified, so the city's
    // coordinate is the honest answer rather than a guess at a street corner.
    coordinates: [27.3418, 37.9395],
    kind: 'sanctuary',
    confidence: 'conjectural',
    occupation: { start: 52, end: 55 },
    periods: ['apostolic'],
    parentPlaceId: 'ephesus',
    siteRelation: 'in',
    scripture: [{ book: 'acts', chapter: 19, verse: 9, verseEnd: 10 }],
    people: ['paul', 'tyrannus'],
    events: [],
    polities: ['rome'],
    description:
      'The lecture room Paul hired after three months of argument in the synagogue turned hostile, and where he then taught daily for two years — the longest settled stay Acts records, and the base from which "all the residents of Asia heard the word". A σχολή was a hall for a rhetorician or philosopher to lecture in, rented out by the hour; Tyrannus is otherwise unknown and may be the lecturer or merely the landlord.',
    archaeology:
      'No building at Ephesus has ever been identified as the hall, and none is likely to be: a rented lecture room leaves no inscription. What excavation does supply is the setting — the terraced houses, the state agora and the halls along the Curetes street show exactly the kind of space being described.',
    externalSources: [
      {
        author: 'Codex Bezae and the Western text',
        work: 'Acts 19:9 (D, 05)',
        locus: 'variant reading',
        date: 'c. AD 400 manuscript, older tradition',
        kind: 'reference',
        note: 'The Western text adds that Paul taught "from the fifth hour to the tenth" — from about 11am to 4pm, the siesta hours when a working hall stood empty and an artisan audience was free. The reading is not in the earliest manuscripts, but it is the kind of circumstantial detail a later scribe is unlikely to invent, and it fits the economics of hiring a room exactly.',
      },
      strabo('14.1.24', 'Describes Ephesus as the great emporium of Asia west of the Taurus, with the scale of civic and commercial life a rented lecture hall implies.'),
      {
        author: 'Ephesus excavation, Austrian Archaeological Institute',
        work: 'Forschungen in Ephesos',
        locus: 'ongoing since 1895',
        kind: 'excavation',
        note: 'The Curetes street, the state agora and the terrace houses give the physical setting of the two years — a dense, colonnaded, multilingual city centre where a hired hall would sit among shops and schools.',
      },
    ],
    sources: [
      { citation: 'Trebilco, The Early Christians in Ephesus from Paul to Ignatius, 143-152', note: 'On the σχολή, the Western reading, and what a two-year residency at Ephesus implies for the mission.' },
    ],
  },
  {
    id: 'temple-of-artemis',
    name: 'The temple of Artemis',
    aliases: ['Artemision', 'Temple of Diana', 'Great temple of Artemis'],
    modernName: 'Selçuk, Türkiye',
    ancientNames: { greek: 'Ἀρτεμίσιον' },
    coordinates: [27.3639, 37.9497],
    kind: 'sanctuary',
    confidence: 'certain',
    occupation: { start: -560, end: 401 },
    periods: ['apostolic'],
    parentPlaceId: 'ephesus',
    siteRelation: 'in',
    scripture: [
      { book: 'acts', chapter: 19, verse: 24, verseEnd: 35 },
    ],
    people: ['paul', 'demetrius'],
    events: [],
    polities: ['rome'],
    description:
      'One of the seven wonders of the ancient world, and the economic fact underneath the riot in Acts 19. The silversmiths who mobbed Paul made souvenir shrines of the goddess; the town clerk calms the crowd by reminding them that Ephesus is "temple keeper of the great Artemis and of the sacred stone that fell from heaven". The temple was also a bank, holding deposits for the whole province, which is part of why an attack on the cult read as an attack on the city.',
    archaeology:
      'Rediscovered by J. T. Wood for the British Museum in 1869 after six years of searching, in marsh six metres below the modern water table. Almost nothing stands: a single re-erected column marks the site. Sculpted column drums and the archaic deposit are in the British Museum and the Ephesus Museum at Selçuk.',
    externalSources: [
      {
        author: 'Pliny the Elder',
        work: 'Natural History',
        locus: '36.21',
        date: 'c. AD 77',
        kind: 'historian',
        note: 'Gives the temple\'s dimensions and reports that it took 120 years to build, with 127 columns each the gift of a king — the source of nearly every later description of its scale.',
        url: PLINY,
      },
      strabo('14.1.22-23', 'Describes the successive temples on the site, the asylum rights of the precinct, and the rebuilding after the fire of 356 BC.'),
      pausanias('4.31.8', 'Names the Ephesian Artemision as surpassing every other building for size and for the wealth of its offerings.'),
      {
        author: 'J. T. Wood',
        work: 'Discoveries at Ephesus',
        locus: 'London, 1877',
        kind: 'excavation',
        note: 'The excavation report of the rediscovery, which found the temple only by following an inscription that described the route of a processional to it.',
      },
    ],
    sources: [
      { citation: 'Bammer & Muss, Das Artemision von Ephesos', note: 'The stratigraphy of the successive temples on the site.' },
    ],
  },
  {
    id: 'theatre-of-ephesus',
    name: 'The theatre at Ephesus',
    aliases: ['Great Theatre of Ephesus'],
    modernName: null,
    ancientNames: { greek: 'θέατρον' },
    coordinates: [27.3419, 37.9401],
    kind: 'sanctuary',
    confidence: 'certain',
    occupation: { start: -250, end: 600 },
    periods: ['apostolic'],
    parentPlaceId: 'ephesus',
    siteRelation: 'in',
    scripture: [{ book: 'acts', chapter: 19, verse: 29, verseEnd: 41 }],
    people: ['paul', 'demetrius'],
    events: [],
    polities: ['rome'],
    description:
      'Where the Ephesian riot ended up: the crowd seized Paul\'s companions Gaius and Aristarchus and rushed into the theatre, and for two hours shouted "Great is Artemis of the Ephesians" — Luke notes drily that most of them did not know why they had come. The theatre stands today, cut into the western slope of Mount Pion at the head of the Arcadian Way running down to the harbour, and holds around 24,000 people.',
    archaeology:
      'Hellenistic in origin and enlarged under Claudius, Nero and Trajan, so the building Luke describes is the mid-first-century phase — already very large, still under expansion. The Arcadian Way approach and the adjacent commercial agora place the silversmiths\' trade within a few minutes\' walk.',
    externalSources: [
      {
        author: 'Ephesus excavation, Austrian Archaeological Institute',
        work: 'Forschungen in Ephesos II: Das Theater',
        locus: 'Vienna, 1912',
        kind: 'excavation',
        note: 'Establishes the building phases, and with them that the theatre standing in the AD 50s was already of the capacity Acts\' account requires.',
      },
      {
        author: 'Salutaris foundation inscription',
        work: 'Inscriptions of Ephesus',
        locus: 'I.Eph. 27',
        date: 'AD 104',
        kind: 'inscription',
        note: 'Endows a procession that carried gold and silver images of Artemis from the temple through the city and into this theatre, to be displayed on its steps at every assembly. It confirms both the theatre\'s civic role and that images of the goddess were made in precious metal — the trade Demetrius is defending.',
      },
    ],
    sources: [],
  },
];

// ── Jerusalem ────────────────────────────────────────────────────────────────

const JERUSALEM_SITES: Place[] = [
  {
    id: 'second-temple',
    name: 'The Second Temple',
    aliases: ['Herod\'s Temple', 'The Temple', 'Temple Mount', 'Sanctuary'],
    modernName: 'Haram al-Sharif / Temple Mount',
    ancientNames: { hebrew: 'בֵּית הַמִּקְדָּשׁ', hebrewTranslit: 'Beit ha-Miqdash', greek: 'ἱερόν' },
    coordinates: [35.2354, 31.7780],
    kind: 'sanctuary',
    confidence: 'certain',
    occupation: { start: -515, end: 70 },
    periods: ['return', 'second-temple', 'roman-judea'],
    parentPlaceId: 'jerusalem',
    siteRelation: 'in',
    scripture: [
      { book: 'ezra', chapter: 6, verse: 15 },
      { book: 'matthew', chapter: 24, verse: 1, verseEnd: 2 },
      { book: 'mark', chapter: 11, verse: 15, verseEnd: 17 },
      { book: 'luke', chapter: 2, verse: 46 },
      { book: 'john', chapter: 2, verse: 20 },
      { book: 'acts', chapter: 3, verse: 1 },
    ],
    people: ['jesus', 'peter', 'paul'],
    events: [],
    polities: ['herodian', 'rome'],
    description:
      'The temple rebuilt after the exile and then wholly reconstructed by Herod from 20 BC on a platform he more than doubled in size — the largest sacred enclosure in the Roman world. It is the building in nearly every Gospel scene set in Jerusalem, and its destruction in AD 70 is the event the Gospels look toward and the epistle to the Hebrews writes around.',
    archaeology:
      'The platform survives entire; the building on it does not. Robinson\'s Arch, the Herodian courses of the western and southern walls, the monumental southern stairs and the street below the western wall are all excavated. The collapse debris on that street, including the Trumpeting Place stone, is the destruction layer of AD 70 itself.',
    externalSources: [
      josephusWar('5.184-227', 'The fullest surviving description of the building: the platform, the courts, the barrier, the porticoes, and the golden vine over the sanctuary door.'),
      josephusAnt('15.380-425', 'Herod\'s speech proposing the rebuilding, the training of priests as masons so that no layman entered the sanctuary, and the eighteen-month construction of the temple building itself.'),
      {
        author: 'Temple Warning inscription',
        work: 'Greek inscription from the soreg, Istanbul Archaeological Museum',
        locus: 'found by Clermont-Ganneau, 1871',
        date: 'first century BC or AD',
        kind: 'inscription',
        note: 'Forbids any foreigner to pass the barrier around the sanctuary on pain of death. It is the physical object behind Paul\'s arrest in Acts 21 — the charge is that he brought Trophimus past this line — and behind the "dividing wall of hostility" of Ephesians 2:14.',
      },
      {
        author: 'Trumpeting Place inscription',
        work: 'Hebrew inscription on a parapet stone, Israel Museum',
        locus: 'found in the 1968-78 southern wall excavations',
        date: 'before AD 70',
        kind: 'inscription',
        note: 'Reads "to the place of trumpeting, to d[eclare]" — the corner from which a priest announced the Sabbath. It was found in the rubble at the foot of the wall where it fell.',
      },
      {
        author: 'Benjamin Mazar; Ronny Reich and Eli Shukron',
        work: 'Temple Mount excavations',
        locus: '1968-1978; 1994-2011',
        kind: 'excavation',
        note: 'Uncovered the southern stairs, the shops along the western street, and the destruction debris — the material context for the temple scenes in the Gospels and Acts.',
      },
    ],
    sources: [
      { citation: 'Ritmeyer, The Quest: Revealing the Temple Mount in Jerusalem', note: 'Reconstruction of the platform and its pre-Herodian core.' },
    ],
  },
  {
    id: 'solomons-portico',
    name: 'Solomon\'s Portico',
    aliases: ['Solomon\'s Colonnade', 'Solomon\'s Porch'],
    modernName: null,
    ancientNames: { greek: 'στοὰ Σολομῶνος' },
    coordinates: [35.2372, 31.7784],
    kind: 'sanctuary',
    confidence: 'probable',
    occupation: { start: -20, end: 70 },
    periods: ['roman-judea', 'apostolic'],
    parentPlaceId: 'jerusalem',
    siteRelation: 'in',
    scripture: [
      { book: 'john', chapter: 10, verse: 23 },
      { book: 'acts', chapter: 3, verse: 11 },
      { book: 'acts', chapter: 5, verse: 12 },
    ],
    people: ['jesus', 'peter', 'john-apostle'],
    events: [],
    polities: ['herodian'],
    description:
      'The colonnade running the length of the eastern side of the temple platform, and the regular meeting place of the first Jerusalem congregation — "they were all together in Solomon\'s Portico". Jesus walks there at the Feast of Dedication in John 10, and Peter addresses the crowd there after the healing at the Beautiful Gate. A roofed public colonnade in the outer court was the natural place to teach: open to anyone, out of the sun, and inside the temple without being inside the sanctuary.',
    archaeology:
      'Nothing of the colonnade survives above ground. Its line is fixed by the eastern wall of the platform, whose lower courses are pre-Herodian — which is why the tradition attaching it to Solomon existed at all.',
    externalSources: [
      josephusAnt('20.220-221', 'Records that the eastern portico was left standing from an earlier age and was believed to be Solomon\'s work, and that Agrippa II was petitioned to repave the city with the timber left over when the temple was finished.'),
      josephusWar('5.184-192', 'Describes the porticoes of the outer court, their double rows of columns and the depth of the roofed walkway.'),
    ],
    sources: [],
  },
  {
    id: 'pool-of-bethesda',
    name: 'The pool of Bethesda',
    aliases: ['Bethesda', 'Bethzatha', 'Bethsaida (variant)', 'Sheep Pool', 'Probatica'],
    modernName: 'St Anne\'s, Jerusalem',
    ancientNames: { greek: 'Βηθεσδά', hebrew: 'בֵּית חַסְדָּא' },
    coordinates: [35.2361, 31.7815],
    kind: 'water',
    confidence: 'certain',
    occupation: { start: -200, end: 400 },
    periods: ['roman-judea'],
    parentPlaceId: 'jerusalem',
    siteRelation: 'in',
    scripture: [{ book: 'john', chapter: 5, verse: 2, verseEnd: 9 }],
    people: ['jesus'],
    events: [],
    polities: ['herodian'],
    description:
      'The twin reservoirs by the Sheep Gate where Jesus healed a man who had been ill thirty-eight years. John describes a pool "having five porticoes", a detail long treated as symbolic invention — five books of the Law, five porches — until the site was excavated and found to be exactly that: two trapezoidal pools side by side, colonnaded on all four outer sides with a fifth colonnade on the dividing rock between them.',
    archaeology:
      'Excavated from 1873 beside the Crusader church of St Anne and more fully in the twentieth century. The pools are cut into rock, plastered, and fed by rainwater; a later Roman healing shrine with votive offerings to Serapis and Asclepius overlies part of the site, which is consistent with a reputation for healing at the spot.',
    externalSources: [
      {
        author: 'Copper Scroll',
        work: 'Dead Sea Scrolls, 3Q15',
        locus: 'column XI',
        date: 'first century AD',
        kind: 'papyrus',
        note: 'Names a place "Beth Eshdatayin" — a dual form, "the place of two outpourings" — at a pool near the temple, which matches both the twin basins and the plural in the name John uses.',
      },
      {
        author: 'Conrad Schick; École Biblique',
        work: 'Excavations at St Anne\'s',
        locus: '1873; 1957-62',
        kind: 'excavation',
        note: 'Recovered the two pools and the five colonnades, turning John 5:2 from a suspected allegory into a description of a building.',
      },
    ],
    sources: [
      { citation: 'Von Wahlde, in Jesus and Archaeology (ed. Charlesworth), 560-566', note: 'On the excavation and the five porticoes.' },
    ],
  },
  {
    id: 'pool-of-siloam',
    name: 'The pool of Siloam',
    aliases: ['Siloam', 'Shiloah', 'Silwan'],
    modernName: 'Silwan, Jerusalem',
    ancientNames: { hebrew: 'שִׁלֹחַ', hebrewTranslit: 'Shiloach', greek: 'Σιλωάμ' },
    coordinates: [35.2354, 31.7702],
    kind: 'water',
    confidence: 'certain',
    occupation: { start: -700, end: 70 },
    periods: ['judah-alone', 'roman-judea'],
    parentPlaceId: 'jerusalem',
    siteRelation: 'in',
    scripture: [
      { book: 'nehemiah', chapter: 3, verse: 15 },
      { book: 'isaiah', chapter: 8, verse: 6 },
      { book: 'luke', chapter: 13, verse: 4 },
      { book: 'john', chapter: 9, verse: 7, verseEnd: 11 },
    ],
    people: ['jesus', 'hezekiah'],
    events: [],
    polities: ['judah', 'herodian'],
    description:
      'The reservoir at the outflow of Hezekiah\'s tunnel, at the southern tip of the City of David, where the man born blind was sent to wash. It also supplied the water carried up to the temple in the Feast of Tabernacles procession, which is the setting of the saying about rivers of living water two chapters earlier in John.',
    archaeology:
      'The pool shown to pilgrims for centuries is a small Byzantine basin. The first-century pool was found by accident in 2004 during sewer repairs a little to the south-east: a monumental stepped pool with three flights of steps and a paved esplanade, far larger than the Byzantine one, dated by coins in its plaster to the reign of Herod and by coins on its floor to the revolt of AD 66-70.',
    externalSources: [
      josephusWar('5.140-145', 'Locates the pool of Siloam in his circuit of the city wall, at the mouth of the Tyropoeon valley.'),
      {
        author: 'Ronny Reich and Eli Shukron',
        work: 'Israel Exploration Journal / excavation reports',
        locus: 'from 2004',
        kind: 'excavation',
        note: 'The discovery and dating of the Second Temple stepped pool, and the stepped street running from it up to the temple.',
      },
      {
        author: 'Siloam Tunnel inscription',
        work: 'Palaeo-Hebrew inscription, Istanbul Archaeological Museum',
        locus: 'found in the tunnel, 1880',
        date: 'c. 700 BC',
        kind: 'inscription',
        note: 'Records the moment the two teams of tunnellers cutting toward each other broke through, "axe against axe" — one of the oldest Hebrew inscriptions known, and a direct witness to the waterworks 2 Kings 20:20 credits to Hezekiah.',
      },
    ],
    sources: [],
  },
  {
    id: 'hezekiahs-tunnel',
    name: 'Hezekiah\'s Tunnel',
    aliases: ['Siloam Tunnel', 'The conduit'],
    modernName: 'City of David, Jerusalem',
    ancientNames: { hebrew: 'נִקְבָּה', hebrewTranslit: 'niqbah' },
    coordinates: [35.2361, 31.7737],
    kind: 'water',
    confidence: 'certain',
    occupation: { start: -701, end: null },
    periods: ['judah-alone'],
    parentPlaceId: 'jerusalem',
    siteRelation: 'in',
    scripture: [
      { book: '2kings', chapter: 20, verse: 20 },
      { book: '2chronicles', chapter: 32, verse: 30 },
      { book: 'isaiah', chapter: 22, verse: 11 },
    ],
    people: ['hezekiah'],
    events: [],
    polities: ['judah'],
    description:
      'A tunnel 533 metres long cut through bedrock to bring the Gihon spring inside the walls before Sennacherib\'s siege, so that the city had water and the Assyrians did not. It is one of the few engineering works the Hebrew Bible describes that anyone can still walk through, and the drop over its whole length is about thirty centimetres.',
    archaeology:
      'The S-shaped course, cut from both ends simultaneously, is still visible in the pick marks, which change direction where the two crews met. Radiocarbon and uranium-thorium dating of plaster and stalactites published in 2003 put the cutting around 700 BC, matching the biblical attribution against proposals for a Hasmonean date.',
    externalSources: [
      {
        author: 'Siloam Tunnel inscription',
        work: 'Palaeo-Hebrew inscription, Istanbul Archaeological Museum',
        locus: 'found 1880',
        date: 'c. 700 BC',
        kind: 'inscription',
        note: 'The tunnellers\' own account of the breakthrough. It names no king, which is itself notable — a royal monument would have.',
      },
      {
        author: 'Sennacherib\'s Annals',
        work: 'Taylor Prism and duplicates, British Museum',
        locus: 'Prism col. iii',
        date: '691 BC',
        kind: 'inscription',
        note: 'Records shutting Hezekiah up "like a bird in a cage" in Jerusalem — a siege the Assyrian account, unusually, does not claim to have won, and the campaign this waterwork was cut against.',
      },
      {
        author: 'Frumkin, Shimron and Rosenbaum',
        work: 'Nature 425 (2003), 169-171',
        locus: 'radiometric dating',
        kind: 'excavation',
        note: 'Dates the tunnel plaster and overlying stalactites to around 700 BC, closing the argument for a later construction.',
      },
    ],
    sources: [],
  },
  {
    id: 'golgotha',
    name: 'Golgotha',
    aliases: ['Calvary', 'The place of a skull', 'Gulgolta'],
    modernName: 'Church of the Holy Sepulchre, Jerusalem',
    ancientNames: { greek: 'Γολγοθᾶ', hebrew: 'גֻּלְגֹּלֶת', hebrewTranslit: 'gulgolet' },
    coordinates: [35.2298, 31.7784],
    kind: 'mountain',
    confidence: 'contested',
    occupation: { start: -100, end: 70 },
    periods: ['roman-judea'],
    parentPlaceId: 'jerusalem',
    siteRelation: 'in',
    scripture: [
      { book: 'matthew', chapter: 27, verse: 33 },
      { book: 'mark', chapter: 15, verse: 22 },
      { book: 'luke', chapter: 23, verse: 33 },
      { book: 'john', chapter: 19, verse: 17, verseEnd: 20 },
      { book: 'hebrews', chapter: 13, verse: 12 },
    ],
    people: ['jesus', 'pontius-pilate'],
    events: [],
    polities: ['rome'],
    description:
      'The place of execution, named for a skull and described by John as near the city and near a garden with a new tomb in it. The requirement is that it lay outside the wall of the AD 30s but close to a gate and a road, since the Gospels have passers-by reading the notice.',
    archaeology:
      'The ground under the Holy Sepulchre was an abandoned limestone quarry with Iron Age and first-century tombs cut into its face, and it lay outside the second wall until Agrippa I extended the city about AD 41 — so it satisfies the topographical requirement precisely. Hadrian built a temple platform over it around AD 135, which is how the site stayed identifiable through two centuries of exclusion.',
    alternatives: [
      {
        site: 'Church of the Holy Sepulchre',
        coordinates: [35.2298, 31.7784],
        argument:
          'A quarry with first-century tombs, outside the wall of the period and beside a gate, venerated continuously from at least the second century and identified by Constantine\'s builders in 326 under a Hadrianic platform. The archaeology and the continuity of memory both point here.',
        proponents: 'The great majority of archaeologists and historians',
      },
      {
        site: 'The Garden Tomb (Gordon\'s Calvary)',
        coordinates: [35.2306, 31.7838],
        argument:
          'A rock face north of the Damascus Gate whose eroded hollows suggest a skull, beside a rock-cut tomb in a garden with a cistern and a winepress. Proposed by Charles Gordon in 1883 on the topography and the impression of the cliff.',
        proponents: 'Gordon, and much popular Protestant tradition since',
      },
    ],
    externalSources: [
      {
        author: 'Eusebius of Caesarea',
        work: 'Life of Constantine',
        locus: '3.25-28',
        date: 'c. AD 339',
        kind: 'historian',
        note: 'Reports that the tomb was found beneath a pagan temple raised over it, and that the identification was made by removing Hadrian\'s platform rather than by revelation — a mundane account, which is a point in its favour.',
      },
      {
        author: 'Virgilio Corbo; Kathleen Kenyon',
        work: 'Excavations at the Holy Sepulchre and in the Muristan',
        locus: '1961-63; 1961-67',
        kind: 'excavation',
        note: 'Established the quarry, the first-century tombs cut into it, and that the area lay outside the line of the second wall.',
      },
      {
        author: 'Gabriel Barkay',
        work: 'Biblical Archaeology Review 12/2 (1986)',
        locus: 'on the Garden Tomb',
        kind: 'excavation',
        note: 'Dates the Garden Tomb\'s cutting to the Iron Age, not the first century — which does not settle where the crucifixion happened, but does mean this tomb was not "a new tomb in which no one had yet been laid".',
      },
    ],
    sources: [],
  },
  {
    id: 'gethsemane',
    name: 'Gethsemane',
    aliases: ['Garden of Gethsemane', 'The olive press'],
    modernName: 'Church of All Nations, Jerusalem',
    ancientNames: { greek: 'Γεθσημανί', hebrew: 'גַּת שְׁמָנֵי', hebrewTranslit: 'gat shemanei' },
    coordinates: [35.2397, 31.7794],
    kind: 'sanctuary',
    confidence: 'probable',
    occupation: { start: -100, end: 70 },
    periods: ['roman-judea'],
    parentPlaceId: 'jerusalem',
    siteRelation: 'near',
    scripture: [
      { book: 'matthew', chapter: 26, verse: 36, verseEnd: 46 },
      { book: 'mark', chapter: 14, verse: 32, verseEnd: 42 },
      { book: 'luke', chapter: 22, verse: 39, verseEnd: 46 },
      { book: 'john', chapter: 18, verse: 1 },
    ],
    people: ['jesus', 'peter'],
    events: [],
    polities: ['herodian'],
    description:
      'The enclosed olive grove across the Kidron on the lower slope of the Mount of Olives, where Jesus prayed on the night of his arrest. The name is Aramaic for "oil press", and the presence of a press is what made the plot an enclosure rather than open hillside — which is why John can call it a garden that Jesus and his disciples entered.',
    archaeology:
      'The precise plot is not fixed, but the general location is: it must be across the Kidron and on the Olivet slope, and the fourth-century church under the present Church of All Nations shows the identification was already settled by then. The ancient olives in the enclosure have been radiocarbon-dated to the twelfth century, though olives regenerate from the root and the stock may be far older.',
    externalSources: [
      {
        author: 'Egeria',
        work: 'Itinerarium (Travels)',
        locus: '36',
        date: 'c. AD 384',
        kind: 'reference',
        note: 'A pilgrim\'s account of the Holy Week liturgy, which processes from the Mount of Olives to "the place where the Lord prayed" — the earliest description of the site in use.',
      },
      josephusWar('6.5-8', 'Records that Titus\' army cut down every tree for miles around Jerusalem during the siege of AD 70, which is why no olive on the slope can be a survivor from the first century.'),
    ],
    sources: [],
  },
  {
    id: 'antonia-fortress',
    name: 'The Antonia',
    aliases: ['Fortress Antonia', 'The barracks', 'The castle'],
    modernName: null,
    ancientNames: { greek: 'Ἀντωνία' },
    coordinates: [35.2374, 31.7813],
    kind: 'fortress',
    confidence: 'probable',
    occupation: { start: -35, end: 70 },
    periods: ['roman-judea', 'apostolic'],
    parentPlaceId: 'jerusalem',
    siteRelation: 'in',
    scripture: [
      { book: 'acts', chapter: 21, verse: 31, verseEnd: 40 },
      { book: 'acts', chapter: 22, verse: 24 },
      { book: 'acts', chapter: 23, verse: 10, verseEnd: 32 },
    ],
    people: ['paul'],
    events: [],
    polities: ['rome', 'herodian'],
    description:
      'Herod\'s fortress at the north-western corner of the temple platform, garrisoned by a Roman cohort and overlooking the outer court — which is why the tribune and his soldiers can be on the scene within moments of the riot in Acts 21. Paul is carried up its steps and, standing on them, asks leave to address the crowd below in Aramaic. He is held there until the night ride to Caesarea.',
    archaeology:
      'Almost nothing survives; the rock scarp at the platform\'s north-west corner is the clearest remaining trace. The pavement long shown as the Lithostrotos in the Convent of the Sisters of Zion is now dated to Hadrian\'s rebuilding of the city, so it is not the stones Paul stood on.',
    externalSources: [
      josephusWar('5.238-247', 'Describes the Antonia in detail: built on a rock scarp, with towers at its corners, stairs down into the temple porticoes, and a permanent Roman garrison so that soldiers could watch the crowds at festivals.'),
      josephusAnt('18.55-59', 'On the garrison\'s conduct at festivals more generally, and the tensions the Roman presence at the temple produced.'),
    ],
    sources: [],
  },
  {
    id: 'praetorium-jerusalem',
    name: 'The Praetorium',
    aliases: ['Governor\'s headquarters', 'The Pavement', 'Gabbatha', 'Lithostrotos'],
    modernName: null,
    ancientNames: { greek: 'πραιτώριον', hebrew: 'גַּבְּתָא', hebrewTranslit: 'Gabbatha' },
    coordinates: [35.2280, 31.7767],
    kind: 'fortress',
    confidence: 'contested',
    occupation: { start: -23, end: 70 },
    periods: ['roman-judea'],
    parentPlaceId: 'jerusalem',
    siteRelation: 'in',
    scripture: [
      { book: 'matthew', chapter: 27, verse: 27 },
      { book: 'mark', chapter: 15, verse: 16 },
      { book: 'john', chapter: 18, verse: 28, verseEnd: 33 },
      { book: 'john', chapter: 19, verse: 13 },
    ],
    people: ['jesus', 'pontius-pilate'],
    events: [],
    polities: ['rome'],
    description:
      'Wherever the prefect lodged when he came up from Caesarea for a festival, and so the place of the Roman trial. John gives it two names — the Greek Lithostrotos, "stone pavement", and the Aramaic Gabbatha, "the height" — and sets Pilate on the judgment seat there. Which building this was is one of the long-standing questions of Jerusalem topography.',
    alternatives: [
      {
        site: 'Herod\'s palace, by the Jaffa Gate',
        coordinates: [35.2280, 31.7767],
        argument:
          'Josephus and Philo both place Roman governors in the Herodian palace on the western hill when they were in Jerusalem, and Philo describes Pilate specifically setting up shields there. It is the largest and most defensible residence in the city, and "Gabbatha", the height, suits the western hill.',
        proponents: 'Benoit, Bahat, and most current scholarship',
      },
      {
        site: 'The Antonia, at the temple\'s north-west corner',
        coordinates: [35.2374, 31.7813],
        argument:
          'The traditional identification, which fixes the route of the Via Dolorosa. It puts the trial beside the garrison and beside the crowds. Its principal evidence, the paved courtyard beneath the Sisters of Zion, has since been redated to the second century.',
        proponents: 'Long-standing pilgrim tradition; Vincent',
      },
    ],
    archaeology:
      'Excavations in the Citadel and the Armenian Garden have exposed foundations and a podium of the Herodian palace. The Antonia\'s pavement has been redated to Hadrian, which removed the main archaeological argument for the northern site.',
    externalSources: [
      {
        author: 'Philo of Alexandria',
        work: 'Embassy to Gaius',
        locus: '299-305',
        date: 'c. AD 41',
        kind: 'historian',
        note: 'Describes Pilate setting up gilded shields "in Herod\'s palace in the holy city" — direct evidence that this prefect used the palace as his Jerusalem residence.',
      },
      josephusWar('2.301-308', 'Has the governor Florus lodge at the palace, set up his tribunal in front of it, and hear a delegation there — the same arrangement the Gospels describe.'),
      {
        author: 'Pilate stone',
        work: 'Latin dedicatory inscription, Israel Museum',
        locus: 'found at Caesarea Maritima, 1961',
        date: 'AD 26-36',
        kind: 'inscription',
        note: 'Names "Pontius Pilatus, prefect of Judaea" — confirming both the man and, against Tacitus\' looser "procurator", his actual title in this period.',
      },
    ],
    sources: [],
  },
  {
    id: 'synagogue-of-the-freedmen',
    name: 'The synagogue of the Freedmen',
    aliases: ['Synagogue of the Libertines', 'Theodotus synagogue'],
    modernName: null,
    ancientNames: { greek: 'συναγωγὴ Λιβερτίνων' },
    coordinates: [35.2358, 31.7740],
    kind: 'sanctuary',
    confidence: 'conjectural',
    occupation: { start: -30, end: 70 },
    periods: ['roman-judea', 'apostolic'],
    parentPlaceId: 'jerusalem',
    siteRelation: 'in',
    scripture: [{ book: 'acts', chapter: 6, verse: 9 }],
    people: ['paul'],
    events: [],
    polities: ['rome'],
    description:
      'The Greek-speaking Diaspora synagogue whose members disputed with Stephen and brought the charge that led to his death — and, since Saul of Tarsus is standing there at the stoning, very plausibly the congregation he belonged to. "Freedmen" means descendants of Jews enslaved by Pompey and later manumitted at Rome.',
    archaeology:
      'The building is unidentified, but a synagogue of exactly this description is attested at Jerusalem by inscription, found in a cistern in the City of David in 1913.',
    externalSources: [
      {
        author: 'Theodotus inscription',
        work: 'Greek dedicatory inscription, Israel Museum',
        locus: 'found in the City of David, 1913',
        date: 'before AD 70',
        kind: 'inscription',
        note: 'Records that Theodotus son of Vettenus, priest and synagogue-ruler, built a synagogue "for the reading of the Law and the teaching of the commandments", with a guest house and water for visitors from abroad. The Latin family name points to a freedman household, and the guest rooms to a Diaspora congregation — the only first-century Jerusalem synagogue inscription known, and a close match for what Acts 6 describes.',
      },
    ],
    sources: [],
  },
  {
    id: 'upper-room',
    name: 'The Upper Room',
    aliases: ['Cenacle', 'The large upper room', 'Coenaculum'],
    modernName: 'Mount Zion, Jerusalem',
    ancientNames: { greek: 'ἀνάγαιον' },
    coordinates: [35.2292, 31.7717],
    kind: 'sanctuary',
    confidence: 'conjectural',
    occupation: { start: 20, end: 70 },
    periods: ['roman-judea', 'apostolic'],
    parentPlaceId: 'jerusalem',
    siteRelation: 'in',
    scripture: [
      { book: 'mark', chapter: 14, verse: 15 },
      { book: 'luke', chapter: 22, verse: 12 },
      { book: 'acts', chapter: 1, verse: 13 },
    ],
    people: ['jesus', 'peter', 'john-apostle'],
    events: [],
    polities: ['herodian'],
    description:
      'The furnished upper room where the last supper was held and where the group is gathered at the start of Acts. A room of that size on an upper storey implies a substantial house, which has always been part of the argument for the wealthier south-western hill.',
    archaeology:
      'No first-century room survives. The building on Mount Zion shown as the Cenacle is a Crusader hall of the twelfth century, standing over earlier structures; the identification of the hill is early but the room itself is not recoverable.',
    externalSources: [
      {
        author: 'Epiphanius of Salamis',
        work: 'On Weights and Measures',
        locus: '14',
        date: 'c. AD 392',
        kind: 'reference',
        note: 'Reports that when Hadrian came to Jerusalem he found the city destroyed except for a few houses and a small church on Zion — the earliest notice attaching a Christian meeting place to this hill.',
      },
    ],
    sources: [],
  },
];

// ── Athens, Corinth, Philippi ────────────────────────────────────────────────

const GREECE_SITES: Place[] = [
  {
    id: 'areopagus',
    name: 'The Areopagus',
    aliases: ['Mars Hill', 'Mars\' hill', 'Hill of Ares', 'Areios Pagos'],
    modernName: 'Areopagus, Athens',
    ancientNames: { greek: 'Ἄρειος Πάγος' },
    coordinates: [23.7236, 37.9724],
    kind: 'mountain',
    confidence: 'certain',
    occupation: { start: -600, end: null },
    periods: ['apostolic'],
    parentPlaceId: 'athens',
    siteRelation: 'in',
    scripture: [
      { book: 'acts', chapter: 17, verse: 19, verseEnd: 22 },
      { book: 'acts', chapter: 17, verse: 34 },
    ],
    people: ['paul', 'dionysius-areopagite', 'damaris'],
    events: [],
    polities: ['rome'],
    description:
      'The bare rock outcrop north-west of the Acropolis, and the council that met on it. Acts is ambiguous about which is meant — Paul is brought to "the Areopagus" and stands "in the midst of" it, which reads as easily of a body as of a hill — and by the first century the council often sat elsewhere. Either way the hearing is not a trial: Athens is examining a foreign lecturer, and Dionysius, one of those who believed, was a member of the council.',
    archaeology:
      'The rock itself is unmistakable and unchanged, with rock-cut steps up its eastern face. The council\'s later meeting places, including the Stoa Basileios in the Agora, are excavated below.',
    externalSources: [
      pausanias('1.28.5', 'Describes the hill, the court that met there, and the tradition that Ares was tried on it — the origin of the name.'),
      {
        author: 'Ancient inscription of Acts 17:22-31',
        work: 'Bronze plaque at the foot of the rock',
        kind: 'reference',
        note: 'The speech is set in bronze at the base of the outcrop, which is why the hill rather than the council is what most visitors now associate with the passage.',
      },
      strabo('9.1.16', 'On Athens under Roman rule, the standing of its ancient institutions, and the city\'s continuing reputation as a place of philosophy.'),
    ],
    sources: [],
  },
  {
    id: 'athens-agora',
    name: 'The Agora of Athens',
    aliases: ['The marketplace', 'Athenian Agora'],
    modernName: 'Ancient Agora, Athens',
    ancientNames: { greek: 'ἀγορά' },
    coordinates: [23.7225, 37.9755],
    kind: 'sanctuary',
    confidence: 'certain',
    occupation: { start: -600, end: 600 },
    periods: ['apostolic'],
    parentPlaceId: 'athens',
    siteRelation: 'in',
    scripture: [{ book: 'acts', chapter: 17, verse: 17, verseEnd: 21 }],
    people: ['paul'],
    events: [],
    polities: ['rome'],
    description:
      'Where Paul argued "in the marketplace every day with those who happened to be there", and where the Epicureans and Stoics picked him up. The Agora was not only a market but the civic and philosophical centre of the city, with the painted stoa that gave the Stoics their name running along its north side.',
    archaeology:
      'Excavated by the American School of Classical Studies since 1931. The Stoa Poikile, the Stoa of Attalos, the Metroon and the Altar of the Twelve Gods are all identified, and the first-century street levels are the ones Paul would have walked.',
    externalSources: [
      pausanias('1.14-17', 'Walks the reader through the Agora building by building, including altars to unnamed gods — the closest ancient description to what Paul reports seeing.'),
      {
        author: 'American School of Classical Studies at Athens',
        work: 'The Athenian Agora excavations',
        locus: 'from 1931',
        kind: 'excavation',
        note: 'The most completely excavated civic centre of any Greek city, which makes the setting of Acts 17 unusually recoverable.',
      },
    ],
    sources: [],
  },
  {
    id: 'altar-to-an-unknown-god',
    name: 'The altar to an unknown god',
    aliases: ['Agnosto Theo', 'To the Unknown God'],
    modernName: null,
    ancientNames: { greek: 'Ἀγνώστῳ Θεῷ' },
    coordinates: [23.7250, 37.9740],
    kind: 'sanctuary',
    confidence: 'unlocated',
    occupation: { start: -500, end: 200 },
    periods: ['apostolic'],
    parentPlaceId: 'athens',
    siteRelation: 'in',
    scripture: [{ book: 'acts', chapter: 17, verse: 23 }],
    people: ['paul'],
    events: [],
    polities: ['rome'],
    description:
      'The inscription Paul takes as his opening. No altar bearing exactly this singular formula has been found at Athens, and the surviving ancient notices use the plural — "altars of gods called unknown". That is a real difference, and worth stating: what the sources independently confirm is the Athenian practice of dedicating altars to unnamed deities, not the specific stone Paul quotes.',
    externalSources: [
      pausanias('1.1.4', 'At Phaleron, the harbour road into Athens, notes "altars of gods called unknown, and of heroes" — the plural, and the practice.'),
      {
        author: 'Philostratus',
        work: 'Life of Apollonius of Tyana',
        locus: '6.3',
        date: 'c. AD 220',
        kind: 'historian',
        note: 'Praises the Athenians for setting up altars even to unknown divinities, describing it as a mark of their piety.',
      },
      {
        author: 'Diogenes Laertius',
        work: 'Lives of the Eminent Philosophers',
        locus: '1.110',
        date: 'c. AD 230',
        kind: 'historian',
        note: 'Preserves the tradition that Epimenides ended a plague at Athens by loosing sheep on the Areopagus and sacrificing to an unnamed god wherever each lay down, leaving anonymous altars across the city. It is the standard explanation offered for the custom.',
      },
    ],
    sources: [],
  },
  {
    id: 'corinth-bema',
    name: 'The bema at Corinth',
    aliases: ['The judgment seat', 'Rostra', 'Bema'],
    modernName: 'Ancient Corinth, Greece',
    ancientNames: { greek: 'βῆμα' },
    coordinates: [22.8790, 37.9060],
    kind: 'sanctuary',
    confidence: 'certain',
    occupation: { start: -44, end: 400 },
    periods: ['apostolic'],
    parentPlaceId: 'corinth',
    siteRelation: 'in',
    scripture: [{ book: 'acts', chapter: 18, verse: 12, verseEnd: 17 }],
    people: ['paul', 'gallio', 'crispus'],
    events: [],
    polities: ['rome'],
    description:
      'The raised platform in the middle of the Corinthian forum from which a Roman magistrate gave judgment, and where Gallio dismissed the case against Paul as an internal dispute about words and names. The ruling mattered well beyond Corinth: a proconsul declining to treat the movement as anything other than a variety of Judaism set a precedent later governors could follow.',
    archaeology:
      'Excavated by the American School from 1896 and identified by an inscription naming the rostra. It stands on the south side of the forum, with steps up from the lower plaza — the crowd stood below and the magistrate above, exactly as Acts stages it.',
    externalSources: [
      {
        author: 'Gallio inscription',
        work: 'Rescript of Claudius, Delphi Archaeological Museum',
        locus: 'SIG³ 801D',
        date: 'AD 52',
        kind: 'inscription',
        note: 'A letter of Claudius naming "Lucius Junius Gallio, my friend and proconsul of Achaia" and dated by the emperor\'s 26th acclamation. It fixes Gallio\'s term to about AD 51-52, and with it Paul\'s eighteen months at Corinth — the single firmest date in the whole Pauline chronology.',
      },
      {
        author: 'Seneca the Younger',
        work: 'Letters and the preface to Natural Questions IV',
        locus: 'IV pref.',
        date: 'c. AD 62',
        kind: 'historian',
        note: 'Gallio was Seneca\'s elder brother, and Seneca dedicates work to him and describes his charm and his ill health in Achaia — a rare case of an incidental Acts character being independently well documented.',
      },
      {
        author: 'American School of Classical Studies',
        work: 'Corinth: Results of the Excavations',
        locus: 'vol. I.3, The Bema',
        kind: 'excavation',
        note: 'The identification and reconstruction of the rostra in the forum.',
      },
    ],
    sources: [],
  },
  {
    id: 'erastus-pavement',
    name: 'The Erastus pavement',
    aliases: ['Erastus inscription'],
    modernName: 'Ancient Corinth, Greece',
    ancientNames: {},
    coordinates: [22.8800, 37.9068],
    kind: 'sanctuary',
    confidence: 'certain',
    occupation: { start: 1, end: 200 },
    periods: ['apostolic'],
    parentPlaceId: 'corinth',
    siteRelation: 'in',
    scripture: [
      { book: 'romans', chapter: 16, verse: 23 },
      { book: '2timothy', chapter: 4, verse: 20 },
    ],
    people: ['paul', 'erastus'],
    events: [],
    polities: ['rome'],
    description:
      'A paved area east of the theatre carrying a Latin inscription cut into the stone: "Erastus, in return for his aedileship, laid this pavement at his own expense." Paul, writing Romans from Corinth, sends greetings from "Erastus, the city treasurer". Whether the two are the same man is genuinely open — the offices are not identical and the name is common — but a Christian holding civic magistracy at Corinth in the 50s would say something substantial about the social range of the congregation.',
    archaeology:
      'Found in situ in 1929. The letter-cuttings held bronze inlays, now lost. Dated on lettering to the mid-first century.',
    externalSources: [
      {
        author: 'Erastus inscription',
        work: 'Latin pavement inscription, in situ at Corinth',
        locus: 'Kent, Corinth VIII.3, no. 232',
        date: 'mid-first century AD',
        kind: 'inscription',
        note: 'The text reads ERASTVS PRO AEDILIT[AT]E S P STRAVIT. The debate turns on whether Paul\'s οἰκονόμος τῆς πόλεως corresponds to aedilis or to the junior post of quaestor, and on whether a man could hold both in sequence.',
      },
      strabo('8.6.20-23', 'On Roman Corinth: refounded as a colony by Caesar in 44 BC, repopulated largely with freedmen, and rapidly wealthy from its two harbours.'),
    ],
    sources: [
      { citation: 'Gill, Tyndale Bulletin 40 (1989), 293-301', note: 'Argues the identification is possible but not demonstrable, against both confident positions.' },
    ],
  },
  {
    id: 'acrocorinth',
    name: 'Acrocorinth',
    aliases: ['Acrocorinthus', 'The citadel of Corinth'],
    modernName: 'Acrocorinth, Greece',
    ancientNames: { greek: 'Ἀκροκόρινθος' },
    coordinates: [22.8703, 37.8907],
    kind: 'fortress',
    confidence: 'certain',
    occupation: { start: -700, end: null },
    periods: ['apostolic'],
    parentPlaceId: 'corinth',
    siteRelation: 'in',
    scripture: [],
    people: ['paul'],
    events: [],
    polities: ['rome'],
    description:
      'The limestone mountain rising 575 metres directly above Corinth, crowned by a sanctuary of Aphrodite. It is the origin of Corinth\'s reputation for sexual licence — and that reputation needs handling carefully, because the frequently repeated claim of a thousand sacred prostitutes comes from Strabo describing the *Greek* city destroyed in 146 BC, not the Roman colony Paul knew.',
    archaeology:
      'The summit sanctuary was excavated by the American School and proved small — too small for the establishment Strabo describes, which is one of the reasons the claim is now treated with reserve for the Roman period.',
    externalSources: [
      strabo('8.6.20', 'The passage behind the reputation: the temple of Aphrodite was "so rich that it owned more than a thousand temple slaves, courtesans". Strabo is reporting the archaic and classical city, and writes of the Roman colony separately.'),
      pausanias('2.4.6-2.5.1', 'Ascends Acrocorinth in the second century AD and describes the sanctuary at the top, with no mention of anything of the kind.'),
    ],
    sources: [
      { citation: 'Murphy-O\'Connor, St Paul\'s Corinth: Texts and Archaeology', note: 'On the sources for Corinth\'s reputation and what the Roman colony was actually like.' },
    ],
  },
  {
    id: 'philippi-place-of-prayer',
    name: 'The place of prayer at Philippi',
    aliases: ['Proseuche', 'The riverside'],
    modernName: 'Krenides / Gangites, Greece',
    ancientNames: { greek: 'προσευχή' },
    coordinates: [24.2680, 41.0121],
    kind: 'sanctuary',
    confidence: 'probable',
    occupation: { start: 40, end: 100 },
    periods: ['apostolic'],
    parentPlaceId: 'philippi',
    siteRelation: 'near',
    scripture: [{ book: 'acts', chapter: 16, verse: 13, verseEnd: 15 }],
    people: ['paul', 'lydia', 'silas', 'luke'],
    events: [],
    polities: ['rome'],
    description:
      'The riverside gathering outside the gate where Paul found women at prayer and Lydia was baptised — the first named European convert. Luke says they went out "where we supposed there was a place of prayer", and the group he finds is entirely female, which is usually read as meaning Philippi had too few Jewish men to constitute a synagogue.',
    archaeology:
      'The Gangites runs about two kilometres west of the city, and the Via Egnatia crossed it near a gate — a plausible location, though no structure has been identified and a προσευχή need not have been a building at all.',
    externalSources: [
      {
        author: 'Josephus',
        work: 'Antiquities of the Jews',
        locus: '14.258',
        date: 'c. AD 94',
        kind: 'historian',
        note: 'Quotes a decree of Halicarnassus permitting Jews to "make their places of prayer at the seaside, according to the custom of their fathers" — independent evidence for the practice of siting a proseuche by water.',
        url: JOSEPHUS_ANTIQUITIES,
      },
      {
        author: 'Philippi excavations, École française d\'Athènes',
        work: 'Fouilles de Philippes',
        locus: 'from 1914',
        kind: 'excavation',
        note: 'Established the line of the Via Egnatia through the city and the position of the western gate, which fixes the direction Luke describes them walking.',
      },
    ],
    sources: [],
  },
  {
    id: 'philippi-forum',
    name: 'The forum at Philippi',
    aliases: ['The marketplace at Philippi', 'Agora of Philippi'],
    modernName: 'Philippi, Greece',
    ancientNames: { greek: 'ἀγορά' },
    coordinates: [24.2864, 41.0131],
    kind: 'sanctuary',
    confidence: 'certain',
    occupation: { start: -42, end: 600 },
    periods: ['apostolic'],
    parentPlaceId: 'philippi',
    siteRelation: 'in',
    scripture: [{ book: 'acts', chapter: 16, verse: 19, verseEnd: 40 }],
    people: ['paul', 'silas'],
    events: [],
    polities: ['rome'],
    description:
      'Where the owners of the slave girl dragged Paul and Silas before the magistrates, and the charge was that "these men are Jews and are disturbing our city" — a colony of Roman citizens objecting to foreign customs. The beating and imprisonment that follow are illegal, because both men are citizens, which is the point Paul makes the next morning when the magistrates try to release them quietly.',
    archaeology:
      'The forum is fully excavated: a rectangular paved plaza with a rostrum, flanked by administrative buildings and temples, laid out in the first century and monumentalised under Antoninus Pius. Inscriptions confirm the colony\'s Latin civic vocabulary — including the στρατηγοί Luke names, the Greek for the colony\'s duumviri.',
    externalSources: [
      {
        author: 'Philippi colonial inscriptions',
        work: 'Corpus of Latin inscriptions from Philippi',
        locus: 'Pilhofer, Philippi II',
        kind: 'inscription',
        note: 'Show the city governed by duumviri attended by lictors — the officers Acts calls στρατηγοί and ῥαβδοῦχοι, "rod-bearers". Luke\'s civic terminology is that of a Roman colony rather than a Greek city, and it is correct.',
      },
      {
        author: 'Cassius Dio',
        work: 'Roman History',
        locus: '51.4',
        date: 'c. AD 220',
        kind: 'historian',
        note: 'Records the settlement of Italian colonists at Philippi after Actium, which is why a first-century crowd there reacts as Romans defending Roman custom.',
        url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Cassius_Dio/home.html',
      },
    ],
    sources: [],
  },
];

// ── Caesarea, Galilee and the wider mission ─────────────────────────────────

const OTHER_SITES: Place[] = [
  {
    id: 'sebastos-harbour',
    name: 'Sebastos, the harbour of Caesarea',
    aliases: ['Sebastos', 'Caesarea harbour'],
    modernName: 'Caesarea, Israel',
    ancientNames: { greek: 'Σεβαστός' },
    coordinates: [34.8886, 32.5019],
    kind: 'water',
    confidence: 'certain',
    occupation: { start: -22, end: 400 },
    periods: ['roman-judea', 'apostolic'],
    parentPlaceId: 'caesarea-maritima',
    siteRelation: 'in',
    scripture: [
      { book: 'acts', chapter: 9, verse: 30 },
      { book: 'acts', chapter: 18, verse: 22 },
      { book: 'acts', chapter: 21, verse: 8 },
      { book: 'acts', chapter: 27, verse: 1, verseEnd: 2 },
    ],
    people: ['paul', 'peter', 'cornelius', 'philip-evangelist'],
    events: [],
    polities: ['rome', 'herodian'],
    description:
      'Herod\'s artificial harbour on an open coast with no natural anchorage — the engineering feat that made Caesarea the province\'s port and administrative capital, and the point of arrival and departure for most of Paul\'s sea travel. He sails from here under guard for Rome.',
    archaeology:
      'Underwater excavation from 1960 mapped two great moles built of hydraulic concrete poured in wooden forms on the seabed, using volcanic ash shipped from Italy. The technique matches Vitruvius\' description of Roman marine concrete, and the harbour began subsiding within decades — the seabed is faulted here, which Herod\'s engineers could not have known.',
    externalSources: [
      josephusAnt('15.331-341', 'Describes the harbour\'s construction in detail: the depth of water, the twenty-fathom blocks sunk to make the mole, and that Herod named it Sebastos for Augustus. Underwater survey has confirmed the account closely.'),
      josephusWar('1.408-415', 'The parallel account, with the towers, the vaulted lodgings around the harbour and the temple of Rome and Augustus above it.'),
      {
        author: 'Avner Raban and Robert Hohlfelder',
        work: 'Caesarea Ancient Harbour Excavation Project',
        locus: 'from 1980',
        kind: 'excavation',
        note: 'Mapped the moles, recovered the wooden formwork and analysed the pozzolana concrete — establishing that the materials were imported from the Bay of Naples.',
      },
    ],
    sources: [],
  },
  {
    id: 'caesarea-theatre',
    name: 'The theatre at Caesarea',
    aliases: ['Caesarea theatre'],
    modernName: 'Caesarea, Israel',
    ancientNames: {},
    coordinates: [34.8917, 32.4972],
    kind: 'sanctuary',
    confidence: 'certain',
    occupation: { start: -20, end: 400 },
    periods: ['roman-judea', 'apostolic'],
    parentPlaceId: 'caesarea-maritima',
    siteRelation: 'in',
    scripture: [{ book: 'acts', chapter: 12, verse: 19, verseEnd: 23 }],
    people: ['herod-agrippa-i'],
    events: [],
    polities: ['rome', 'herodian'],
    description:
      'The seaside theatre where, on the most natural reading, Herod Agrippa I gave the address that ended in his death — Acts and Josephus give closely matching accounts of the scene, the flattery of the crowd and the sudden illness. It is also where the Pilate inscription was found, reused as building material in a later staircase.',
    archaeology:
      'Excavated by an Italian expedition from 1959. The Pilate stone turned up in 1961 in the reconstructed stairway of the theatre\'s cavea, cut down and reused — which is why the inscription is incomplete.',
    externalSources: [
      josephusAnt('19.343-352', 'Has Agrippa appear in the theatre in a garment of silver that caught the morning sun, the crowd hail him as a god, and the king struck down with pain and dead five days later. Acts 12 tells the same story with the same sequence.'),
      {
        author: 'Pilate stone',
        work: 'Latin dedicatory inscription, Israel Museum',
        locus: 'found in the theatre, 1961',
        date: 'AD 26-36',
        kind: 'inscription',
        note: 'A dedication of a Tiberieum by "[Pon]tius Pilatus, [praef]ectus Iuda[ea]e" — the only contemporary epigraphic attestation of Pilate, and the confirmation of his title.',
      },
    ],
    sources: [],
  },
  {
    id: 'capernaum-synagogue',
    name: 'The synagogue at Capernaum',
    aliases: ['Capernaum synagogue'],
    modernName: 'Kfar Nahum, Israel',
    ancientNames: { greek: 'συναγωγή' },
    coordinates: [35.5750, 32.8808],
    kind: 'sanctuary',
    confidence: 'probable',
    occupation: { start: -100, end: 700 },
    periods: ['roman-judea'],
    parentPlaceId: 'capernaum',
    siteRelation: 'in',
    scripture: [
      { book: 'mark', chapter: 1, verse: 21, verseEnd: 28 },
      { book: 'luke', chapter: 4, verse: 31, verseEnd: 37 },
      { book: 'luke', chapter: 7, verse: 5 },
      { book: 'john', chapter: 6, verse: 59 },
    ],
    people: ['jesus', 'jairus'],
    events: [],
    polities: ['herodian'],
    description:
      'The synagogue where Jesus taught on the Sabbath and where the discourse on the bread of life is set. Luke adds that it had been built for the town by a Roman centurion who "loves our nation" — an unusual arrangement that the building\'s prominence tends to support.',
    archaeology:
      'The white limestone synagogue standing today is fourth or fifth century. But it sits on a black basalt foundation of a considerably earlier building, and basalt is the local stone — so the first-century synagogue is very probably directly beneath the later one, which is as close as this kind of identification usually gets.',
    externalSources: [
      {
        author: 'Virgilio Corbo and Stanislao Loffreda',
        work: 'Studium Biblicum Franciscanum excavations at Capernaum',
        locus: 'from 1968',
        kind: 'excavation',
        note: 'Identified the basalt foundation course beneath the limestone synagogue and dated the standing building by coins and pottery in its fill.',
      },
      josephusWar('3.519-521', 'Describes the spring of Capernaum watering the plain of Gennesaret — the setting and the local economy of a lakeside town whose trade the Gospels assume.'),
    ],
    sources: [],
  },
  {
    id: 'jacobs-well',
    name: 'Jacob\'s Well',
    aliases: ['Bir Ya\'qub', 'The well at Sychar'],
    modernName: 'Balata, Nablus',
    ancientNames: { greek: 'πηγὴ τοῦ Ἰακώβ' },
    coordinates: [35.2836, 32.2098],
    kind: 'water',
    confidence: 'probable',
    occupation: { start: -1800, end: null },
    periods: ['roman-judea'],
    parentPlaceId: 'sychar',
    siteRelation: 'near',
    scripture: [{ book: 'john', chapter: 4, verse: 5, verseEnd: 26 }],
    people: ['jesus', 'jacob'],
    events: [],
    polities: ['rome'],
    description:
      'The well at the foot of Mount Gerizim where Jesus spoke with the Samaritan woman — a conversation that turns on which mountain is the right place to worship, with Gerizim visible from where they are sitting. John notes that the well is deep, which it is: about 41 metres.',
    archaeology:
      'One of the few Gospel sites with an essentially unbroken claim, since a well is not moved and there is only one here. It has been enclosed by churches since the fourth century, most recently by the Greek Orthodox church completed in 2007.',
    externalSources: [
      {
        author: 'Eusebius of Caesarea',
        work: 'Onomasticon',
        locus: 's.v. Sychar',
        date: 'c. AD 325',
        kind: 'reference',
        note: 'Locates Sychar before Neapolis, near the field and the well shown to visitors — the earliest topographical notice, and it points to the same spot.',
      },
      {
        author: 'Egeria; the Bordeaux Pilgrim',
        work: 'Pilgrim itineraries',
        locus: 'AD 333 and c. 384',
        kind: 'reference',
        note: 'Both record the well as a fixed stop, with a church already built over it by 333.',
      },
    ],
    sources: [],
  },
  {
    id: 'pergamum-great-altar',
    name: 'The Great Altar of Pergamum',
    aliases: ['Satan\'s throne', 'Altar of Zeus', 'Pergamon Altar'],
    modernName: 'Bergama, Türkiye / Pergamonmuseum, Berlin',
    ancientNames: { greek: 'βωμός' },
    coordinates: [27.1841, 39.1319],
    kind: 'sanctuary',
    confidence: 'certain',
    occupation: { start: -180, end: 300 },
    periods: ['apostolic'],
    parentPlaceId: 'pergamum',
    siteRelation: 'in',
    scripture: [{ book: 'revelation', chapter: 2, verse: 12, verseEnd: 13 }],
    people: ['john-apostle'],
    events: [],
    polities: ['rome'],
    description:
      'The monumental altar on the Pergamene acropolis, its frieze carved with the gods fighting the giants. Revelation tells the church at Pergamum that it dwells "where Satan\'s throne is", and this altar is the usual candidate — though it is not the only one, and the phrase may as easily point to the city\'s temple of Rome and Augustus, the first in Asia, or to the great healing sanctuary of Asclepius whose emblem was a serpent.',
    archaeology:
      'Excavated by Carl Humann from 1878 and largely removed to Berlin, where the west front is reconstructed in the Pergamonmuseum. The foundation platform remains on the acropolis.',
    externalSources: [
      {
        author: 'Tacitus',
        work: 'Annals',
        locus: '4.37, 4.55-56',
        date: 'c. AD 116',
        kind: 'historian',
        note: 'Records that Pergamum held the first temple of the imperial cult in Asia, dedicated to Augustus in 29 BC, and that the cities of Asia competed before the senate for the honour of a second — which is the political fact underneath Revelation\'s language about the cities of Asia.',
        url: TACITUS_ANNALS,
      },
      strabo('13.4.1-3', 'Describes the acropolis, the Attalid kings\' building programme and the Asclepieion below the city.'),
    ],
    sources: [],
  },
  {
    id: 'zeus-temple-lystra',
    name: 'The temple of Zeus before Lystra',
    aliases: ['Zeus outside the city', 'Jupiter\'s temple at Lystra'],
    modernName: null,
    ancientNames: { greek: 'ἱερεὺς τοῦ Διὸς' },
    coordinates: [32.4547, 37.5794],
    kind: 'sanctuary',
    confidence: 'conjectural',
    occupation: { start: -100, end: 300 },
    periods: ['apostolic'],
    parentPlaceId: 'lystra',
    siteRelation: 'near',
    scripture: [{ book: 'acts', chapter: 14, verse: 11, verseEnd: 18 }],
    people: ['paul', 'barnabas'],
    events: [],
    polities: ['rome'],
    description:
      'The sanctuary "before the city" whose priest brought oxen and garlands to sacrifice when the crowd took Barnabas for Zeus and Paul for Hermes. The crowd speaks Lycaonian, which is why the apostles do not immediately grasp what is happening.',
    archaeology:
      'Lystra itself is identified by an inscribed altar found in 1885, but the site is barely excavated and no temple has been located. The detail is nevertheless well grounded: local inscriptions and a stone altar from the district attest the pairing of Zeus and Hermes in exactly this region.',
    externalSources: [
      {
        author: 'Ovid',
        work: 'Metamorphoses',
        locus: '8.611-724',
        date: 'c. AD 8',
        kind: 'historian',
        note: 'Sets in Phrygia the tale of Zeus and Hermes travelling in human form, turned away by everyone but Baucis and Philemon, and rewarding the couple while destroying the rest. It explains precisely why a Lycaonian crowd would react to two travelling wonder-workers as it does.',
      },
      {
        author: 'Zeus and Hermes dedications from the Lystra district',
        work: 'Anatolian Studies / Calder, Journal of Hellenic Studies',
        locus: 'inscribed altar and stone dedications, published 1910 and 1926',
        kind: 'inscription',
        note: 'Two local inscriptions dedicate a statue and an altar to Zeus and Hermes together — the two gods paired in cult in this district specifically, which is not a common combination elsewhere.',
      },
    ],
    sources: [],
  },
  {
    id: 'castra-praetoria',
    name: 'The Praetorian camp',
    aliases: ['Castra Praetoria', 'The whole praetorian guard'],
    modernName: 'Castro Pretorio, Rome',
    ancientNames: { greek: 'πραιτώριον' },
    coordinates: [12.5083, 41.9058],
    kind: 'fortress',
    confidence: 'certain',
    occupation: { start: 23, end: 312 },
    periods: ['apostolic'],
    parentPlaceId: 'rome',
    siteRelation: 'in',
    scripture: [
      { book: 'philippians', chapter: 1, verse: 13 },
      { book: 'acts', chapter: 28, verse: 16 },
    ],
    people: ['paul'],
    events: [],
    polities: ['rome'],
    description:
      'The fortified barracks of the imperial guard on the north-east edge of the city. Paul tells the Philippians that his imprisonment has become known "throughout the whole praetorian guard" — πραιτώριον, which can mean the men or their headquarters, and here most likely the men, since he is writing about people who have heard why he is in chains.',
    archaeology:
      'Built by Sejanus under Tiberius in AD 23 to concentrate the guard in one place. Its walls were later absorbed into the Aurelian circuit and substantial stretches still stand.',
    externalSources: [
      {
        author: 'Tacitus',
        work: 'Annals',
        locus: '4.2',
        date: 'c. AD 116',
        kind: 'historian',
        note: 'Records Sejanus persuading Tiberius to gather the scattered praetorian cohorts into a single camp — creating the concentrated body Paul refers to.',
        url: TACITUS_ANNALS,
      },
      {
        author: 'Suetonius',
        work: 'Life of Tiberius',
        locus: '37',
        date: 'c. AD 121',
        kind: 'historian',
        note: 'The parallel notice on the founding of the camp and the guard\'s new visibility in the city.',
        url: SUETONIUS,
      },
    ],
    sources: [],
  },
  {
    id: 'appian-way',
    name: 'The Appian Way',
    aliases: ['Via Appia', 'The Appian road'],
    modernName: 'Via Appia Antica, Italy',
    ancientNames: { greek: 'Ἀππία ὁδός' },
    coordinates: [12.5017, 41.8760],
    kind: 'sanctuary',
    confidence: 'certain',
    occupation: { start: -312, end: null },
    periods: ['apostolic'],
    parentPlaceId: 'rome',
    siteRelation: 'near',
    scripture: [{ book: 'acts', chapter: 28, verse: 15 }],
    people: ['paul'],
    events: [],
    polities: ['rome'],
    description:
      'The road Paul walked into Rome, up from Puteoli. Believers came out to meet him at the Forum of Appius, forty-three Roman miles from the city, and at Three Taverns, thirty-three — Luke gives the mile-markers, and both are known stations on this road. "At the sight of them Paul thanked God and took courage" is the last note of feeling in Acts.',
    archaeology:
      'Long stretches of the original basalt paving survive south of the city, along with the tombs that lined it. The stations Luke names are placed by the Antonine Itinerary and by Horace\'s account of travelling the same road.',
    externalSources: [
      {
        author: 'Horace',
        work: 'Satires',
        locus: '1.5',
        date: 'c. 35 BC',
        kind: 'historian',
        note: 'Describes the journey along this road stage by stage, including Forum Appii — "crammed with boatmen and grasping innkeepers" — and the canal boat through the marshes. It is the same route in the same order Luke gives, from the other direction.',
      },
      strabo('5.3.6', 'Describes the Appian Way and the canal running beside it through the Pomptine Marshes, with the stations along the route.'),
    ],
    sources: [],
  },
];

/**
 * The curated sites, assembled. These are merged into the gazetteer alongside the
 * curated core, so a TIPNR or OpenBible record naming the same place enriches the
 * written entry rather than pinning a second dot next to it.
 */
export const CURATED_SITES: Place[] = [
  ...EPHESUS_SITES,
  ...JERUSALEM_SITES,
  ...GREECE_SITES,
  ...OTHER_SITES,
];
