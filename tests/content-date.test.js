import { describe, it, expect } from "vitest";
import { normalizeDate, dateKey, newestFirst } from "@/lib/content-date";
import { createContentLoader } from "@/lib/content";
import { getAllPoems } from "@/app/poetry/_lib/poems";
import { getAllPostsSorted } from "@/app/blog/_lib/helpers";

/**
 * Front-matter dates aren't always zero-padded. Compared as text, "2026-11-9"
 * sorts after "2026-11-10"; these pin the post lists, the poem neighbours and
 * the newsletter's "newest" to the calendar instead.
 */

describe("normalizeDate", () => {
  it("zero-pads a hand-written date", () => {
    expect(normalizeDate("2026-11-9")).toBe("2026-11-09");
    expect(normalizeDate("2026-1-2")).toBe("2026-01-02");
    expect(normalizeDate(" 2026-11-10 ")).toBe("2026-11-10");
  });

  it("reads a YAML Date (an unquoted date) as its UTC day", () => {
    expect(normalizeDate(new Date("2026-10-31T00:00:00Z"))).toBe("2026-10-31");
    expect(normalizeDate(new Date("not a date"))).toBe("");
  });

  it("leaves anything else as written and treats missing as empty", () => {
    expect(normalizeDate("Fall 2012")).toBe("Fall 2012");
    expect(normalizeDate(undefined)).toBe("");
    expect(normalizeDate(null)).toBe("");
    expect(normalizeDate("")).toBe("");
  });
});

describe("dateKey and newestFirst", () => {
  it("puts the 10th after the 9th", () => {
    expect(dateKey("2026-11-10")).toBeGreaterThan(dateKey("2026-11-9"));
    expect(dateKey("2026-11-9")).toBe(dateKey("2026-11-09"));
    expect(dateKey("2026-11-9")).toBeGreaterThan(dateKey("2026-10-31"));
  });

  it("sorts undated or unreadable items last", () => {
    expect(dateKey("")).toBe(0);
    expect(dateKey("Fall 2012")).toBe(0);
    const sorted = [{ date: "" }, { date: "2026-11-9" }, { date: "2026-11-10" }, { date: "2012-1-1" }].sort(
      newestFirst
    );
    expect(sorted.map((item) => item.date)).toEqual(["2026-11-10", "2026-11-9", "2012-1-1", ""]);
  });
});

describe("content loader", () => {
  const loader = createContentLoader("tests/fixtures/dated-content");

  it("lists newest first by calendar date, not by text", () => {
    const sorted = loader.getAllSorted(["slug", "date"]);
    expect(sorted.map((item) => item.slug)).toEqual(["tenth", "ninth", "halloween", "undated"]);
  });

  it("hands every page a zero-padded date", () => {
    expect(loader.getBySlug("ninth", ["date"]).date).toBe("2026-11-09");
    expect(loader.getBySlug("halloween", ["date"]).date).toBe("2026-10-31");
    expect(loader.getBySlug("undated", ["slug", "date"])).toEqual({ slug: "undated" });
  });
});

describe("the site's own content", () => {
  const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

  for (const [name, items] of [
    ["poems", () => getAllPoems()],
    ["blog posts", () => getAllPostsSorted(["slug", "date"])],
  ]) {
    it(`has ${name} newest first, each with a zero-padded date`, () => {
      const list = items();
      expect(list.length).toBeGreaterThan(0);
      for (const item of list) expect(item.date).toMatch(ISO_DAY);
      for (let i = 1; i < list.length; i++) {
        expect(list[i - 1].date >= list[i].date, `${list[i - 1].slug} before ${list[i].slug}`).toBe(true);
      }
    });
  }
});
