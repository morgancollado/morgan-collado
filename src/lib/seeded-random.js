/**
 * Deterministic selection helpers for the poetry "drawn today" section.
 *
 * The draw has to be reproducible: the server picks poems at build time and
 * the client has to be able to arrive at the same answer, or React logs a
 * hydration mismatch. Everything here is pure and seeded — no Math.random()
 * during render. The shuffle control passes its own seed from an event
 * handler, which is the only place randomness is safe.
 */

/** UTC so the server and the browser always agree on which day it is. */
export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** FNV-1a. Small, fast, and good enough to spread day keys across the corpus. */
export function hashSeed(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — 32-bit state, uniform enough for picking poems. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded Fisher-Yates over a copy, returning the first `n`.
 * Never mutates the input.
 */
export function pickN(items, n, seed) {
  const pool = [...items];
  const rand = mulberry32(seed);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}
