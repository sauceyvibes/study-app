import type { Person, YearRange } from '../types';

/**
 * Secondary figures.
 *
 * These are people the gazetteer references but who do not carry a full biography
 * in `people.ts`. Each gets a name, a role, a floruit and one line of substance —
 * enough for a search result and a panel entry, and honest about being brief.
 *
 * Note the empty `places` arrays. Rather than restating each figure's locations
 * here (and risking them drifting out of sync with the gazetteer), the corpus
 * derives them by reverse index from `Place.people`. A curated `places` list, as
 * the major figures carry, acts as an ordering override on top of that.
 */

type MinorPersonInput = [
  id: string,
  name: string,
  role: string,
  floruit: YearRange,
  description: string,
  aliases?: string[],
];

function minor([id, name, role, floruit, description, aliases = []]: MinorPersonInput): Person {
  return { id, name, aliases, ancientNames: {}, floruit, role, description, places: [], scripture: [] };
}

const ENTRIES: MinorPersonInput[] = [
  // ── Patriarchal ────────────────────────────────────────────────────────────
  ['terah', 'Terah', 'Father of Abraham', { start: -2030, end: -1900 }, 'Leads the family from Ur to Harran and settles there, where he dies; the migration to Canaan is left to Abraham.'],
  ['sarah', 'Sarah', 'Wife of Abraham', { start: -2000, end: -1850 }, 'Abraham\'s wife and the mother of Isaac, buried in the cave of Machpelah at Hebron.', ['Sarai']],
  ['isaac', 'Isaac', 'Patriarch', { start: -1950, end: -1800 }, 'The son of the promise, whose life is spent almost entirely in the Negev around Beersheba and Gerar — the least travelled of the three patriarchs.'],
  ['rebekah', 'Rebekah', 'Wife of Isaac', { start: -1930, end: -1820 }, 'Found for Isaac among Abraham\'s kin at Harran, and the mother of Esau and Jacob.'],
  ['laban', 'Laban', 'Kinsman of Jacob', { start: -1900, end: -1800 }, 'Jacob\'s uncle and father-in-law at Harran, whose dealings over wages and flocks occupy twenty years of the narrative.'],
  ['melchizedek', 'Melchizedek', 'King and priest of Salem', { start: -1900, end: -1850 }, 'Meets Abraham at Salem with bread and wine after the rescue of Lot; the brevity of the notice is part of what later writers make of him.'],

  // ── Exodus and wilderness ──────────────────────────────────────────────────
  ['aaron', 'Aaron', 'Priest, brother of Moses', { start: -1330, end: -1211 }, 'Moses\' spokesman before Pharaoh and the first high priest; dies on Mount Hor before the entry into Canaan.'],
  ['miriam', 'Miriam', 'Prophet, sister of Moses', { start: -1330, end: -1215 }, 'Leads the song at the sea and dies at Kadesh; named as a prophet and as one of the three sent to lead Israel out of Egypt.'],
  ['caleb', 'Caleb', 'Spy, clan leader', { start: -1290, end: -1170 }, 'One of the two spies who urged advance from Kadesh, and rewarded with Hebron in the settlement.'],
  ['sihon', 'Sihon', 'Amorite king of Heshbon', { start: -1250, end: -1210 }, 'Refuses Israel passage along the King\'s Highway and is defeated; his territory becomes Reubenite and Gadite land.'],

  // ── Conquest and judges ────────────────────────────────────────────────────
  ['rahab', 'Rahab', 'Innkeeper at Jericho', { start: -1230, end: -1170 }, 'Shelters the spies at Jericho in exchange for her household\'s safety, and is named in Matthew\'s genealogy.'],
  ['achan', 'Achan', 'Judahite', { start: -1220, end: -1200 }, 'Takes plunder devoted to destruction at Jericho, which the narrative gives as the cause of the failure at Ai.'],
  ['jabin', 'Jabin', 'King of Hazor', { start: -1200, end: -1150 }, 'The Canaanite king whose commander Sisera is defeated by Deborah and Barak in the Jezreel valley.'],
  ['deborah', 'Deborah', 'Prophet and judge', { start: -1180, end: -1130 }, 'Judges Israel from a palm in the hill country of Ephraim and summons Barak against Sisera; her victory song is among the oldest Hebrew poetry preserved.'],
  ['barak', 'Barak', 'Commander', { start: -1180, end: -1130 }, 'Leads the tribal levy against Sisera\'s chariots at the Kishon, where the ground favoured infantry.'],
  ['gideon', 'Gideon', 'Judge', { start: -1160, end: -1110 }, 'Breaks a Midianite raid with a small force and pursues them into Transjordan, where Succoth and Penuel refuse him supplies.', ['Jerubbaal']],
  ['abimelech-judge', 'Abimelech', 'Self-made king at Shechem', { start: -1130, end: -1120 }, 'Gideon\'s son, who kills his brothers and rules Shechem for three years before the city turns on him.'],
  ['samson', 'Samson', 'Judge', { start: -1120, end: -1080 }, 'A Danite whose conflicts with the Philistines play out along the Sorek valley frontier, and who dies at Gaza.'],
  ['boaz', 'Boaz', 'Landowner at Bethlehem', { start: -1150, end: -1100 }, 'Redeems Naomi\'s land and marries Ruth, becoming David\'s great-grandfather.'],
  ['eli', 'Eli', 'Priest at Shiloh', { start: -1100, end: -1050 }, 'Presides over the Shiloh sanctuary and raises Samuel; dies on hearing the ark has been captured.'],
  ['hannah', 'Hannah', 'Mother of Samuel', { start: -1100, end: -1050 }, 'Prays for a son at Shiloh and dedicates him there; her song is closely echoed by the Magnificat.'],

  // ── United monarchy ────────────────────────────────────────────────────────
  ['saul', 'Saul', 'First king of Israel', { start: -1050, end: -1010 }, 'Anointed at Mizpah and effective against the Philistines early on, but the narrative turns on his rejection; he dies at Gilboa.'],
  ['goliath', 'Goliath', 'Philistine champion', { start: -1030, end: -1020 }, 'The champion from Gath killed in the Elah valley. An ostracon from Tell es-Safi shows the name was current there in roughly the right period.'],
  ['achish', 'Achish', 'King of Gath', { start: -1020, end: -990 }, 'Gives David refuge and a base at Ziklag during his years as an outlaw from Saul.'],
  ['abner', 'Abner', 'Commander under Saul', { start: -1030, end: -1005 }, 'Saul\'s cousin and general, who holds the north for Saul\'s son before defecting to David and being killed by Joab.'],
  ['joab', 'Joab', 'Commander under David', { start: -1015, end: -970 }, 'David\'s ruthless and indispensable general, who takes Jerusalem, besieges Rabbah and arranges Uriah\'s death on orders.'],
  ['uriah', 'Uriah the Hittite', 'Officer in David\'s army', { start: -1000, end: -990 }, 'Killed at Rabbah by David\'s arrangement after Bathsheba\'s pregnancy; his loyalty is drawn in pointed contrast to the king\'s.'],
  ['absalom', 'Absalom', 'Son of David', { start: -1000, end: -975 }, 'Launches his revolt from Hebron and briefly drives David out of Jerusalem before being killed in the forest of Ephraim.'],
  ['hiram', 'Hiram', 'King of Tyre', { start: -980, end: -940 }, 'Supplies cedar, craftsmen and shipwrights to David and Solomon, and partners in the Red Sea trade.'],

  // ── Divided monarchy ───────────────────────────────────────────────────────
  ['rehoboam', 'Rehoboam', 'King of Judah', { start: -931, end: -913 }, 'Solomon\'s son, whose refusal to lighten the labour levy at Shechem splits the kingdom.'],
  ['jeroboam', 'Jeroboam I', 'King of Israel', { start: -931, end: -910 }, 'The first king of the northern kingdom, who sets up rival sanctuaries at Bethel and Dan to keep his people from Jerusalem.'],
  ['omri', 'Omri', 'King of Israel', { start: -885, end: -874 }, 'Founds Samaria and a dynasty strong enough that Assyria still called Israel the "House of Omri" a century after it fell.'],
  ['ahab', 'Ahab', 'King of Israel', { start: -874, end: -853 }, 'Omri\'s son, allied to Tyre by marriage and named in Shalmaneser III\'s account of the battle of Qarqar as fielding two thousand chariots.'],
  ['jezebel', 'Jezebel', 'Queen of Israel', { start: -874, end: -841 }, 'A Tyrian princess who promotes the Baal cult of her homeland in Samaria, and Elijah\'s principal antagonist.'],
  ['naboth', 'Naboth', 'Landowner at Jezreel', { start: -870, end: -855 }, 'Refuses to sell ancestral land to Ahab and is judicially murdered for it — the episode that seals the dynasty\'s condemnation.'],
  ['elisha', 'Elisha', 'Prophet', { start: -855, end: -800 }, 'Elijah\'s successor, whose activity is centred on Samaria, Jericho and the Jordan and reaches into Aramean politics.'],
  ['jehu', 'Jehu', 'King of Israel', { start: -841, end: -814 }, 'Destroys the Omride dynasty in a coup at Jezreel. The Black Obelisk of Shalmaneser III shows him or his envoy paying tribute — the only contemporary depiction of an Israelite king.'],
  ['ben-hadad', 'Ben-hadad', 'King of Aram-Damascus', { start: -880, end: -841 }, 'The dynastic name of several Aramean kings who campaign against Israel through the ninth century.'],
  ['hazael', 'Hazael', 'King of Aram-Damascus', { start: -842, end: -796 }, 'Seizes the Damascus throne and dominates the region, destroying Gath and reducing Israel to a remnant; attested in Assyrian records and on booty inscriptions.'],
  ['naaman', 'Naaman', 'Aramean commander', { start: -850, end: -820 }, 'A Syrian general healed of a skin disease by Elisha\'s instruction to wash in the Jordan.'],
  ['mesha', 'Mesha', 'King of Moab', { start: -860, end: -830 }, 'Revolts against Israelite domination after Ahab\'s death and commemorates it on the stele found at Dibon.'],
  ['jehoshaphat', 'Jehoshaphat', 'King of Judah', { start: -872, end: -848 }, 'Allies with the northern kingdom and attempts to revive the Red Sea trade from Ezion-geber, without success.'],
  ['amos', 'Amos', 'Prophet', { start: -765, end: -750 }, 'A herdsman from Tekoa in Judah who preaches against the northern kingdom at Bethel and is told to go home.'],
  ['sennacherib', 'Sennacherib', 'King of Assyria', { start: -705, end: -681 }, 'Campaigns against Judah in 701 BC, takes Lachish and besieges Jerusalem; his annals and palace reliefs record both.'],

  // ── Judah alone, exile and return ──────────────────────────────────────────
  ['josiah', 'Josiah', 'King of Judah', { start: -640, end: -609 }, 'Carries out the most thorough of the reforms, destroying the Bethel altar, and is killed at Megiddo intercepting Pharaoh Neco.'],
  ['neco', 'Neco II', 'Pharaoh of Egypt', { start: -610, end: -595 }, 'Marches north to prop up the last of Assyria, kills Josiah at Megiddo, and loses Syria to Babylon at Carchemish.'],
  ['nahum', 'Nahum', 'Prophet', { start: -650, end: -612 }, 'His single oracle anticipates the fall of Nineveh, invoking the earlier sack of Thebes as the precedent.'],
  ['gedaliah', 'Gedaliah', 'Babylonian-appointed governor', { start: -586, end: -582 }, 'Administers the province from Mizpah after Jerusalem\'s destruction and is assassinated, prompting a flight to Egypt.'],
  ['nebuchadnezzar', 'Nebuchadnezzar II', 'King of Babylon', { start: -605, end: -562 }, 'Defeats Egypt at Carchemish, deports Judah in stages and destroys Jerusalem in 586 BC; his building works transformed Babylon.'],
  ['jehoiachin', 'Jehoiachin', 'King of Judah', { start: -598, end: -560 }, 'Deported to Babylon in 597 BC after a three-month reign. Palace ration tablets naming him and his sons are among the most direct corroborations of the biblical record.'],
  ['belshazzar', 'Belshazzar', 'Regent of Babylon', { start: -553, end: -539 }, 'Nabonidus\' son, who governed Babylon in his father\'s long absence — a detail cuneiform sources confirmed only in the nineteenth century.'],
  ['daniel', 'Daniel', 'Exile at the Babylonian court', { start: -605, end: -536 }, 'Serves under Babylonian and Persian rule; the book bearing his name spans the transition between the two empires.'],
  ['cyrus', 'Cyrus II', 'King of Persia', { start: -559, end: -530 }, 'Takes Babylon in 539 BC and permits deported peoples to return and rebuild their sanctuaries, a policy recorded on his own cylinder.'],
  ['esther', 'Esther', 'Queen of Persia', { start: -483, end: -470 }, 'A Jewish woman at the Susa court who intervenes to prevent a massacre of her people.', ['Hadassah']],
  ['mordecai', 'Mordecai', 'Court official at Susa', { start: -483, end: -465 }, 'Esther\'s cousin and guardian, whose refusal to bow to Haman sets the crisis in motion.'],
  ['xerxes', 'Xerxes I', 'King of Persia', { start: -486, end: -465 }, 'The Ahasuerus of Esther, known from Greek sources for the invasion of Greece.', ['Ahasuerus']],

  // ── Gospels ────────────────────────────────────────────────────────────────
  ['mary', 'Mary', 'Mother of Jesus', { start: -20, end: 45 }, 'Of Nazareth, present from the annunciation through the crucifixion and named among the group in Jerusalem after it.'],
  ['joseph', 'Joseph', 'Husband of Mary', { start: -25, end: 25 }, 'A craftsman of Nazareth; the Greek term covers building work in wood and stone more broadly than "carpenter" suggests.'],
  ['herod-great', 'Herod the Great', 'King of Judea', { start: -37, end: -4 }, 'Rome\'s client king, an extraordinary builder and a ruthless ruler; Matthew sets the nativity in his final years.'],
  ['herod-philip', 'Herod Philip', 'Tetrarch of Ituraea', { start: -4, end: 34 }, 'Herod\'s son, who rebuilt Paneas as Caesarea Philippi and ruled the territories north-east of Galilee.'],
  ['pontius-pilate', 'Pontius Pilate', 'Prefect of Judea', { start: 26, end: 36 }, 'Roman governor at the crucifixion. An inscription from Caesarea confirms both his name and his title of prefect.'],
  ['andrew', 'Andrew', 'Apostle', { start: 28, end: 65 }, 'Peter\'s brother, from Bethsaida; John\'s Gospel has him bring Peter to Jesus.'],
  ['james-son-zebedee', 'James son of Zebedee', 'Apostle', { start: 28, end: 44 }, 'A Galilean fisherman, one of the three closest to Jesus, and the first of the Twelve to be killed — executed by Herod Agrippa I.'],
  ['john-apostle', 'John', 'Apostle', { start: 28, end: 95 }, 'James\' brother, a Galilean fisherman; tradition associates him with Ephesus and with the Revelation given on Patmos.'],
  ['philip-apostle', 'Philip', 'Apostle', { start: 28, end: 65 }, 'From Bethsaida, like Peter and Andrew; brings Nathanael to Jesus.'],
  ['nathanael', 'Nathanael', 'Disciple', { start: 28, end: 65 }, 'From Cana, whose question about whether anything good can come from Nazareth is answered by the invitation to come and see.'],
  ['matthew-apostle', 'Matthew', 'Apostle', { start: 28, end: 65 }, 'Called from a customs post at Capernaum, on the road where goods crossed between tetrarchies.', ['Levi']],
  ['jairus', 'Jairus', 'Synagogue leader', { start: 28, end: 32 }, 'A synagogue official at Capernaum whose daughter Jesus is called to.'],
  ['lazarus', 'Lazarus', 'Of Bethany', { start: 1, end: 40 }, 'Brother of Martha and Mary, raised at Bethany in the last of the signs in John\'s Gospel.'],
  ['martha', 'Martha', 'Of Bethany', { start: 1, end: 45 }, 'Hosts Jesus at Bethany; her confession in John 11 parallels Peter\'s at Caesarea Philippi.'],
  ['mary-bethany', 'Mary of Bethany', 'Of Bethany', { start: 1, end: 45 }, 'Anoints Jesus at Bethany in the week before the Passover.'],
  ['zacchaeus', 'Zacchaeus', 'Chief tax collector', { start: 25, end: 45 }, 'A senior revenue contractor at Jericho, a lucrative post given the balsam trade, who receives Jesus as a guest.'],

  // ── Apostolic ──────────────────────────────────────────────────────────────
  ['james-just', 'James', 'Leader of the Jerusalem church', { start: 33, end: 62 }, 'Jesus\' brother, who presides at the Jerusalem council. Josephus records his execution in AD 62 during a gap between Roman governors.'],
  ['philip-evangelist', 'Philip the Evangelist', 'One of the Seven', { start: 33, end: 60 }, 'Preaches in Samaria and on the Gaza road, and later hosts Paul at Caesarea; distinct from the apostle Philip.'],
  ['ananias-damascus', 'Ananias', 'Disciple at Damascus', { start: 30, end: 50 }, 'Sent, reluctantly, to restore Saul\'s sight after the Damascus road.'],
  ['cornelius', 'Cornelius', 'Roman centurion', { start: 35, end: 55 }, 'An officer of the Italian cohort at Caesarea whose household\'s baptism forces the question of Gentile inclusion.'],
  ['agabus', 'Agabus', 'Prophet', { start: 40, end: 60 }, 'Foretells a famine at Antioch and later warns Paul at Caesarea against going up to Jerusalem.'],
  ['herod-agrippa-i', 'Herod Agrippa I', 'King of Judea', { start: 41, end: 44 }, 'Herod\'s grandson, who briefly reunited the kingdom and executed James; Acts and Josephus give closely matching accounts of his death at Caesarea.'],
  ['sergius-paulus', 'Sergius Paulus', 'Proconsul of Cyprus', { start: 45, end: 50 }, 'The Roman governor at Paphos who listens to Barnabas and Saul; Cypriot inscriptions attest the family in the island\'s administration.'],
  ['elymas', 'Elymas', 'Court magician at Paphos', { start: 45, end: 50 }, 'Opposes the mission before the proconsul and is struck blind.', ['Bar-Jesus']],
  ['timothy', 'Timothy', 'Co-worker of Paul', { start: 49, end: 90 }, 'From Lystra, with a Jewish mother and Greek father; Paul\'s most frequent companion and the recipient of two letters.'],
  ['eunice', 'Eunice', 'Mother of Timothy', { start: 20, end: 60 }, 'A Jewish believer at Lystra, named with her mother Lois as the source of Timothy\'s upbringing in the scriptures.'],
  ['lois', 'Lois', 'Grandmother of Timothy', { start: 1, end: 55 }, 'Named alongside Eunice for the faith passed down in Timothy\'s household at Lystra.'],
  ['silas', 'Silas', 'Co-worker of Paul', { start: 49, end: 65 }, 'Paul\'s companion from the second journey, imprisoned with him at Philippi; a Roman citizen, as that episode turns out to require.', ['Silvanus']],
  ['luke', 'Luke', 'Physician and companion of Paul', { start: 49, end: 85 }, 'Traditionally the author of the third Gospel and Acts; the first-person passages begin at Troas and follow the voyage to Rome.'],
  ['eutychus', 'Eutychus', 'Young man at Troas', { start: 40, end: 80 }, 'Falls from a third-storey window during a long night meeting at Troas and is restored.'],
  ['jason', 'Jason', 'Host at Thessalonica', { start: 49, end: 60 }, 'Puts up Paul and Silas and is dragged before the politarchs when the crowd cannot find them.'],
  ['dionysius-areopagite', 'Dionysius', 'Member of the Areopagus council', { start: 45, end: 70 }, 'One of the few named converts at Athens, and a member of the city\'s senior council.'],
  ['damaris', 'Damaris', 'Convert at Athens', { start: 45, end: 70 }, 'Named alongside Dionysius among those who joined Paul after the Areopagus address.'],
  ['aquila', 'Aquila', 'Tentmaker, co-worker of Paul', { start: 49, end: 65 }, 'A Jew from Pontus expelled from Rome under Claudius, who works with Paul at Corinth and Ephesus alongside his wife Priscilla.'],
  ['crispus', 'Crispus', 'Synagogue leader at Corinth', { start: 50, end: 60 }, 'The head of the Corinthian synagogue, whose household\'s conversion is singled out in both Acts and 1 Corinthians.'],
  ['erastus', 'Erastus', 'City official at Corinth', { start: 50, end: 60 }, 'Greeted in Romans as the city treasurer. A Corinthian pavement inscription names an aedile Erastus — plausibly the same man, though the identification is not certain.'],
  ['gallio', 'Gallio', 'Proconsul of Achaia', { start: 51, end: 52 }, 'Dismisses the case against Paul at Corinth. The Delphi inscription dating his term is the anchor for the whole Pauline chronology.'],
  ['apollos', 'Apollos', 'Teacher from Alexandria', { start: 52, end: 65 }, 'An eloquent Alexandrian Jew instructed further by Priscilla and Aquila at Ephesus, and later influential at Corinth.'],
  ['demetrius', 'Demetrius', 'Silversmith at Ephesus', { start: 54, end: 60 }, 'Organises the trade against Paul on the grounds that the mission is destroying the market in Artemis shrines.'],
  ['publius', 'Publius', 'Chief man of Malta', { start: 55, end: 70 }, 'The leading official on Malta, who receives the shipwrecked party for three days.'],
  ['claudius', 'Claudius', 'Roman emperor', { start: 41, end: 54 }, 'Expelled Jews from Rome around AD 49, which is why Aquila and Priscilla were in Corinth when Paul arrived.'],
  ['nero', 'Nero', 'Roman emperor', { start: 54, end: 68 }, 'The Caesar to whom Paul appealed, and under whom the first Roman persecution of Christians followed the fire of AD 64.'],
];

export const MINOR_PEOPLE: Person[] = ENTRIES.map(minor);
