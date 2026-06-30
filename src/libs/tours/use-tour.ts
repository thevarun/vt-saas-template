'use client';

import 'driver.js/dist/driver.css';

import type { Config, Driver, DriveStep } from 'driver.js';
import { driver } from 'driver.js';
import { useCallback, useEffect, useRef } from 'react';

import { REPLAY_TOUR_SHORTCUT_ID } from '@/libs/keyboard/shortcut-registry';
import { useKeyboardShortcutStore } from '@/stores/keyboard-shortcut-store';

/** Identifier for a tour, used to namespace the "seen" flag in localStorage. */
type TourId = string;

type UseTourOptions = {
  onStart?: () => void;
  /** CSS class applied to the driver.js popover (default: 'app-tour'). */
  popoverClass?: string;
};

const REPLAY_ACTION_ID = REPLAY_TOUR_SHORTCUT_ID;
const HYDRATION_DELAY_MS = 600;
const ON_START_DELAY_MS = 400;
const DEFAULT_POPOVER_CLASS = 'app-tour';

function getStorageKey(tourId: TourId, userId: string): string {
  return `tour-seen-${tourId}-${userId}`;
}

function hasSeenTour(tourId: TourId, userId: string): boolean {
  if (typeof window === 'undefined') {
    return true;
  }
  try {
    return localStorage.getItem(getStorageKey(tourId, userId)) === 'true';
  } catch {
    return true;
  }
}

function markTourSeen(tourId: TourId, userId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(getStorageKey(tourId, userId), 'true');
  } catch { /* ignore */ }
}

function filterAvailableSteps(steps: DriveStep[]): DriveStep[] {
  return steps.filter((step) => {
    if (!step.element) {
      return true;
    }
    if (typeof step.element === 'string') {
      const el = document.querySelector(step.element);
      // Skip targets that are absent OR not rendered (e.g. `hidden md:block`
      // elements on mobile). getClientRects() is empty for display:none
      // elements — including ones hidden via an ancestor — which a plain null
      // check would miss, leaving the tour to highlight an invisible/misplaced
      // step.
      return el !== null && el.getClientRects().length > 0;
    }
    return true;
  });
}

export function useTour(tourId: TourId, userId: string, steps: DriveStep[], opts?: UseTourOptions) {
  const driverRef = useRef<Driver | null>(null);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const start = useCallback((force = false) => {
    if (!force && hasSeenTour(tourId, userId)) {
      return;
    }

    optsRef.current?.onStart?.();

    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
    }
    startTimerRef.current = setTimeout(() => {
      startTimerRef.current = null;

      const availableSteps = filterAvailableSteps(steps);
      if (availableSteps.length === 0) {
        return;
      }

      driverRef.current?.destroy();

      const config: Config = {
        showProgress: true,
        allowClose: true,
        animate: true,
        smoothScroll: true,
        steps: availableSteps,
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Done',
        popoverClass: optsRef.current?.popoverClass ?? DEFAULT_POPOVER_CLASS,
        onCloseClick: (_el, _step, { driver: d }) => {
          markTourSeen(tourId, userId);
          d.destroy();
        },
        onDestroyed: () => {
          markTourSeen(tourId, userId);
        },
      };

      driverRef.current = driver(config);
      driverRef.current.drive();
    }, ON_START_DELAY_MS);
  }, [tourId, userId, steps]);

  useEffect(() => {
    if (hasSeenTour(tourId, userId)) {
      return;
    }
    const timer = setTimeout(start, HYDRATION_DELAY_MS, false);
    return () => clearTimeout(timer);
  }, [tourId, userId, start]);

  useEffect(() => {
    const { registerAction, unregisterAction } = useKeyboardShortcutStore.getState();
    registerAction(REPLAY_ACTION_ID, () => start(true));
    return () => {
      unregisterAction(REPLAY_ACTION_ID);
      if (startTimerRef.current) {
        clearTimeout(startTimerRef.current);
        startTimerRef.current = null;
      }
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [start]);

  return { start };
}
