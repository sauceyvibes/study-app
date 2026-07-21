/**
 * One-line summaries of what happens in a chapter.
 *
 * These feed the hover tooltip on a scripture reference — a quick reminder of the
 * chapter's action before the reader clicks through to the full text in Logos.
 * They are deliberately a *curated* set, not a complete concordance: the narrative
 * spine of the canon is covered here, and any chapter without an entry falls back
 * to a summary derived from the places named in it (see `lib/chapter-context.ts`).
 * That keeps the tooltip honest — we never invent a plot for a chapter we have not
 * written out, we state what we actually hold.
 *
 * Each line is one plain sentence of widely-agreed narrative content, kept short
 * enough to read at a glance. Keyed by `"{bookId} {chapter}"`.
 */
export const CHAPTER_SUMMARIES: Record<string, string> = {
  // ── Genesis ──
  "genesis 11": "The tower of Babel and the scattering of peoples; the line of Terah leaves Ur for Harran.",
  "genesis 12": "God calls Abram to leave Harran for Canaan; he passes through Shechem and Bethel and goes down to Egypt in famine.",
  "genesis 13": "Abram and Lot part ways; Lot settles toward Sodom and Abram at Hebron.",
  "genesis 14": "Abram rescues Lot from a coalition of kings and is blessed by Melchizedek of Salem.",
  "genesis 22": "The binding of Isaac on a mountain in Moriah, and the ram provided in his place.",
  "genesis 23": "Sarah dies at Hebron and Abraham buys the cave of Machpelah as a burial plot.",
  "genesis 28": "Jacob's dream of the ladder at Bethel as he flees to Harran.",
  "genesis 32": "Jacob wrestles at the Jabbok and is renamed Israel before meeting Esau.",
  "genesis 37": "Joseph is sold by his brothers near Dothan and carried down to Egypt.",
  "genesis 46": "Jacob and his household migrate from Beersheba to Egypt to join Joseph.",
  "genesis 50": "Jacob is buried at Machpelah; Joseph dies in Egypt after forgiving his brothers.",

  // ── Exodus ──
  "exodus 1": "Israel multiplies in Egypt and is enslaved to build the store-cities of Pithom and Rameses.",
  "exodus 3": "Moses meets God in the burning bush at Horeb and is sent to Pharaoh.",
  "exodus 12": "The Passover and the departure from Rameses on the night of the tenth plague.",
  "exodus 14": "Israel crosses the sea and Pharaoh's pursuing chariotry is destroyed.",
  "exodus 19": "Israel encamps at Sinai and God descends on the mountain in fire and cloud.",
  "exodus 20": "The giving of the Ten Commandments at Sinai.",
  "exodus 32": "The golden calf at the foot of Sinai while Moses is on the mountain.",

  // ── Numbers & Deuteronomy ──
  "numbers 13": "Twelve scouts are sent from Kadesh-barnea into Canaan and return divided.",
  "numbers 20": "Miriam dies at Kadesh; Moses strikes the rock, and Edom refuses passage.",
  "numbers 21": "Victories over Arad, Sihon of Heshbon and Og of Bashan open the route through Transjordan.",
  "deuteronomy 34": "Moses views the land from Mount Nebo and dies in Moab; Joshua succeeds him.",

  // ── Joshua ──
  "joshua 2": "Two spies are hidden by Rahab in Jericho.",
  "joshua 6": "The walls of Jericho fall after Israel marches around the city.",
  "joshua 7": "Achan's theft brings defeat at Ai.",
  "joshua 8": "Ai is taken by ambush; the covenant is read at Shechem between Ebal and Gerizim.",
  "joshua 10": "The sun stands still as Joshua rescues Gibeon and defeats a coalition of southern kings.",
  "joshua 11": "The northern coalition under Hazor is defeated at the waters of Merom.",
  "joshua 24": "Joshua gathers the tribes at Shechem to renew the covenant before his death.",

  // ── Judges & Ruth ──
  "judges 16": "Samson, betrayed by Delilah, dies pulling down the temple of Dagon at Gaza.",
  "ruth 1": "Naomi returns from Moab to Bethlehem with her daughter-in-law Ruth.",
  "ruth 4": "Boaz marries Ruth at Bethlehem; their line leads to David.",

  // ── Samuel & Kings ──
  "1samuel 16": "Samuel anoints the young David at Bethlehem.",
  "1samuel 17": "David kills Goliath of Gath in the Valley of Elah.",
  "1samuel 31": "Saul and his sons fall to the Philistines on Mount Gilboa near Beth-shean.",
  "2samuel 5": "David is made king over all Israel and captures Jerusalem from the Jebusites.",
  "2samuel 11": "David's adultery with Bathsheba and the death of Uriah at the siege of Rabbah.",
  "1kings 6": "Solomon builds the temple in Jerusalem.",
  "1kings 8": "Solomon dedicates the temple and the ark is brought in.",
  "1kings 12": "The kingdom splits at Shechem when the north rejects Rehoboam for Jeroboam.",
  "1kings 17": "Elijah is fed by ravens and by the widow of Zarephath in Sidonian territory.",
  "1kings 18": "Elijah defeats the prophets of Baal on Mount Carmel and the drought breaks.",
  "1kings 19": "Elijah flees to Horeb and hears God in the low whisper.",
  "2kings 17": "Samaria falls to Assyria and the northern kingdom is deported.",
  "2kings 18": "Sennacherib takes the fortified towns of Judah, including Lachish, and threatens Jerusalem.",
  "2kings 19": "Hezekiah prays and Jerusalem is spared as the Assyrian army withdraws.",
  "2kings 23": "Josiah's reform; he is killed at Megiddo intercepting Pharaoh Neco.",
  "2kings 25": "Jerusalem falls to Babylon, the temple is burned and the people deported.",

  // ── Return, prophets ──
  "ezra 1": "Cyrus permits the exiles to return from Babylon and rebuild the temple.",
  "nehemiah 2": "Nehemiah travels from Susa and surveys the broken walls of Jerusalem by night.",
  "esther 1": "Queen Vashti is deposed at the Persian court in Susa.",
  "isaiah 36": "The Assyrian field commander taunts Jerusalem after the fall of Lachish.",
  "jeremiah 39": "Jerusalem is breached and Zedekiah captured; the city is burned.",
  "jeremiah 52": "A closing account of Jerusalem's fall and the exile to Babylon.",
  "lamentations 1": "A lament over the desolate, fallen city of Jerusalem.",
  "ezekiel 1": "By the Kebar canal in Babylonia, Ezekiel sees the vision of the throne-chariot.",
  "daniel 5": "Belshazzar's feast and the writing on the wall the night Babylon falls to the Persians.",
  "amos 1": "Oracles of judgment against Damascus, Gaza, Tyre, Edom and Ammon.",
  "jonah 1": "Jonah flees toward Tarshish by ship from Joppa; a storm, and the great fish.",
  "jonah 3": "Jonah preaches and Nineveh repents.",
  "jonah 4": "Jonah's anger outside Nineveh and the lesson of the withered plant.",
  "micah 5": "The ruler to come from Bethlehem.",
  "nahum 3": "An oracle announcing the fall of Nineveh, the bloody city.",

  // ── Gospels ──
  "matthew 2": "The magi come to Bethlehem; the flight into Egypt and return to Nazareth.",
  "matthew 4": "The temptation in the wilderness; Jesus begins preaching at Capernaum by the lake.",
  "matthew 16": "At Caesarea Philippi, Peter confesses Jesus as the Messiah.",
  "matthew 27": "The trial before Pilate, the crucifixion and burial at Jerusalem.",
  "matthew 28": "The empty tomb and the commission on a mountain in Galilee.",
  "mark 1": "The baptism, the wilderness, and the first Galilean ministry around Capernaum.",
  "mark 15": "The crucifixion under Pilate at Golgotha.",
  "luke 2": "The birth at Bethlehem, the shepherds, and the boy Jesus in the temple.",
  "luke 24": "The road to Emmaus and the risen Jesus appearing in Jerusalem.",
  "john 4": "Jesus and the Samaritan woman at Jacob's well near Shechem.",
  "john 11": "The raising of Lazarus at Bethany.",
  "john 19": "The crucifixion and burial at Jerusalem.",
  "john 21": "The risen Jesus meets the disciples fishing on the Sea of Galilee.",

  // ── Acts & the mission ──
  "acts 2": "Pentecost at Jerusalem; the Spirit comes and the church is born.",
  "acts 9": "Saul's conversion on the road to Damascus.",
  "acts 10": "Peter is sent to the Roman centurion Cornelius at Caesarea; the door opens to Gentiles.",
  "acts 13": "Barnabas and Saul are sent from Antioch and cross Cyprus to Pisidian Antioch.",
  "acts 16": "The Macedonian call at Troas; Lydia converts and Paul is jailed at Philippi.",
  "acts 17": "Thessalonica, Berea, and Paul's address at the Areopagus in Athens.",
  "acts 18": "Paul at Corinth before Gallio, then on to Ephesus.",
  "acts 19": "Two years at Ephesus and the riot of the silversmiths.",
  "acts 27": "The storm and shipwreck on the voyage toward Rome, ending on Malta.",
  "acts 28": "From Malta through Puteoli to Rome, where Paul is held under guard.",

  // ── Revelation ──
  "revelation 1": "John, exiled on Patmos, sees the risen Christ and is told to write to seven churches.",
};

/** The authored summary for a chapter, or null if none has been written. */
export function authoredSummary(bookId: string, chapter: number): string | null {
  return CHAPTER_SUMMARIES[`${bookId} ${chapter}`] ?? null;
}
