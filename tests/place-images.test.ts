import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchPlaceImages } from '../src/lib/place-images';
import type { Coordinates } from '../src/atlas/types';

/**
 * The gallery pulls real geotagged photos from Wikimedia Commons at runtime. The
 * parsing is where the risk lives: a map or SVG slipping into a photo gallery, a
 * lightbox URL that never resizes, HTML author markup rendered as-is, or a network
 * failure taking the panel down. `fetch` is stubbed so these run offline.
 */

const COORDS: Coordinates = [34.75, 32.05];

afterEach(() => vi.unstubAllGlobals());

function stubCommons(pages: Record<string, unknown>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ query: { pages } }) })),
  );
}

describe('fetchPlaceImages', () => {
  it('keeps photographs, resizes for the lightbox, strips HTML, and drops maps/SVGs', async () => {
    stubCommons({
      '1': {
        title: 'File:Jaffa port.jpg',
        index: 0,
        imageinfo: [
          {
            mime: 'image/jpeg',
            thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Jaffa_port.jpg/400px-Jaffa_port.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Jaffa_port.jpg',
            extmetadata: {
              Artist: { value: '<a href="/wiki/User:Jane">Jane <b>Doe</b></a>' },
              LicenseShortName: { value: 'CC BY-SA 4.0' },
            },
          },
        ],
      },
      '2': {
        title: 'File:Map of Jaffa.svg',
        index: 1,
        imageinfo: [{ mime: 'image/svg+xml', thumburl: 'https://example.org/400px-Map.svg' }],
      },
      '3': {
        title: 'File:Old map of the coast.png',
        index: 2,
        imageinfo: [{ mime: 'image/png', thumburl: 'https://example.org/400px-Old_map.png' }],
      },
    });

    const images = await fetchPlaceImages('test-jaffa', COORDS);
    expect(images).toHaveLength(1);
    const [image] = images;
    expect(image!.title).toBe('Jaffa port');
    expect(image!.thumbUrl).toContain('400px-');
    expect(image!.fullUrl).toContain('1280px-');
    expect(image!.artist).toBe('Jane Doe'); // markup stripped to text
    expect(image!.license).toBe('CC BY-SA 4.0');
  });

  it('ranks ruins and archaeology ahead of modern photos', async () => {
    stubCommons({
      '1': {
        title: 'File:Modern harbour of Jaffa.jpg',
        index: 0, // nearest, but modern
        imageinfo: [{ mime: 'image/jpeg', thumburl: 'https://example.org/400px-Harbour.jpg' }],
        categories: [{ title: 'Category:Marinas in Israel' }],
      },
      '2': {
        title: 'File:Excavations at ancient Jaffa.jpg',
        index: 1,
        imageinfo: [{ mime: 'image/jpeg', thumburl: 'https://example.org/400px-Dig.jpg' }],
        categories: [{ title: 'Category:Jaffa' }],
      },
      '3': {
        title: 'File:Jaffa hill view.jpg',
        index: 2,
        imageinfo: [{ mime: 'image/jpeg', thumburl: 'https://example.org/400px-Hill.jpg' }],
        categories: [{ title: 'Category:Archaeological sites in Israel' }], // ruins by category
      },
    });

    const images = await fetchPlaceImages('test-ruins-pref', COORDS);
    // The excavation (by title) and the hill (by category) lead despite the modern
    // harbour being nearer; the harbour still appears, but last.
    expect(images.map((image) => image.title)).toEqual([
      'Excavations at ancient Jaffa',
      'Jaffa hill view',
      'Modern harbour of Jaffa',
    ]);
  });

  it('falls back to the nearest photos when nothing archaeological is tagged', async () => {
    stubCommons({
      '1': {
        title: 'File:A street scene.jpg',
        index: 0,
        imageinfo: [{ mime: 'image/jpeg', thumburl: 'https://example.org/400px-Street.jpg' }],
        categories: [{ title: 'Category:Streets' }],
      },
    });
    const images = await fetchPlaceImages('test-ruins-fallback', COORDS);
    expect(images).toHaveLength(1);
    expect(images[0]!.title).toBe('A street scene');
  });

  it('returns an empty list without throwing when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    await expect(fetchPlaceImages('test-offline', COORDS)).resolves.toEqual([]);
  });

  it('returns an empty list when Commons finds nothing nearby', async () => {
    stubCommons({});
    await expect(fetchPlaceImages('test-empty', COORDS)).resolves.toEqual([]);
  });
});
