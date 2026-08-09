import { createPasswordGate, sha256Hex } from "@/lib/password-gate";

/**
 * The gate on /queen-9k3m7q.
 *
 * `failOpen: true` preserves the original behaviour: leaving QUEEN_PASSWORD
 * blank disables the gate entirely. The cookie name and salt below are load
 * bearing — changing either string invalidates every unlocked session.
 */
const gate = createPasswordGate({
  cookieName: "queen_access",
  envVar: "QUEEN_PASSWORD",
  salt: "queen-access:",
  failOpen: true,
});

const { COOKIE_NAME, passwordRequired, expectedToken, isAuthorized, buildCookie } =
  gate;

export {
  COOKIE_NAME,
  sha256Hex,
  passwordRequired,
  expectedToken,
  isAuthorized,
  buildCookie,
};
