'use client';

/* eslint-disable @next/next/no-img-element -- external Commons URLs, static export;
   next/image would need per-host config and does not help here. */

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Coordinates } from '@/atlas/types';
import { fetchPlaceImages, type PlaceImage } from '@/lib/place-images';

interface PlaceGalleryProps {
  placeId: string;
  coordinates: Coordinates;
  placeName: string;
}

/**
 * Modern photographs of a place, shown as a thumbnail grid that opens into a
 * fullscreen viewer. Images are fetched from Wikimedia Commons on open (see
 * `lib/place-images`). While the request is in flight a few skeletons hold the
 * space; if nothing geotagged is found nearby the section renders nothing rather
 * than an empty shell.
 */
export function PlaceGallery({ placeId, coordinates, placeName }: PlaceGalleryProps) {
  // `null` means still loading; an array (possibly empty) means the fetch is done.
  const [images, setImages] = useState<PlaceImage[] | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setImages(null);
    setLightbox(null);
    fetchPlaceImages(placeId, coordinates).then((result) => {
      if (active) setImages(result);
    });
    return () => {
      active = false;
    };
  }, [placeId, coordinates]);

  if (images === null) {
    return (
      <section className="panel__section">
        <h3 className="panel__heading">The site today</h3>
        <ul className="gallery" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <span className="gallery__skeleton" />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (images.length === 0) return null;

  return (
    <section className="panel__section">
      <h3 className="panel__heading">The site today</h3>
      <ul className="gallery">
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              className="gallery__item"
              onClick={() => setLightbox(index)}
              title={image.title}
              aria-label={`View photograph: ${image.title}`}
            >
              <img src={image.thumbUrl} alt={`${placeName}: ${image.title}`} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      <p className="gallery__credit">
        Photographs at this site — its ruins and remains where they exist — from Wikimedia Commons.
        Click to enlarge.
      </p>

      {lightbox !== null && (
        <Lightbox images={images} index={lightbox} placeName={placeName} onIndex={setLightbox} onClose={() => setLightbox(null)} />
      )}
    </section>
  );
}

function Lightbox({
  images,
  index,
  placeName,
  onIndex,
  onClose,
}: {
  images: PlaceImage[];
  index: number;
  placeName: string;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const count = images.length;
  const step = useCallback((delta: number) => onIndex((index + delta + count) % count), [index, count, onIndex]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [step, onClose]);

  const image = images[index];
  if (!image) return null;

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${placeName} — photograph`} onClick={onClose}>
      <button type="button" className="lightbox__close" onClick={onClose} aria-label="Close">
        ✕
      </button>

      {count > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          onClick={(event) => {
            event.stopPropagation();
            step(-1);
          }}
          aria-label="Previous photograph"
        >
          ‹
        </button>
      )}

      <figure className="lightbox__figure" onClick={(event) => event.stopPropagation()}>
        <img className="lightbox__img" src={image.fullUrl} alt={`${placeName}: ${image.title}`} />
        <figcaption className="lightbox__caption">
          <span className="lightbox__title">{image.title}</span>
          <span className="lightbox__meta">
            {image.artist ?? 'Unknown author'}
            {image.license ? ` · ${image.license}` : ''}
            {image.descriptionUrl && (
              <>
                {' · '}
                <a href={image.descriptionUrl} target="_blank" rel="noreferrer">
                  Wikimedia Commons
                </a>
              </>
            )}
          </span>
        </figcaption>
      </figure>

      {count > 1 && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          onClick={(event) => {
            event.stopPropagation();
            step(1);
          }}
          aria-label="Next photograph"
        >
          ›
        </button>
      )}
    </div>,
    document.body,
  );
}
