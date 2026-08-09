import { createPasswordGate } from "@/lib/password-gate";

/**
 * The gate on /newsletter/admin.
 *
 * `failOpen: false` — an unset NEWSLETTER_ADMIN_PASSWORD locks the console
 * rather than opening it. This is the opposite of the queen gate, on purpose:
 * the worst case behind this door is a mail blast to real subscribers, so a
 * misconfiguration has to fail towards "nobody can send".
 */
export const newsletterGate = createPasswordGate({
  cookieName: "newsletter_admin",
  envVar: "NEWSLETTER_ADMIN_PASSWORD",
  salt: "newsletter-admin:",
  failOpen: false,
});
