import type { Polity } from '../types';

/**
 * Kingdoms and empires, with coarse territorial extents.
 *
 * A caution that the UI repeats to the user: **these are not borders.** Ancient
 * states controlled roads, river crossings, cities and their immediate hinterland;
 * authority faded with distance rather than stopping at a line. The polygons here
 * are generalised zones of control at each polity's approximate height, drawn to
 * about a degree of resolution, and they should be read as shading rather than as
 * cartography. Several small polities carry `extent: null` because any polygon we
 * drew would imply more precision than the evidence supports; those appear in the
 * text of place entries but are not shaded on the map.
 */
export const POLITIES: Polity[] = [
  {
    id: 'canaanite-city-states',
    name: 'Canaanite city-states',
    range: { start: -2000, end: -1150 },
    extent: null,
    color: '#8C7A5B',
    summary:
      'Not a state but a patchwork of independent walled cities — Hazor, Megiddo, Shechem, Lachish, Jerusalem — under loose Egyptian overlordship through the Late Bronze Age. The Amarna letters preserve their rulers writing to Pharaoh, mostly to complain about each other.',
    capitalPlaceId: null,
    sources: [{ citation: 'Moran, The Amarna Letters', note: 'The correspondence of the Canaanite city rulers with the Egyptian court.' }],
  },
  {
    id: 'egypt',
    name: 'Egypt',
    range: { start: -2100, end: -30 },
    extent: {
      type: 'Polygon',
      coordinates: [[[29.0, 31.6], [32.6, 31.4], [34.3, 31.2], [34.6, 29.5], [33.5, 24.0], [32.0, 22.0], [30.5, 24.5], [29.5, 28.0], [29.0, 31.6]]],
    },
    color: '#9B8248',
    summary:
      'The regional power to the south, and the setting of the Joseph and Exodus narratives. Egyptian control of Canaan was strongest in the Late Bronze Age and receded after about 1150 BC, which is part of the context for Israel\'s emergence in the highlands.',
    capitalPlaceId: 'memphis',
    sources: [],
  },
  {
    id: 'tribal-israel',
    name: 'Tribal Israel',
    range: { start: -1200, end: -1050 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.95, 31.6], [35.0, 32.4], [35.25, 32.9], [35.6, 32.9], [35.85, 32.3], [35.6, 31.6], [35.3, 31.3], [34.95, 31.6]]],
    },
    color: '#6E7F5C',
    summary:
      'The settlement phase, concentrated in the central highlands where survey archaeology records a sharp increase in small unwalled villages in Iron Age I. There was no capital and no standing territory in the later sense — the shading here marks the settlement zone, not a polity.',
    capitalPlaceId: 'shiloh',
    sources: [{ citation: 'Finkelstein, The Archaeology of the Israelite Settlement', note: 'The highland survey data underlying this distribution.' }],
  },
  {
    id: 'philistine-pentapolis',
    name: 'Philistia',
    range: { start: -1175, end: -604 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.35, 31.35], [34.45, 31.85], [34.95, 31.88], [34.98, 31.4], [34.6, 31.15], [34.35, 31.35]]],
    },
    color: '#8A5C4E',
    summary:
      'Five cities on the southern coastal plain — Gaza, Ashkelon, Ashdod, Ekron and Gath — settled by one of the Sea Peoples groups around 1175 BC. Their distinctive Aegean-derived pottery and diet mark them out sharply from their Canaanite neighbours in the archaeological record.',
    capitalPlaceId: 'gath',
    sources: [{ citation: 'Dothan, People of the Sea', note: 'On the Aegean material culture of the early Philistine settlement.' }],
  },
  {
    id: 'united-israel',
    name: 'The United Kingdom',
    range: { start: -1050, end: -931 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.35, 31.25], [34.6, 31.95], [34.95, 32.55], [35.05, 33.05], [35.7, 33.3], [36.1, 32.9], [35.95, 32.1], [35.85, 31.4], [35.6, 30.85], [34.9, 30.8], [34.35, 31.25]]],
    },
    color: '#5F6E4E',
    summary:
      'The kingdom of Saul, David and Solomon. The extent shown is the maximal reading of the biblical account, from the Negev to the upper Jordan with Transjordanian vassals. Minimalist readings of the tenth-century archaeology would shade a considerably smaller area; the atlas draws the maximal case and flags the dispute rather than splitting the difference silently.',
    capitalPlaceId: 'jerusalem',
    sources: [
      { citation: 'Finkelstein & Silberman, David and Solomon', note: 'The case for a much smaller tenth-century polity.' },
      { citation: 'Mazar, in The Quest for the Historical Israel', note: 'The case for a substantial united kingdom.' },
    ],
  },
  {
    id: 'israel-north',
    name: 'Israel (northern kingdom)',
    range: { start: -931, end: -722 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.85, 32.05], [34.95, 32.6], [35.1, 33.1], [35.65, 33.2], [35.95, 32.55], [35.75, 31.95], [35.35, 31.92], [34.85, 32.05]]],
    },
    color: '#6B7A55',
    summary:
      'The larger and wealthier of the two successor kingdoms, with better land and control of the international highway. Its kings — Omri, Ahab, Jehu, Jeroboam II — appear repeatedly in Assyrian inscriptions; Assyria called the kingdom the "House of Omri" long after that dynasty ended.',
    capitalPlaceId: 'samaria-city',
    sources: [{ citation: 'Kurkh Monolith of Shalmaneser III', note: 'Names Ahab of Israel among the coalition at Qarqar, 853 BC.' }],
  },
  {
    id: 'judah',
    name: 'Judah',
    range: { start: -931, end: -586 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.5, 31.35], [34.9, 31.9], [35.35, 31.95], [35.55, 31.5], [35.4, 31.05], [34.85, 30.9], [34.5, 31.35]]],
    },
    color: '#7A6247',
    summary:
      'The southern kingdom, poorer and more isolated but longer-lived, surviving the fall of Samaria by 136 years. Its territory contracted sharply after Sennacherib\'s campaign of 701 BC stripped away the Shephelah towns.',
    capitalPlaceId: 'jerusalem',
    sources: [],
  },
  {
    id: 'aram-damascus',
    name: 'Aram-Damascus',
    range: { start: -950, end: -732 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.7, 33.0], [35.9, 33.9], [36.9, 34.0], [37.2, 33.2], [36.6, 32.4], [35.9, 32.6], [35.7, 33.0]]],
    },
    color: '#7C6A80',
    summary:
      'Israel\'s principal northern rival, centred on Damascus. Under Hazael in the late ninth century it dominated the region and campaigned as far south as Gath. Tiglath-pileser III destroyed it in 732 BC.',
    capitalPlaceId: 'damascus',
    sources: [],
  },
  {
    id: 'moab',
    name: 'Moab',
    range: { start: -1300, end: -580 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.5, 31.0], [35.55, 31.85], [36.1, 31.85], [36.2, 31.0], [35.9, 30.85], [35.5, 31.0]]],
    },
    color: '#8B6B5A',
    summary: 'The plateau east of the Dead Sea. The Mesha Stele from its capital at Dibon is the fullest Moabite text known and describes its revolt against Israel.',
    capitalPlaceId: 'dibon',
    sources: [{ citation: 'Mesha Stele (Louvre)', note: 'Moabite royal inscription, c. 840 BC.' }],
  },
  {
    id: 'ammon',
    name: 'Ammon',
    range: { start: -1250, end: -580 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.7, 31.85], [35.75, 32.35], [36.3, 32.35], [36.4, 31.85], [36.0, 31.65], [35.7, 31.85]]],
    },
    color: '#8B7A5A',
    summary: 'A small kingdom around Rabbah, in conflict with Israel from the judges through the monarchy. Its language and script are close cousins of Hebrew.',
    capitalPlaceId: 'rabbah-ammon',
    sources: [],
  },
  {
    id: 'edom',
    name: 'Edom',
    range: { start: -1300, end: -400 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.0, 29.5], [35.1, 30.9], [35.9, 30.95], [36.1, 30.0], [35.6, 29.4], [35.0, 29.5]]],
    },
    color: '#8F5F4A',
    summary: 'The highlands south-east of the Dead Sea, controlling the copper of the Wadi Faynan and the caravan route to the Red Sea. Obadiah is directed against it.',
    capitalPlaceId: null,
    sources: [],
  },
  {
    id: 'phoenicia',
    name: 'Phoenicia',
    range: { start: -1200, end: -330 },
    extent: {
      type: 'Polygon',
      coordinates: [[[35.0, 33.0], [35.1, 34.6], [35.7, 34.7], [35.6, 33.2], [35.2, 32.9], [35.0, 33.0]]],
    },
    color: '#5E7A78',
    summary:
      'The Canaanite cities of the northern coast — Tyre, Sidon, Byblos — which turned to the sea and founded colonies as far as Spain. Allied to Israel under Solomon and Ahab, and the source of the alphabet Greek and Latin descend from.',
    capitalPlaceId: 'tyre',
    sources: [],
  },
  {
    id: 'neo-assyrian',
    name: 'Neo-Assyrian Empire',
    range: { start: -911, end: -609 },
    extent: {
      type: 'Polygon',
      coordinates: [[[30.5, 31.2], [31.0, 37.0], [38.0, 38.5], [44.0, 38.0], [48.5, 33.5], [47.5, 30.2], [43.0, 30.0], [38.0, 29.5], [34.2, 29.3], [30.5, 31.2]]],
    },
    color: '#7A4A44',
    summary:
      'The first empire to hold the whole Fertile Crescent, and the power that destroyed the northern kingdom and reduced Judah to vassalage. Its policy of mass deportation was designed to break regional identities; it is why the northern tribes disappear from history.',
    capitalPlaceId: 'nineveh',
    sources: [],
  },
  {
    id: 'neo-babylonian',
    name: 'Neo-Babylonian Empire',
    range: { start: -626, end: -539 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.2, 29.4], [34.6, 34.5], [38.0, 37.2], [44.0, 36.0], [48.2, 31.0], [45.5, 29.4], [38.0, 29.0], [34.2, 29.4]]],
    },
    color: '#6B4A6B',
    summary: 'Nebuchadnezzar\'s empire, which took Assyria\'s place and destroyed Jerusalem in 586 BC. It lasted less than ninety years before falling to Persia.',
    capitalPlaceId: 'babylon',
    sources: [],
  },
  {
    id: 'achaemenid',
    name: 'Achaemenid Persian Empire',
    range: { start: -550, end: -330 },
    extent: {
      type: 'Polygon',
      coordinates: [[[25.0, 30.5], [26.0, 41.5], [45.0, 43.0], [60.0, 40.0], [70.0, 32.0], [61.0, 25.0], [48.0, 24.5], [32.0, 22.0], [25.0, 30.5]]],
    },
    color: '#4E6B7A',
    summary:
      'The largest empire the world had yet seen, and the one under which the exiles returned. Its practice of restoring deported peoples and supporting local cults — attested on the Cyrus Cylinder independently of the Bible — made the rebuilding of the temple possible.',
    capitalPlaceId: 'susa',
    sources: [{ citation: 'Cyrus Cylinder (British Museum)', note: 'States the policy of restoring peoples and sanctuaries.' }],
  },
  {
    id: 'seleucid',
    name: 'Seleucid Empire',
    range: { start: -312, end: -63 },
    extent: {
      type: 'Polygon',
      coordinates: [[[30.0, 31.0], [30.5, 38.5], [40.0, 39.0], [50.0, 37.0], [55.0, 30.0], [48.0, 26.0], [36.0, 28.5], [30.0, 31.0]]],
    },
    color: '#5A6A55',
    summary:
      'One of the successor kingdoms after Alexander. Antiochus IV\'s attempt to suppress Jewish practice provoked the Maccabean revolt and, eventually, an independent Jewish state.',
    capitalPlaceId: 'antioch-syria',
    sources: [],
  },
  {
    id: 'hasmonean',
    name: 'Hasmonean Kingdom',
    range: { start: -140, end: -37 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.4, 31.2], [34.7, 32.4], [35.1, 33.0], [35.9, 32.9], [36.0, 31.8], [35.7, 31.0], [34.9, 30.85], [34.4, 31.2]]],
    },
    color: '#6E6A45',
    summary: 'The independent Jewish state that emerged from the Maccabean revolt, expanding to roughly the extent of the old kingdom before Roman intervention ended it.',
    capitalPlaceId: 'jerusalem',
    sources: [],
  },
  {
    id: 'herodian',
    name: 'Herodian Kingdom',
    range: { start: -37, end: 92 },
    extent: {
      type: 'Polygon',
      coordinates: [[[34.4, 31.2], [34.8, 32.6], [35.15, 33.3], [36.1, 33.2], [36.2, 32.0], [35.75, 31.0], [34.9, 30.8], [34.4, 31.2]]],
    },
    color: '#7A6B4E',
    summary:
      'Herod the Great ruled as a Roman client king from 37 BC, and after his death the territory was divided among his sons — which is why the Gospels move between a tetrarchy in Galilee and a prefecture in Judea. His building programme reshaped Jerusalem, Caesarea, Masada and Hebron.',
    capitalPlaceId: 'jerusalem',
    sources: [],
  },
  {
    id: 'rome',
    name: 'Roman Empire',
    range: { start: -63, end: 476 },
    extent: {
      type: 'Polygon',
      coordinates: [[[9.0, 36.5], [11.0, 45.5], [22.0, 46.0], [30.0, 45.0], [37.0, 41.5], [41.0, 35.0], [36.5, 30.5], [32.0, 22.5], [22.0, 30.0], [12.0, 33.0], [9.0, 36.5]]],
    },
    color: '#6A5A6E',
    summary:
      'The empire within which the whole New Testament takes place. Its roads, its common Greek and its sea lanes are the physical infrastructure of the Pauline mission — the map of that mission is, in large part, a map of Roman communications.',
    capitalPlaceId: 'rome',
    sources: [],
  },
  {
    id: 'jebusite',
    name: 'Jebusite Jerusalem',
    range: { start: -1400, end: -1003 },
    extent: null,
    color: '#8C7A5B',
    summary: 'The pre-Israelite city-state holding the Jerusalem ridge, taken by David around 1003 BC.',
    capitalPlaceId: 'jerusalem',
    sources: [],
  },
  {
    id: 'nabatean',
    name: 'Nabatean Kingdom',
    range: { start: -168, end: 106 },
    extent: null,
    color: '#8A6A4A',
    summary: 'An Arab trading kingdom centred on Petra, controlling the incense routes. Aretas IV, whose governor watched the gates of Damascus for Paul, ruled AD 9 to 40.',
    capitalPlaceId: 'petra-sela',
    sources: [],
  },
  {
    id: 'sumer-akkad',
    name: 'Sumer and Akkad',
    range: { start: -2900, end: -1750 },
    extent: null,
    color: '#7A6A55',
    summary: 'The southern Mesopotamian city-states of Abraham\'s traditional homeland, including Ur at its third-dynasty height.',
    capitalPlaceId: 'ur',
    sources: [],
  },
];
