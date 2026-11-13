import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { readInputs, configProblems, runFromEnv } from "@/lib/newsletter/send-cli";
import { describeResult, subjectFor } from "@/lib/newsletter/send";

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

  it("defaults to a dry run", () => {
    expect(workflow).toMatch(/dry_run:[\s\S]*?type: boolean[\s\S]*?default: true/);
  });
});
