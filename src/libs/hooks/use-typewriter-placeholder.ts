'use client';

import { useEffect, useRef, useState } from 'react';

type UseTypewriterPlaceholderOptions = {
  prefix: string;
  suffixes: string[];
  typingSpeed?: number;
  erasingSpeed?: number;
  pauseDuration?: number;
  enabled?: boolean;
};

export function useTypewriterPlaceholder({
  prefix,
  suffixes,
  typingSpeed = 30,
  erasingSpeed = 15,
  pauseDuration = 2000,
  enabled = true,
}: UseTypewriterPlaceholderOptions): string {
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const charIndexRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const currentSuffix = suffixes[suffixIndex]!;

    if (isTyping) {
      if (charIndexRef.current < currentSuffix.length) {
        const timeout = setTimeout(() => {
          setDisplayed(
            prefix + currentSuffix.slice(0, charIndexRef.current + 1),
          );
          charIndexRef.current += 1;
        }, typingSpeed);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(setIsTyping, pauseDuration, false);
        return () => clearTimeout(timeout);
      }
    } else {
      if (charIndexRef.current > 0) {
        const timeout = setTimeout(() => {
          charIndexRef.current -= 1;
          setDisplayed(
            prefix + currentSuffix.slice(0, charIndexRef.current),
          );
        }, erasingSpeed);
        return () => clearTimeout(timeout);
      } else {
        setSuffixIndex(prev => (prev + 1) % suffixes.length);
        setIsTyping(true);
        return undefined;
      }
    }
  }, [displayed, isTyping, suffixIndex, prefix, suffixes, typingSpeed, erasingSpeed, pauseDuration, enabled]);

  if (!enabled) {
    return '';
  }

  return displayed;
}
