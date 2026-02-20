/**
 * Shared IntersectionObserver pool.
 *
 * Instead of every ScrollCharReveal / ScrollImageReveal creating its own
 * IntersectionObserver, we pool observers by their options key
 * (threshold + rootMargin). Each unique combo gets ONE observer that
 * tracks all elements registered with those options.
 *
 * This reduces observer count from O(n) to O(unique-option-combos) — in
 * practice 2–3 observers for the whole page.
 */

type ObserverCallback = (isIntersecting: boolean) => void;

interface PoolEntry {
  observer: IntersectionObserver;
  callbacks: Map<Element, ObserverCallback>;
}

const pool = new Map<string, PoolEntry>();

function getKey(threshold: number, rootMargin: string): string {
  return `${threshold}|${rootMargin}`;
}

/**
 * Observe an element with a shared IntersectionObserver.
 * Returns an unsubscribe function.
 */
export function observe(
  el: Element,
  callback: ObserverCallback,
  options: { threshold?: number; rootMargin?: string } = {},
): () => void {
  const threshold = options.threshold ?? 0.15;
  const rootMargin = options.rootMargin ?? "0px";
  const key = getKey(threshold, rootMargin);

  let entry = pool.get(key);

  if (!entry) {
    const callbacks = new Map<Element, ObserverCallback>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const cb = callbacks.get(e.target);
          if (cb) cb(e.isIntersecting);
        }
      },
      { threshold, rootMargin },
    );
    entry = { observer, callbacks };
    pool.set(key, entry);
  }

  entry.callbacks.set(el, callback);
  entry.observer.observe(el);

  return () => {
    const entry = pool.get(key);
    if (!entry) return;
    entry.observer.unobserve(el);
    entry.callbacks.delete(el);
    // Clean up the observer if no elements are tracked
    if (entry.callbacks.size === 0) {
      entry.observer.disconnect();
      pool.delete(key);
    }
  };
}
