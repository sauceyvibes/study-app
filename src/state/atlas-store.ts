'use client';

import { create } from 'zustand';
import { periodForYear, PERIOD_BY_ID, TIMELINE_BOUNDS } from '@/atlas/data/periods';
import { BOOK_BY_ID } from '@/atlas/data/books';

/**
 * Application state.
 *
 * The central design decision: **the year is the single source of truth.** Book
 * mode does not maintain a parallel timeline — selecting a book moves the year to
 * that book's narrative window, and everything downstream continues to derive
 * from the year. This is why switching from Acts to the timeline leaves the map
 * where Acts left it, which is the behaviour a reader expects and which would be
 * fiddly to keep correct with two competing clocks.
 *
 * `focus` is separate from `selectedPlaceId` on purpose: a search for "Paul"
 * should frame a dozen cities without opening any one of their panels.
 */

export type ExplorationMode = 'timeline' | 'book';

interface AtlasState {
  mode: ExplorationMode;
  year: number;
  /** Null in timeline mode. */
  bookId: string | null;
  /** Null means "the whole book"; a number narrows to one chapter. */
  chapter: number | null;
  selectedPlaceId: string | null;
  /** The person whose pop-up is open, or null. Independent of the place panel. */
  selectedPersonId: string | null;
  /** Place ids the map should frame, e.g. after a person search. */
  focusPlaceIds: string[];
  /** Journey ids drawn as routes. */
  activeJourneyIds: string[];
  showPolities: boolean;
  searchQuery: string;

  setYear: (year: number) => void;
  setMode: (mode: ExplorationMode) => void;
  selectBook: (bookId: string, chapter?: number | null) => void;
  setChapter: (chapter: number | null) => void;
  selectPlace: (placeId: string | null) => void;
  selectPerson: (personId: string | null) => void;
  focusPlaces: (placeIds: string[]) => void;
  toggleJourney: (journeyId: string) => void;
  setJourneys: (journeyIds: string[]) => void;
  togglePolities: () => void;
  setSearchQuery: (query: string) => void;
}

function clampYear(year: number): number {
  return Math.min(TIMELINE_BOUNDS.end, Math.max(TIMELINE_BOUNDS.start, Math.round(year)));
}

export const useAtlas = create<AtlasState>((set, get) => ({
  mode: 'timeline',
  // Opens on the divided monarchy: the densest, best-attested stretch of the
  // corpus, so the first thing a user sees is a map with something on it.
  year: -850,
  bookId: null,
  chapter: null,
  selectedPlaceId: null,
  selectedPersonId: null,
  focusPlaceIds: [],
  activeJourneyIds: [],
  showPolities: true,
  searchQuery: '',

  setYear: (year) => set({ year: clampYear(year) }),

  setMode: (mode) =>
    set(mode === 'timeline' ? { mode, bookId: null, chapter: null } : { mode }),

  selectBook: (bookId, chapter = null) => {
    const meta = BOOK_BY_ID.get(bookId);
    if (!meta) return;

    // Move the year to the midpoint of the book's narrative window, so the map
    // shows the world the book is set in rather than wherever the slider was.
    const { start, end } = meta.narrativeRange;
    const midpoint = clampYear((start + (end ?? start)) / 2);

    set({ mode: 'book', bookId, chapter, year: midpoint, selectedPlaceId: null, selectedPersonId: null });
  },

  setChapter: (chapter) => {
    const { bookId } = get();
    if (!bookId) return;
    const meta = BOOK_BY_ID.get(bookId);
    if (!meta) return;
    if (chapter !== null && (chapter < 1 || chapter > meta.chapters)) return;
    set({ chapter });
  },

  // Selecting a place also dismisses any open person pop-up, so a click on the
  // map never leaves the modal floating over an unrelated place.
  selectPlace: (placeId) => set({ selectedPlaceId: placeId, selectedPersonId: null }),

  selectPerson: (personId) => set({ selectedPersonId: personId }),

  focusPlaces: (placeIds) => set({ focusPlaceIds: placeIds }),

  toggleJourney: (journeyId) =>
    set((state) => ({
      activeJourneyIds: state.activeJourneyIds.includes(journeyId)
        ? state.activeJourneyIds.filter((id) => id !== journeyId)
        : [...state.activeJourneyIds, journeyId],
    })),

  setJourneys: (journeyIds) => set({ activeJourneyIds: journeyIds }),

  togglePolities: () => set((state) => ({ showPolities: !state.showPolities })),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));

/** The period the current year falls in. Derived, never stored. */
export function useCurrentPeriod() {
  const year = useAtlas((s) => s.year);
  return periodForYear(year);
}

export { PERIOD_BY_ID };
