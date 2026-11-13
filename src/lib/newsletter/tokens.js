/**
 * One opaque token per subscriber, doing three jobs: confirming the address,
 * loading the manage page, and one-click unsubscribe. A single link in every
 * footer that does everything beats three secrets that each do a third.
 *
 * WebCrypto rather than node:crypto so this runs unchanged on the edge.
 */
export function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Cheap shape check before a token ever reaches a query. */
export function isTokenShaped(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(value);
}
