'use client';

// Celebration hook exposing fireMini/fireBig. `canvas-confetti` is an OPTIONAL
// peer dependency loaded lazily on first fire — if it's not installed the import
// fails soft and nothing happens. A fork that wants confetti runs:
//   npm i canvas-confetti
import { useCallback, useRef } from 'react';

// Minimal local type so we don't depend on `@types/canvas-confetti` being present.
type ConfettiOptions = {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
  scalar?: number;
  ticks?: number;
};

type ConfettiFn = (options?: ConfettiOptions) => Promise<undefined> | null;

export function useConfetti() {
  const confettiRef = useRef<ConfettiFn | null>(null);

  const loadConfetti = useCallback(async (): Promise<ConfettiFn | null> => {
    if (!confettiRef.current) {
      try {
        // @ts-expect-error optional peer dep -- canvas-confetti may not be installed; fails soft
        const mod = await import('canvas-confetti');
        confettiRef.current = mod.default as unknown as ConfettiFn;
      } catch {
        return null;
      }
    }
    return confettiRef.current;
  }, []);

  const fireMini = useCallback(async () => {
    const confetti = await loadConfetti();
    confetti?.({
      particleCount: 40,
      spread: 55,
      origin: { y: 0.7 },
      scalar: 0.8,
      ticks: 100,
    });
  }, [loadConfetti]);

  const fireBig = useCallback(async () => {
    const confetti = await loadConfetti();
    if (!confetti) {
      return;
    }
    confetti({ particleCount: 80, spread: 100, origin: { x: 0.3, y: 0.6 } });
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 100, origin: { x: 0.7, y: 0.6 } });
    }, 200);
  }, [loadConfetti]);

  return { fireMini, fireBig };
}
