import { createPasswordGate } from "@/lib/password-gate";

/**
 * The gate on /queen-9k3m7q.
 *
 * `failOpen: true` preserves the original behaviour: leaving QUEEN_PASSWORD
 * blank disables the gate entirely. The cookie name and salt below are load
 * bearing — changing either string invalidates every unlocked session.
 */
export const queenGate = createPasswordGate({
  cookieName: "queen_access",
  envVar: "QUEEN_PASSWORD",
  salt: "queen-access:",
  failOpen: true,
});

export const { COOKIE_NAME, passwordRequired, verify, isAuthorized, buildCookie } =
  queenGate;
