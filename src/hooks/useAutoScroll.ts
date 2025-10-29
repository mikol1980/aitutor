// ============================================================================
// useAutoScroll Hook
// ============================================================================
// Automatically scrolls to bottom when dependencies change

import { useEffect, useRef, type DependencyList } from 'react';

/**
 * Custom hook for auto-scrolling to bottom of a scrollable element
 * Useful for chat interfaces where new messages should scroll into view
 *
 * @param deps - Dependencies that trigger auto-scroll (e.g., messages array)
 * @param behavior - Scroll behavior ('auto' | 'smooth')
 * @returns Ref to attach to the scrollable container
 */
export function useAutoScroll<T extends HTMLElement>(
  deps: DependencyList,
  behavior: ScrollBehavior = 'smooth'
) {
  const scrollRef = useRef<T>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  }, deps);

  return scrollRef;
}
