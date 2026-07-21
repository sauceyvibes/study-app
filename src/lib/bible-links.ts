import type { ScriptureRef } from '@/atlas/types';

/**
 * Deep links from a scripture reference into Logos Bible Software.
 *
 * Logos publishes short, stable "reference links" on the ref.ly domain — the same
 * URL its own Share button produces. A bare `https://ref.ly/{ref}` resolves the
 * reference and hands off to whichever Logos surface the reader has: the desktop
 * app or mobile app if installed, otherwise the Logos web app (app.logos.com).
 * That hand-off is exactly the behaviour asked for — click "Jonah 1" and land in
 * Logos at Jonah 1 — and it degrades to the web reader when the app is absent, so
 * the link is never dead.
 *
 * The reference string uses Logos's standard book abbreviations followed by the
 * chapter, and `.verse` / `.verse-verseEnd` when the reference is finer than a
 * whole chapter (e.g. `Pr31.10-31`). The abbreviations below are the ones the
 * ref.ly parser accepts; a handful were checked against the live resolver
 * (`Jon1` → Jonah 1, `Song1` → Song of Songs 1, `1Ki12` → 1 Kings 12).
 */
const LOGOS_ABBREV: Record<string, string> = {
  genesis: 'Ge',
  exodus: 'Ex',
  leviticus: 'Le',
  numbers: 'Nu',
  deuteronomy: 'Dt',
  joshua: 'Jos',
  judges: 'Jdg',
  ruth: 'Ru',
  '1samuel': '1Sa',
  '2samuel': '2Sa',
  '1kings': '1Ki',
  '2kings': '2Ki',
  '1chronicles': '1Ch',
  '2chronicles': '2Ch',
  ezra: 'Ezr',
  nehemiah: 'Ne',
  esther: 'Es',
  job: 'Job',
  psalms: 'Ps',
  proverbs: 'Pr',
  ecclesiastes: 'Ec',
  songofsongs: 'Song',
  isaiah: 'Is',
  jeremiah: 'Je',
  lamentations: 'La',
  ezekiel: 'Eze',
  daniel: 'Da',
  hosea: 'Ho',
  joel: 'Joel',
  amos: 'Am',
  obadiah: 'Ob',
  jonah: 'Jon',
  micah: 'Mic',
  nahum: 'Na',
  habakkuk: 'Hab',
  zephaniah: 'Zep',
  haggai: 'Hag',
  zechariah: 'Zec',
  malachi: 'Mal',
  matthew: 'Mt',
  mark: 'Mk',
  luke: 'Lk',
  john: 'Jn',
  acts: 'Ac',
  romans: 'Ro',
  '1corinthians': '1Co',
  '2corinthians': '2Co',
  galatians: 'Ga',
  ephesians: 'Eph',
  philippians: 'Php',
  colossians: 'Col',
  '1thessalonians': '1Th',
  '2thessalonians': '2Th',
  '1timothy': '1Ti',
  '2timothy': '2Ti',
  titus: 'Tt',
  philemon: 'Phm',
  hebrews: 'Heb',
  james: 'Jas',
  '1peter': '1Pe',
  '2peter': '2Pe',
  '1john': '1Jn',
  '2john': '2Jn',
  '3john': '3Jn',
  jude: 'Jud',
  revelation: 'Re',
};

/**
 * The ref.ly reference token for a scripture reference, e.g. `Jon1`, `Ac16.11-15`.
 * Falls back to the raw book id if an abbreviation is ever missing, which still
 * lets the ref.ly parser have a go rather than producing a broken token.
 */
export function logosRefToken(ref: ScriptureRef): string {
  const book = LOGOS_ABBREV[ref.book] ?? ref.book;
  let token = `${book}${ref.chapter}`;
  if (ref.verse !== undefined) {
    token += `.${ref.verse}`;
    if (ref.verseEnd !== undefined) token += `-${ref.verseEnd}`;
  }
  return token;
}

/** A ref.ly link that opens Logos at the given reference. */
export function logosUrl(ref: ScriptureRef): string {
  return `https://ref.ly/${logosRefToken(ref)}`;
}
