import type { Place } from '../../types';

/**
 * Egypt, Sinai and the Negev crossing.
 *
 * This is the region where the atlas has to be most careful. Almost every station
 * of the wilderness itinerary in Numbers 33 is unlocated or contested, and the two
 * competing Exodus dates imply different sites for several of them. Entries here
 * carry lower confidence ratings than anywhere else in the corpus, deliberately.
 */
export const EGYPT_SINAI_PLACES: Place[] = [
  {
    id: 'rameses',
    name: 'Rameses',
    aliases: ['Pi-Rameses', 'Raamses', 'Qantir'],
    modernName: 'Qantir, Egypt',
    ancientNames: {
      hebrew: 'רַעְמְסֵס',
      hebrewTranslit: 'Ra\'amses',
      other: [{ language: 'Egyptian', form: 'Per-Ramesses' }],
    },
    coordinates: [31.8333, 30.8000],
    kind: 'city',
    confidence: 'probable',
    occupation: { start: -1300, end: -1050 },
    periods: ['egypt-exodus'],
    scripture: [
      { book: 'exodus', chapter: 1, verse: 11 },
      { book: 'exodus', chapter: 12, verse: 37 },
      { book: 'numbers', chapter: 33, verse: 3, verseEnd: 5 },
    ],
    people: ['moses', 'aaron'],
    events: ['exodus-departure'],
    polities: ['egypt'],
    description:
      'One of the two store cities Israel is said to have built, and the departure point of the Exodus. The Ramesside capital in the eastern Delta has been located at Qantir, a vast site with palaces, stables and a chariot works. The name is the strongest single argument for a thirteenth-century Exodus, since Per-Ramesses only bore that name from the reign of Rameses II. Advocates of the earlier date reply that the text uses a later, updated name for an older place — a practice the Bible follows elsewhere.',
    archaeology:
      'Magnetometry at Qantir has mapped a city of several square kilometres, including the largest known chariot garrison in Egypt. There is no Egyptian record of the departure of a Semitic slave population, which is unsurprising given that Egyptian royal inscriptions do not record defeats.',
    sources: [
      { citation: 'Bietak, Avaris: The Capital of the Hyksos', note: 'On the Delta sequence from Avaris to Per-Ramesses.' },
      { citation: 'Kitchen, On the Reliability of the Old Testament', note: 'Argues the store-city names support the 13th-century date.' },
      { citation: 'Hoffmeier, Israel in Egypt', note: 'On Egyptian toponymy in the Exodus narrative and name-updating.' },
    ],
  },
  {
    id: 'goshen',
    name: 'Goshen',
    aliases: ['Land of Goshen', 'Land of Rameses'],
    modernName: 'Wadi Tumilat / eastern Nile Delta',
    ancientNames: { hebrew: 'גֹּשֶׁן', hebrewTranslit: 'Goshen', greek: 'Γεσέμ' },
    coordinates: [31.9000, 30.6000],
    kind: 'region',
    confidence: 'probable',
    occupation: { start: -1900, end: -1100 },
    periods: ['patriarchal', 'egypt-exodus'],
    scripture: [
      { book: 'genesis', chapter: 47, verse: 1, verseEnd: 12 },
      { book: 'exodus', chapter: 8, verse: 22 },
      { book: 'exodus', chapter: 9, verse: 26 },
    ],
    people: ['joseph', 'jacob', 'moses'],
    events: [],
    polities: ['egypt'],
    description:
      'The district of the eastern Delta given to Jacob\'s family — good grazing land, on the frontier rather than in the Egyptian heartland, which fits both the pastoral occupation described and Egyptian distaste for shepherds. It is a region rather than a point; the atlas marks its approximate centre.',
    archaeology:
      'Tell el-Dab\'a (ancient Avaris) in this district shows a large Semitic-speaking population settled in Egypt through the Middle Bronze Age, with Levantine house forms, burial customs and donkey burials — direct evidence for the kind of West Semitic presence in the Delta that the Joseph narrative presupposes, whether or not it relates to Israel specifically.',
    sources: [
      { citation: 'Bietak, Tell el-Dab\'a excavation reports', note: 'On the Levantine settlement of the eastern Delta.' },
    ],
  },
  {
    id: 'memphis',
    name: 'Memphis',
    aliases: ['Noph', 'Moph'],
    modernName: 'Mit Rahina, Egypt',
    ancientNames: { hebrew: 'נֹף', hebrewTranslit: 'Nof', greek: 'Μέμφις' },
    coordinates: [31.2500, 29.8500],
    kind: 'capital',
    confidence: 'certain',
    occupation: { start: -3100, end: 640 },
    periods: ['patriarchal', 'egypt-exodus', 'judah-alone', 'exile'],
    scripture: [
      { book: 'isaiah', chapter: 19, verse: 13 },
      { book: 'jeremiah', chapter: 46, verse: 14, verseEnd: 19 },
      { book: 'ezekiel', chapter: 30, verse: 13 },
    ],
    people: [],
    events: [],
    polities: ['egypt'],
    description:
      'The ancient administrative capital of Egypt at the apex of the Delta, and the city Judeans fleeing after 586 BC settled in. The prophets address it as the embodiment of Egyptian power.',
    sources: [],
  },
  {
    id: 'thebes-egypt',
    name: 'Thebes',
    aliases: ['No', 'No-Amon'],
    modernName: 'Luxor, Egypt',
    ancientNames: { hebrew: 'נֹא אָמוֹן', hebrewTranslit: 'No Amon', greek: 'Θῆβαι' },
    coordinates: [32.6396, 25.7188],
    kind: 'capital',
    confidence: 'certain',
    occupation: { start: -3200, end: null },
    periods: ['egypt-exodus', 'judah-alone'],
    scripture: [
      { book: 'nahum', chapter: 3, verse: 8, verseEnd: 10 },
      { book: 'jeremiah', chapter: 46, verse: 25 },
    ],
    people: [],
    events: [],
    polities: ['egypt'],
    description:
      'The great southern capital and cult centre of Amun. Nahum uses its sack by the Assyrians in 663 BC as a warning to Nineveh: if Thebes could fall, so can you. The Merneptah Stele, which carries the earliest known mention of Israel as a people, was found in Merneptah\'s mortuary temple here.',
    archaeology:
      'The Merneptah Stele (c. 1207 BC) lists "Israel" among defeated peoples in Canaan, marked with the determinative for a people rather than a city-state — the earliest extrabiblical attestation of Israel, and a firm terminus by which Israel existed in Canaan.',
    sources: [
      { citation: 'Merneptah Stele (Egyptian Museum, Cairo, JE 31408)', note: 'Earliest known extrabiblical mention of Israel.' },
    ],
  },
  {
    id: 'mount-sinai',
    name: 'Mount Sinai',
    aliases: ['Horeb', 'Mountain of God', 'Jebel Musa'],
    modernName: 'Jebel Musa, Sinai (traditional)',
    ancientNames: { hebrew: 'הַר סִינַי', hebrewTranslit: 'Har Sinai' },
    coordinates: [33.9750, 28.5392],
    kind: 'mountain',
    confidence: 'contested',
    occupation: { start: -2100, end: null },
    periods: ['egypt-exodus'],
    scripture: [
      { book: 'exodus', chapter: 3, verse: 1, verseEnd: 6 },
      { book: 'exodus', chapter: 19 },
      { book: 'exodus', chapter: 20, verse: 1, verseEnd: 21 },
      { book: '1kings', chapter: 19, verse: 8, verseEnd: 18 },
    ],
    people: ['moses', 'aaron', 'elijah'],
    events: ['sinai-covenant'],
    polities: [],
    description:
      'The mountain of the covenant. Its location is not recoverable from the text, which gives no coordinates and whose itinerary can be read consistently with several routes. The traditional identification with Jebel Musa in the southern Sinai is Byzantine, going back to the fourth century AD and monastic settlement at the foot of the mountain — a strong tradition, but a late one.',
    alternatives: [
      {
        site: 'Jebel Sin Bishar (northern Sinai)',
        coordinates: [33.1500, 30.0000],
        argument: 'Much closer to Egypt, fitting a three-day journey and a route that avoids Egyptian mining and garrison zones in the south.',
        proponents: 'Har-el',
      },
      {
        site: 'Hala-l Badr / north-west Arabia',
        coordinates: [37.1667, 27.6667],
        argument: 'Places Midian, and so the mountain of Moses\' exile, east of the Gulf of Aqaba where Midian is otherwise located; a volcanic peak would suit the fire and smoke imagery.',
        proponents: 'Jarvis, Beke and, in a different form, Kerkeslager',
      },
      {
        site: 'Jebel Serbal',
        coordinates: [33.6500, 28.6500],
        argument: 'Favoured by some early Christian writers before Jebel Musa became dominant.',
      },
    ],
    archaeology:
      'No candidate has produced archaeological evidence of a mass encampment, which is expected: a nomadic population leaves almost nothing recoverable after three millennia in a desert. Absence of evidence carries little weight here in either direction.',
    sources: [
      { citation: 'Hoffmeier, Ancient Israel in Sinai', note: 'Survey of the candidate mountains and the routes each implies.' },
      { citation: 'Egeria, Itinerarium (c. AD 384)', note: 'Earliest detailed pilgrim account of the southern Sinai tradition.' },
    ],
  },
  {
    id: 'kadesh-barnea',
    name: 'Kadesh-barnea',
    aliases: ['Kadesh', 'En-mishpat'],
    modernName: 'Ein el-Qudeirat (probable)',
    ancientNames: { hebrew: 'קָדֵשׁ בַּרְנֵעַ', hebrewTranslit: 'Qadesh Barnea' },
    coordinates: [34.4200, 30.6800],
    kind: 'wilderness',
    confidence: 'probable',
    occupation: { start: -1000, end: -580 },
    periods: ['egypt-exodus', 'conquest-judges'],
    scripture: [
      { book: 'numbers', chapter: 13, verse: 26 },
      { book: 'numbers', chapter: 20, verse: 1, verseEnd: 13 },
      { book: 'deuteronomy', chapter: 1, verse: 19, verseEnd: 46 },
    ],
    people: ['moses', 'aaron', 'miriam', 'caleb', 'joshua'],
    events: ['spies-sent-out'],
    polities: [],
    description:
      'The oasis where Israel spends the bulk of the wilderness years, from which the spies are sent into Canaan and where the refusal to enter leads to the forty years. Ein el-Qudeirat is the largest spring in the northern Sinai and the obvious candidate on water grounds.',
    archaeology:
      'The fortresses excavated at Ein el-Qudeirat are Iron Age — tenth to sixth century — with no second-millennium settlement. As at Mount Sinai, this is what an encampment of tents would leave, but it means the identification rests on topography and the survival of the name in the nearby Ein Qadeis rather than on stratigraphy.',
    sources: [
      { citation: 'Cohen, Kadesh-Barnea: A Fortress from the Time of the Judaean Kingdom', note: 'On the Iron Age fortress sequence at the spring.' },
    ],
  },
  {
    id: 'ezion-geber',
    name: 'Ezion-geber',
    aliases: ['Elath', 'Eloth'],
    modernName: 'Tell el-Kheleifeh / Aqaba',
    ancientNames: { hebrew: 'עֶצְיוֹן גֶּבֶר', hebrewTranslit: 'Etzion Gever' },
    coordinates: [35.0033, 29.5300],
    kind: 'town',
    confidence: 'contested',
    occupation: { start: -1000, end: -400 },
    periods: ['egypt-exodus', 'united-monarchy', 'divided-monarchy'],
    scripture: [
      { book: 'numbers', chapter: 33, verse: 35 },
      { book: '1kings', chapter: 9, verse: 26 },
      { book: '1kings', chapter: 22, verse: 48 },
      { book: '2kings', chapter: 16, verse: 6 },
    ],
    people: ['solomon', 'jehoshaphat'],
    events: [],
    polities: ['united-israel', 'judah', 'edom'],
    description:
      'Solomon\'s Red Sea port, from which fleets sailed to Ophir. Its location on the Gulf of Aqaba is secure in general terms; which specific site is meant is not. Tell el-Kheleifeh was long identified with it, but its remains are later than Solomon.',
    alternatives: [
      {
        site: 'Jezirat Faraun (Coral Island)',
        coordinates: [34.6167, 29.4667],
        argument: 'A small island with an ancient artificial harbour, the only sheltered anchorage in the northern gulf — a better fit for a naval base than an open shore site.',
        proponents: 'Flinder',
      },
    ],
    archaeology:
      'Glueck read Tell el-Kheleifeh as a copper refinery on the strength of what he took to be flue holes; the structure is now generally understood as a storehouse or granary with roof-beam sockets. The correction is a useful reminder of how confidently early identifications were made.',
    sources: [
      { citation: 'Pratico, Nelson Glueck\'s 1938-1940 Excavations at Tell el-Kheleifeh: A Reappraisal', note: 'The reassessment of the "smelter" interpretation.' },
    ],
  },
  {
    id: 'red-sea-crossing',
    name: 'The Sea of Reeds',
    aliases: ['Yam Suph', 'Red Sea'],
    modernName: 'Eastern Nile Delta lakes (probable)',
    ancientNames: { hebrew: 'יַם סוּף', hebrewTranslit: 'Yam Suph' },
    coordinates: [32.3500, 30.6000],
    kind: 'water',
    confidence: 'conjectural',
    occupation: { start: -2100, end: null },
    periods: ['egypt-exodus'],
    scripture: [
      { book: 'exodus', chapter: 14 },
      { book: 'exodus', chapter: 15, verse: 1, verseEnd: 21 },
      { book: 'numbers', chapter: 33, verse: 8 },
    ],
    people: ['moses', 'aaron'],
    events: ['sea-crossing'],
    polities: ['egypt'],
    description:
      'The water Israel crosses leaving Egypt. The Hebrew yam suph means "sea of reeds", which points to a papyrus-fringed lake rather than the deep Red Sea proper — the Greek translators\' "Red Sea" is an interpretation, not a translation. Candidates include Lake Ballah, Lake Timsah and the Bitter Lakes, all in the isthmus later cut by the Suez Canal, as well as the Gulf of Suez itself.',
    archaeology:
      'Egyptian sources locate a body of water called pa-tjufy, "the papyrus marsh", in the eastern Delta, which is philologically close to yam suph and geographically plausible. The lakes of the isthmus have shifted considerably since antiquity, and the canal has destroyed much of the relevant ground.',
    sources: [
      { citation: 'Hoffmeier, Israel in Egypt, ch. 9', note: 'On yam suph, pa-tjufy and the Delta lake candidates.' },
    ],
  },
];
