import type { Coordinates } from '@/atlas/types';

/**
 * Modern photographs of a place, pulled live from Wikimedia Commons.
 *
 * There is no way to hand-curate correct photos for ~1,300 sites, so instead of
 * inventing anything we ask Commons for images *geotagged near the site's
 * coordinates* — genuine photographs of that location, each carrying its own
 * author and licence. It is a network call (like the basemap tiles), cached per
 * place for the session, and it degrades quietly: a site with no nearby geotagged
 * images simply shows no gallery rather than a broken one.
 *
 * Commons text (author, licence) is HTML; we strip it to plain text and render it
 * as text, never as markup.
 */

export interface PlaceImage {
  /** Commons file title, without the "File:" prefix. */
  id: string;
  title: string;
  /** ~400px wide, for the grid. */
  thumbUrl: string;
  /** ~1280px wide, for the fullscreen view. */
  fullUrl: string;
  /** The Commons file page, for attribution and licence detail. */
  descriptionUrl: string;
  artist: string | null;
  license: string | null;
}

interface CommonsImageInfo {
  thumburl?: string;
  url?: string;
  descriptionurl?: string;
  mime?: string;
  extmetadata?: Record<string, { value?: string }>;
}

interface CommonsPage {
  title?: string;
  index?: number;
  imageinfo?: CommonsImageInfo[];
  categories?: { title?: string }[];
}

interface CommonsResponse {
  query?: { pages?: Record<string, CommonsPage> };
}

const MAX_IMAGES = 12;
const cache = new Map<string, PlaceImage[]>();
const inflight = new Map<string, Promise<PlaceImage[]>>();

/** Drop tags and unescape the few entities Commons metadata actually uses. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Commons thumb URLs embed their width (".../640px-Name.jpg"); resize in place. */
function resizeThumb(thumbUrl: string, width: number): string {
  return thumbUrl.replace(/\/\d+px-/, `/${width}px-`);
}

/** Skip files that are plainly not a photograph of the place. */
function looksLikePhoto(title: string, mime: string | undefined): boolean {
  if (mime !== 'image/jpeg' && mime !== 'image/png') return false;
  return !/\b(map|plan|coat[_ ]of[_ ]arms|flag|logo|diagram|chart|svg|icon|seal|banner|locator)\b/i.test(title);
}

/**
 * Whether a file reads as the ancient site's ruins/archaeology rather than the
 * modern town around it. Checked against the file title and its Commons
 * categories, which is where "Tel Megiddo", "Archaeological sites in Israel" and
 * the like live.
 */
// Deliberately excludes bare "tel"/"tell": it would flag "Tel Aviv" as ruins,
// which is exactly wrong for sites inside the modern city (Joppa among them).
const RUINS_RE =
  /\b(ruins?|archaeolog\w*|excavat\w*|antiquit\w*|ancient|acropolis|necropolis|amphitheat\w*|theatre|aqueduct|thermae|hippodrome|cardo|mosaics?|sarcophag\w*|temple|citadel|fortress|rampart|nabat\w*|crusader|byzantine|hellenistic|roman|iron age|bronze age|tombs?|mound|catacombs?|synagogue|basilica|national park)\b/i;

function ruinsSignal(title: string, categories: string[]): boolean {
  return RUINS_RE.test(title) || categories.some((category) => RUINS_RE.test(category));
}

function toImage(page: CommonsPage): (PlaceImage & { ruins: boolean }) | null {
  const info = page.imageinfo?.[0];
  const thumbUrl = info?.thumburl;
  if (!info || !thumbUrl) return null;

  const title = (page.title ?? '').replace(/^File:/, '');
  if (!looksLikePhoto(title, info.mime)) return null;

  const meta = info.extmetadata ?? {};
  const categories = (page.categories ?? []).map((category) => category.title ?? '');
  return {
    id: title,
    title: title.replace(/\.(jpe?g|png)$/i, ''),
    thumbUrl,
    fullUrl: resizeThumb(thumbUrl, 1280),
    descriptionUrl: info.descriptionurl ?? '',
    artist: meta.Artist?.value ? stripHtml(meta.Artist.value) : null,
    license: meta.LicenseShortName?.value ? stripHtml(meta.LicenseShortName.value) : null,
    ruins: ruinsSignal(title, categories),
  };
}

/** Photographs geotagged near a place, nearest first, capped and de-duplicated. */
export async function fetchPlaceImages(placeId: string, coordinates: Coordinates): Promise<PlaceImage[]> {
  const cached = cache.get(placeId);
  if (cached) return cached;
  const pending = inflight.get(placeId);
  if (pending) return pending;

  const [lon, lat] = coordinates;
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'geosearch',
    ggscoord: `${lat}|${lon}`,
    ggsradius: '10000',
    ggslimit: '50',
    ggsnamespace: '6',
    prop: 'imageinfo|categories',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: '400',
    cllimit: '30',
    clshow: '!hidden',
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;

  const promise = (async (): Promise<PlaceImage[]> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = (await res.json()) as CommonsResponse;
      const pages = data.query?.pages;
      if (!pages) return [];

      const seen = new Set<string>();
      const candidates = Object.values(pages)
        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0)) // geosearch order = nearest first
        .map(toImage)
        .filter((image): image is PlaceImage & { ruins: boolean } => {
          if (!image || seen.has(image.id)) return false;
          seen.add(image.id);
          return true;
        });

      // Lead with the site's ruins and archaeology, then fill with the nearest
      // remaining photographs. Most sites are sited on the excavated tell, so the
      // nearby photos are ruins anyway and this simply orders the clearly-tagged
      // ones first; for a living city it surfaces whatever ruins exist ahead of
      // the modern street scenes rather than dropping the gallery to nothing.
      const ruins = candidates.filter((image) => image.ruins);
      const others = candidates.filter((image) => !image.ruins);
      const images = [...ruins, ...others].slice(0, MAX_IMAGES);

      cache.set(placeId, images);
      return images;
    } catch {
      return [];
    } finally {
      inflight.delete(placeId);
    }
  })();

  inflight.set(placeId, promise);
  return promise;
}
