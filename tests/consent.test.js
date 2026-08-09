import { describe, it, expect } from "vitest";
import {
  CONFIRMATION_COOLDOWN_MS,
  confirmationThrottled,
  grantedTopics,
  unconfirmedAdditions,
  topicsAwaitingConfirmation,
} from "@/lib/newsletter/consent";

/**
 * The rules these cover are the ones that decide whether a stranger can put
 * mail in somebody else's inbox, and whether a reader who asked for something
 * actually gets it. Both have been wrong here before.
 */

const confirmed = (over = {}) => ({
  status: "confirmed",
  blog: false,
  poetry: false,
  pending_blog: null,
  pending_poetry: null,
  ...over,
});

describe("confirmationThrottled", () => {
  it("allows the first confirmation", () => {
    expect(confirmationThrottled(null)).toBe(false);
    expect(confirmationThrottled(undefined)).toBe(false);
  });

  it("suppresses a second one inside the cooldown", () => {
    const now = Date.now();
    const justSent = new Date(now - 1000).toISOString();
    expect(confirmationThrottled(justSent, now)).toBe(true);
  });

  it("allows one again after the cooldown", () => {
    const now = Date.now();
    const old = new Date(now - CONFIRMATION_COOLDOWN_MS - 1).toISOString();
    expect(confirmationThrottled(old, now)).toBe(false);
  });

  it("does not throttle on an unparseable timestamp", () => {
    // Failing open here only costs one extra mail; failing closed on bad data
    // would silently strand a legitimate signup with no confirmation at all.
    expect(confirmationThrottled("not a date")).toBe(false);
  });
});

describe("unconfirmedAdditions", () => {
  it("is empty when nothing is staged", () => {
    expect(unconfirmedAdditions(confirmed({ blog: true }))).toEqual([]);
  });

  it("names a topic staged on top of an existing one", () => {
    const row = confirmed({ blog: true, pending_blog: true, pending_poetry: true });
    expect(unconfirmedAdditions(row)).toEqual(["poetry"]);
  });

  it("is empty when the staged set only repeats what is already granted", () => {
    // Someone re-entering their address for what they already receive has
    // consented to nothing new, so they are owed no mail about it.
    const row = confirmed({ blog: true, poetry: true, pending_blog: true });
    expect(unconfirmedAdditions(row)).toEqual([]);
  });

  it("names both when a confirmed row was emptied and re-staged", () => {
    const row = confirmed({ pending_blog: true, pending_poetry: true });
    expect(unconfirmedAdditions(row)).toEqual(["blog", "poetry"]);
  });
});

describe("topicsAwaitingConfirmation", () => {
  it("covers the whole subscription for a pending row", () => {
    const row = { status: "pending", blog: true, poetry: true };
    expect(topicsAwaitingConfirmation(row)).toEqual(["blog", "poetry"]);
  });

  it("covers only the addition for a confirmed row", () => {
    const row = confirmed({ poetry: true, pending_poetry: true, pending_blog: true });
    expect(topicsAwaitingConfirmation(row)).toEqual(["blog"]);
  });

  it("is empty for a confirmed row that asked for nothing new", () => {
    // This is the case that used to silently widen a stranger's subscription:
    // the route sent no mail *and* granted the topic. Now no mail means no
    // grant either.
    expect(topicsAwaitingConfirmation(confirmed({ blog: true }))).toEqual([]);
  });

  it("is empty for an unsubscribed row", () => {
    const row = { status: "unsubscribed", blog: false, poetry: false };
    expect(topicsAwaitingConfirmation(row)).toEqual([]);
  });

  it("tolerates a missing row", () => {
    expect(topicsAwaitingConfirmation(null)).toEqual([]);
    expect(grantedTopics(null)).toEqual([]);
  });
});
