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
