import type { Journey } from '../types';

/**
 * Traced routes.
 *
 * Every leg connects two places that exist in the gazetteer — a test enforces
 * this, so a journey can never reference a place the map cannot draw. Legs marked
 * `inferred` are connections the text implies without naming the road; the map
 * renders them dashed so the user can see which parts of a route are reconstructed.
 */
export const JOURNEYS: Journey[] = [
  {
    id: 'abraham-migration',
    name: 'The migration of Abraham',
    traveler: 'abraham',
    range: { start: -1950, end: -1850 },
    periods: ['patriarchal'],
    summary:
      'From Ur up the Euphrates to Harran, then south along the ridge route through Canaan, into Egypt during a famine, and back to the Negev. The route follows the Fertile Crescent because the direct line across the Syrian desert was not passable for herds.',
    routeConfidence: 'conjectural',
    color: '#9a3b2e',
    legs: [
      { fromPlace: 'ur', toPlace: 'harran', mode: 'inferred', scripture: [{ book: 'genesis', chapter: 11, verse: 31 }], note: 'The route up the Euphrates is implied rather than described. If Ur is the northern city, this leg is short.' },
      { fromPlace: 'harran', toPlace: 'shechem', mode: 'land', scripture: [{ book: 'genesis', chapter: 12, verse: 4, verseEnd: 6 }] },
      { fromPlace: 'shechem', toPlace: 'bethel', mode: 'land', scripture: [{ book: 'genesis', chapter: 12, verse: 8 }] },
      { fromPlace: 'bethel', toPlace: 'goshen', mode: 'inferred', scripture: [{ book: 'genesis', chapter: 12, verse: 10 }], note: 'Genesis says only that he went down to Egypt; the destination within Egypt is not named.' },
      { fromPlace: 'goshen', toPlace: 'bethel', mode: 'inferred', scripture: [{ book: 'genesis', chapter: 13, verse: 1, verseEnd: 4 }] },
      { fromPlace: 'bethel', toPlace: 'hebron', mode: 'land', scripture: [{ book: 'genesis', chapter: 13, verse: 18 }] },
      { fromPlace: 'hebron', toPlace: 'beersheba', mode: 'land', scripture: [{ book: 'genesis', chapter: 21, verse: 33 }] },
    ],
    scripture: [
      { book: 'genesis', chapter: 12 },
      { book: 'genesis', chapter: 13 },
    ],
    sources: [
      { citation: 'Aharoni, The Land of the Bible', note: 'On the ridge route and the constraints herding imposes on movement.' },
    ],
  },
  {
    id: 'exodus-route',
    name: 'The Exodus and wilderness itinerary',
    traveler: 'moses',
    range: { start: -1250, end: -1210 },
    periods: ['egypt-exodus'],
    summary:
      'From Rameses to the sea, to the mountain of the covenant, to Kadesh-barnea, and finally around Edom to the plains of Moab. Numbers 33 lists over forty stations; most cannot be located, and the route drawn here connects only the fixed points the atlas can defend. It should be read as a sketch of the journey\'s shape, not as a survey of the path taken.',
    routeConfidence: 'conjectural',
    color: '#b07a1f',
    legs: [
      { fromPlace: 'rameses', toPlace: 'red-sea-crossing', mode: 'land', scripture: [{ book: 'exodus', chapter: 13, verse: 20, verseEnd: 22 }] },
      { fromPlace: 'red-sea-crossing', toPlace: 'mount-sinai', mode: 'inferred', scripture: [{ book: 'exodus', chapter: 19, verse: 1, verseEnd: 2 }], note: 'The southern route shown assumes the traditional Jebel Musa identification. Northern and Arabian candidates imply substantially different paths.' },
      { fromPlace: 'mount-sinai', toPlace: 'kadesh-barnea', mode: 'inferred', scripture: [{ book: 'numbers', chapter: 13, verse: 26 }] },
      { fromPlace: 'kadesh-barnea', toPlace: 'ezion-geber', mode: 'inferred', scripture: [{ book: 'numbers', chapter: 33, verse: 35 }], note: 'The detour south reflects Edom\'s refusal of passage in Numbers 20:14-21.' },
      { fromPlace: 'ezion-geber', toPlace: 'dibon', mode: 'land', scripture: [{ book: 'numbers', chapter: 33, verse: 45 }] },
      { fromPlace: 'dibon', toPlace: 'heshbon', mode: 'land', scripture: [{ book: 'numbers', chapter: 21, verse: 25 }] },
      { fromPlace: 'heshbon', toPlace: 'mount-nebo', mode: 'land', scripture: [{ book: 'deuteronomy', chapter: 34, verse: 1 }] },
    ],
    scripture: [
      { book: 'exodus', chapter: 12 },
      { book: 'numbers', chapter: 33 },
    ],
    sources: [
      { citation: 'Hoffmeier, Ancient Israel in Sinai', note: 'On the candidate routes and the identifiable stations.' },
      { citation: 'Davies, The Way of the Wilderness', note: 'Critical study of the itinerary lists in Numbers 33.' },
    ],
  },
  {
    id: 'paul-first-journey',
    name: 'Paul\'s first missionary journey',
    traveler: 'paul',
    range: { start: 46, end: 48 },
    periods: ['apostolic'],
    summary:
      'Sent out from Antioch with Barnabas, across Cyprus and up into the highlands of southern Asia Minor, then back the way they came to strengthen the new congregations.',
    routeConfidence: 'probable',
    color: '#2f7d70',
    legs: [
      { fromPlace: 'antioch-syria', toPlace: 'paphos', mode: 'sea', scripture: [{ book: 'acts', chapter: 13, verse: 4, verseEnd: 6 }] },
      { fromPlace: 'paphos', toPlace: 'antioch-pisidia', mode: 'sea', scripture: [{ book: 'acts', chapter: 13, verse: 13, verseEnd: 14 }], note: 'By sea to Perga in Pamphylia, then inland; the atlas draws the leg to the next place it holds.' },
      { fromPlace: 'antioch-pisidia', toPlace: 'iconium', mode: 'land', scripture: [{ book: 'acts', chapter: 13, verse: 51 }] },
      { fromPlace: 'iconium', toPlace: 'lystra', mode: 'land', scripture: [{ book: 'acts', chapter: 14, verse: 6 }] },
      { fromPlace: 'lystra', toPlace: 'antioch-syria', mode: 'inferred', scripture: [{ book: 'acts', chapter: 14, verse: 21, verseEnd: 26 }], note: 'The return retraced the outward route through Lystra, Iconium and Antioch of Pisidia before sailing from Attalia.' },
    ],
    scripture: [
      { book: 'acts', chapter: 13 },
      { book: 'acts', chapter: 14 },
    ],
    sources: [
      { citation: 'Ramsay, St Paul the Traveller and the Roman Citizen', note: 'The foundational topographical study of the Anatolian legs.' },
    ],
  },
  {
    id: 'paul-second-journey',
    name: 'Paul\'s second missionary journey',
    traveler: 'paul',
    range: { start: 49, end: 52 },
    periods: ['apostolic'],
    summary:
      'Overland through Asia Minor to Troas, then across to Macedonia and down into Greece — the crossing into Europe. Ends with eighteen months at Corinth, the stretch the Gallio inscription dates.',
    routeConfidence: 'probable',
    color: '#9c3f74',
    legs: [
      { fromPlace: 'antioch-syria', toPlace: 'iconium', mode: 'land', scripture: [{ book: 'acts', chapter: 15, verse: 40 }, { book: 'acts', chapter: 16, verse: 1 }] },
      { fromPlace: 'iconium', toPlace: 'troas', mode: 'land', scripture: [{ book: 'acts', chapter: 16, verse: 6, verseEnd: 8 }] },
      { fromPlace: 'troas', toPlace: 'philippi', mode: 'sea', scripture: [{ book: 'acts', chapter: 16, verse: 11, verseEnd: 12 }] },
      { fromPlace: 'philippi', toPlace: 'thessalonica', mode: 'land', scripture: [{ book: 'acts', chapter: 17, verse: 1 }] },
      { fromPlace: 'thessalonica', toPlace: 'berea', mode: 'land', scripture: [{ book: 'acts', chapter: 17, verse: 10 }] },
      { fromPlace: 'berea', toPlace: 'athens', mode: 'sea', scripture: [{ book: 'acts', chapter: 17, verse: 14, verseEnd: 15 }] },
      { fromPlace: 'athens', toPlace: 'corinth', mode: 'land', scripture: [{ book: 'acts', chapter: 18, verse: 1 }] },
      { fromPlace: 'corinth', toPlace: 'ephesus', mode: 'sea', scripture: [{ book: 'acts', chapter: 18, verse: 18, verseEnd: 19 }] },
      { fromPlace: 'ephesus', toPlace: 'caesarea-maritima', mode: 'sea', scripture: [{ book: 'acts', chapter: 18, verse: 21, verseEnd: 22 }] },
      { fromPlace: 'caesarea-maritima', toPlace: 'antioch-syria', mode: 'land', scripture: [{ book: 'acts', chapter: 18, verse: 22 }] },
    ],
    scripture: [
      { book: 'acts', chapter: 16 },
      { book: 'acts', chapter: 17 },
      { book: 'acts', chapter: 18 },
    ],
    sources: [
      { citation: 'Delphi (Gallio) Inscription', note: 'Dates the Corinthian stay and so the journey as a whole.' },
    ],
  },
  {
    id: 'paul-third-journey',
    name: 'Paul\'s third missionary journey',
    traveler: 'paul',
    range: { start: 53, end: 57 },
    periods: ['apostolic'],
    summary:
      'Dominated by more than two years at Ephesus, the longest settled ministry of his career, followed by a circuit of the Macedonian and Greek congregations and a return to Jerusalem with the collection.',
    routeConfidence: 'probable',
    color: '#3a5a9c',
    legs: [
      { fromPlace: 'antioch-syria', toPlace: 'ephesus', mode: 'land', scripture: [{ book: 'acts', chapter: 18, verse: 23 }, { book: 'acts', chapter: 19, verse: 1 }] },
      { fromPlace: 'ephesus', toPlace: 'philippi', mode: 'sea', scripture: [{ book: 'acts', chapter: 20, verse: 1 }] },
      { fromPlace: 'philippi', toPlace: 'corinth', mode: 'land', scripture: [{ book: 'acts', chapter: 20, verse: 2, verseEnd: 3 }] },
      { fromPlace: 'corinth', toPlace: 'philippi', mode: 'land', scripture: [{ book: 'acts', chapter: 20, verse: 3, verseEnd: 6 }], note: 'He doubles back overland to avoid a plot against him on the sea passage.' },
      { fromPlace: 'philippi', toPlace: 'troas', mode: 'sea', scripture: [{ book: 'acts', chapter: 20, verse: 6 }] },
      { fromPlace: 'troas', toPlace: 'miletus', mode: 'sea', scripture: [{ book: 'acts', chapter: 20, verse: 13, verseEnd: 15 }] },
      { fromPlace: 'miletus', toPlace: 'tyre', mode: 'sea', scripture: [{ book: 'acts', chapter: 21, verse: 1, verseEnd: 3 }] },
      { fromPlace: 'tyre', toPlace: 'acco', mode: 'sea', scripture: [{ book: 'acts', chapter: 21, verse: 7 }] },
      { fromPlace: 'acco', toPlace: 'caesarea-maritima', mode: 'land', scripture: [{ book: 'acts', chapter: 21, verse: 8 }] },
      { fromPlace: 'caesarea-maritima', toPlace: 'jerusalem', mode: 'land', scripture: [{ book: 'acts', chapter: 21, verse: 15, verseEnd: 17 }] },
    ],
    scripture: [
      { book: 'acts', chapter: 19 },
      { book: 'acts', chapter: 20 },
      { book: 'acts', chapter: 21 },
    ],
    sources: [],
  },
  {
    id: 'paul-voyage-rome',
    name: 'The voyage to Rome',
    traveler: 'paul',
    range: { start: 59, end: 61 },
    periods: ['apostolic'],
    summary:
      'Sent from Caesarea under guard after appealing to Caesar, driven off course past Crete, wrecked on Malta, and finally landed at Puteoli for the road to Rome. Acts 27 is the most detailed account of an ancient sea voyage to survive from antiquity.',
    routeConfidence: 'probable',
    color: '#b5652c',
    legs: [
      { fromPlace: 'caesarea-maritima', toPlace: 'sidon', mode: 'sea', scripture: [{ book: 'acts', chapter: 27, verse: 3 }] },
      { fromPlace: 'sidon', toPlace: 'miletus', mode: 'sea', scripture: [{ book: 'acts', chapter: 27, verse: 4, verseEnd: 5 }], note: 'The ship coasted Cilicia and Pamphylia to Myra, where the party transferred to an Alexandrian grain ship; the atlas draws the leg to the nearest place it holds.' },
      { fromPlace: 'miletus', toPlace: 'malta', mode: 'sea', scripture: [{ book: 'acts', chapter: 27, verse: 13, verseEnd: 44 }], note: 'Fourteen days driven before a north-easter after sheltering at Fair Havens on Crete.' },
      { fromPlace: 'malta', toPlace: 'puteoli', mode: 'sea', scripture: [{ book: 'acts', chapter: 28, verse: 11, verseEnd: 13 }] },
      { fromPlace: 'puteoli', toPlace: 'rome', mode: 'land', scripture: [{ book: 'acts', chapter: 28, verse: 14, verseEnd: 16 }], note: 'Along the Via Appia, met at the Forum of Appius and Three Taverns.' },
    ],
    scripture: [
      { book: 'acts', chapter: 27 },
      { book: 'acts', chapter: 28 },
    ],
    sources: [
      { citation: 'Smith, The Voyage and Shipwreck of St Paul', note: 'Analysis of the seamanship, drift rates and soundings in Acts 27.' },
    ],
  },
];
