import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { readInputs, configProblems, runFromEnv, secretValues } from "@/lib/newsletter/send-cli";
import { describeResult, subjectFor, shownSlug, newestOf } from "@/lib/newsletter/send";
import { chunkKey } from "@/lib/newsletter/resend";

/**
 * The "Send newsletter" workflow's form, as the script reads it. The journey
 * through a real database is in flow.integration.test.js; these are the
 * decisions made before any database is touched.
 */

const ready = {
  DATABASE_URL: "postgres://example/db",
  RESEND_API_KEY: "re_x",
  NEWSLETTER_FROM: "Morgan <news@example.com>",
  NEXT_PUBLIC_BASE_URL: "https://example.com",
};

describe("readInputs", () => {
  it("maps the dropdown's labels to the stored kinds", () => {
    expect(readInputs({ NEWSLETTER_KIND: "poetry" }).kind).toBe("poetry");
    expect(readInputs({ NEWSLETTER_KIND: "technical writing" }).kind).toBe("blog");
    expect(readInputs({ NEWSLETTER_KIND: "Blog" }).kind).toBe("blog");
    expect(readInputs({ NEWSLETTER_KIND: "fiction" }).kind).toBeUndefined();
  });

  it("is a dry run unless the box is explicitly unticked", () => {
    expect(readInputs({}).dryRun).toBe(true);
    expect(readInputs({ NEWSLETTER_DRY_RUN: "true" }).dryRun).toBe(true);
    expect(readInputs({ NEWSLETTER_DRY_RUN: "" }).dryRun).toBe(true);
    expect(readInputs({ NEWSLETTER_DRY_RUN: "flase" }).dryRun).toBe(true);
    expect(readInputs({ NEWSLETTER_DRY_RUN: "false" }).dryRun).toBe(false);
  });

  it("trims the slug and treats blank as the newest", () => {
    expect(readInputs({ NEWSLETTER_SLUG: "  Lioness " }).slug).toBe("Lioness");
    expect(readInputs({}).slug).toBe("");
  });
});

describe("configProblems", () => {
  it("is empty when everything is set", () => {
    expect(configProblems(ready)).toEqual([]);
  });

  it("names each missing secret without echoing any value", () => {
    const problems = configProblems({ NEXT_PUBLIC_BASE_URL: "https://example.com" });
    expect(problems.join(" ")).toMatch(/DATABASE_URL/);
    expect(problems.join(" ")).toMatch(/RESEND_API_KEY/);
    expect(problems.join(" ")).toMatch(/NEWSLETTER_FROM/);
  });

  it("refuses a site address that would make every link in the email dead", () => {
    for (const base of [undefined, "", "example.com", "http://localhost:3000"]) {
      expect(configProblems({ ...ready, NEXT_PUBLIC_BASE_URL: base }).join(" ")).toMatch(
        /SITE_URL/
      );
    }
  });
});

describe("branch and secrets", () => {
  it("only sends for real from main when running in GitHub Actions", () => {
    const actions = { ...ready, GITHUB_ACTIONS: "true" };
    expect(configProblems({ ...actions, GITHUB_REF: "refs/heads/main" })).toEqual([]);
    expect(configProblems({ ...actions, GITHUB_REF: "refs/heads/some-branch" }).join(" ")).toMatch(
      /only run from the main branch/
    );
    // Locally there is no ref to check.
    expect(configProblems(ready)).toEqual([]);
  });

  it("scrubs the database password on its own, not just the whole URL", () => {
    const values = secretValues({ DATABASE_URL: "postgres://owner:p%40ssw0rd!@db.example/x", RESEND_API_KEY: "re_abcdef" });
    expect(values).toContain("p@ssw0rd!");
    expect(values).toContain("re_abcdef");
  });
});

describe("what gets echoed back", () => {
  it("never prints a typed name that could be read as a GitHub command or markdown", () => {
    expect(shownSlug("Lioness")).toBe('"Lioness"');
    expect(shownSlug("::stop-commands::x")).toBe("that name");
    expect(shownSlug("a\n::add-mask::b")).toBe("that name");
    expect(shownSlug("<img src=x>")).toBe("that name");
  });
});

describe("newest", () => {
  it("compares dates as numbers, so the 10th comes after the 9th", () => {
    expect(newestOf([{ date: "2026-11-9" }, { date: "2026-11-10" }, { date: "2026-10-31" }])).toEqual({
      date: "2026-11-10",
    });
    expect(newestOf([])).toBeNull();
  });
});

describe("batch keys", () => {
  const batch = (...emails) => emails.map((email) => ({ to: [email] }));

  it("are the same for the same people and differ otherwise", async () => {
    const a = await chunkKey("newsletter-1", batch("a@x.com", "b@x.com"));
    expect(await chunkKey("newsletter-1", batch("a@x.com", "b@x.com"))).toBe(a);
    expect(await chunkKey("newsletter-1", batch("a@x.com", "c@x.com"))).not.toBe(a);
    expect(await chunkKey("newsletter-2", batch("a@x.com", "b@x.com"))).not.toBe(a);
    expect(a.length).toBeLessThanOrEqual(256);
    expect(a).not.toContain("a@x.com");
  });
});

describe("runFromEnv before the database", () => {
  const run = async (env) => {
    const logged = [];
    const code = await runFromEnv(env, { log: (line) => logged.push(line) });
    return { code, output: logged.join("\n") };
  };

  it("refuses an unknown kind", async () => {
    const { code, output } = await run({ ...ready, NEWSLETTER_KIND: "fiction" });
    expect(code).toBe(1);
    expect(output).toMatch(/Unknown kind/);
  });

  it("scrubs a secret out of an error that quotes it", async () => {
    const env = { ...ready, NEWSLETTER_KIND: "poetry", DATABASE_URL: "not a url hunter2" };
    const { code, output } = await run(env);
    expect(code).toBe(1);
    expect(output).not.toContain("hunter2");
  });

  it("refuses a real send with missing setup and says nothing was sent", async () => {
    const { code, output } = await run({
      ...ready,
      NEWSLETTER_KIND: "poetry",
      NEWSLETTER_DRY_RUN: "false",
      NEXT_PUBLIC_BASE_URL: "",
    });
    expect(code).toBe(1);
    expect(output).toMatch(/SITE_URL/);
    expect(output).toMatch(/Nothing was sent/);
  });
});

describe("describeResult", () => {
  it("says a dry run sent nothing, in counts only", () => {
    const lines = describeResult({
      dryRun: true,
      status: "would-send",
      kind: "poetry",
      slug: "Lioness",
      subject: subjectFor("poetry", { title: "Lioness" }),
      recipients: 12,
      alreadyDelivered: 0,
      wouldSend: 12,
    });
    expect(lines[0]).toBe("Dry run: New poem: Lioness (poetry/Lioness)");
    expect(lines).toContain("Would send now: 12");
    expect(lines.join(" ")).toMatch(/Nothing was sent/);
  });
});

describe("the workflow file", () => {
  const workflow = readFileSync(".github/workflows/newsletter.yml", "utf8");

  it("only reads the repository and pins every action to a commit", () => {
    expect(workflow).toMatch(/permissions:\n\s+contents: read/);
    const uses = [...workflow.matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const ref of uses) expect(ref).toMatch(/@[0-9a-f]{40}$/);
  });

  it("passes the form through env, never into the shell command", () => {
    const runLines = workflow.split("\n").filter((line) => /^\s*run:/.test(line));
    for (const line of runLines) expect(line).not.toMatch(/\$\{\{/);
  });

  it("doesn't cache dependencies or run install scripts in the job holding the keys", () => {
    expect(workflow).not.toMatch(/cache:\s*npm/);
    expect(workflow).toMatch(/npm ci --ignore-scripts/);
  });

  it("defaults to a dry run", () => {
    expect(workflow).toMatch(/dry_run:[\s\S]*?type: boolean[\s\S]*?default: true/);
  });
});
