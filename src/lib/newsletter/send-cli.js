import { appendFileSync } from "fs";
import { sendPost, describeResult, SendRefused } from "@/lib/newsletter/send";

/**
 * The "Send newsletter" workflow's entry point, kept here (not in the script)
 * so it can be tested without spawning a process.
 *
 * Inputs arrive as environment variables rather than command-line arguments:
 * the workflow passes its form fields through `env:`, which keeps whatever is
 * typed into the slug box out of the shell entirely.
 */

const SECRET_KEYS = ["DATABASE_URL", "RESEND_API_KEY"];

/** Every secret value worth scrubbing, including the password inside the database URL. */
export function secretValues(env) {
  const values = SECRET_KEYS.map((key) => env[key]).filter(Boolean);
  try {
    const password = decodeURIComponent(new URL(env.DATABASE_URL).password || "");
    if (password) values.push(password, encodeURIComponent(password));
  } catch {
    // Not a URL; the whole value is already on the list.
  }
  return [...new Set(values)].filter((value) => value.length >= 6);
}

const KINDS = { poetry: "poetry", blog: "blog", "technical writing": "blog" };

export function readInputs(env) {
  const kind = KINDS[String(env.NEWSLETTER_KIND || "").trim().toLowerCase()];
  const slug = String(env.NEWSLETTER_SLUG || "").trim();
  // Anything but an explicit "false" is a dry run. A typo should never send.
  const dryRun = String(env.NEWSLETTER_DRY_RUN ?? "true").trim().toLowerCase() !== "false";
  return { kind, slug, dryRun, rawKind: env.NEWSLETTER_KIND };
}

/** What is missing for a real send. A dry run reports these; a send stops on them. */
export function configProblems(env) {
  const problems = [];
  if (!env.DATABASE_URL) problems.push("The DATABASE_URL secret is not set.");
  if (!env.RESEND_API_KEY) problems.push("The RESEND_API_KEY secret is not set.");
  if (!env.NEWSLETTER_FROM) problems.push("The NEWSLETTER_FROM secret is not set.");
  // A real send from any other branch would mail out links to whatever is
  // live, which may not include the post. The environment's branch rule is
  // the real lock; this catches the honest mistake.
  if (env.GITHUB_ACTIONS === "true" && env.GITHUB_REF !== "refs/heads/main") {
    problems.push("Real sends only run from the main branch. Pick main under \"Use workflow from\".");
  }
  const base = env.NEXT_PUBLIC_BASE_URL || "";
  if (!/^https:\/\/[^/]+/.test(base)) {
    problems.push(
      "The SITE_URL variable must be your site's address starting with https://, or every link in the email points nowhere."
    );
  }
  return problems;
}

export async function runFromEnv(env = process.env, { log = console.log } = {}) {
  const lines = [];
  // GitHub masks secrets in its own log, but not necessarily everywhere a
  // line ends up, so anything that quotes one (a driver error echoing its
  // connection string, say) is scrubbed here first.
  const secrets = secretValues(env);
  const say = (line) => {
    const clean = secrets.reduce((text, secret) => text.split(secret).join("***"), String(line));
    lines.push(clean);
    log(clean);
  };
  const finish = (code) => {
    if (env.GITHUB_STEP_SUMMARY) {
      appendFileSync(env.GITHUB_STEP_SUMMARY, lines.map((line) => `${line}  `).join("\n") + "\n");
    }
    return code;
  };

  const { kind, slug, dryRun, rawKind } = readInputs(env);
  if (!kind) {
    const shown = /^[a-z ]{1,30}$/i.test(String(rawKind ?? "")) ? `"${rawKind}"` : "that kind";
    say(`Unknown kind ${shown}. Pick poetry or technical writing.`);
    return finish(1);
  }

  const problems = configProblems(env);
  if (!env.DATABASE_URL || (!dryRun && problems.length)) {
    problems.forEach(say);
    say(dryRun ? "Can't do a dry run without the database." : "Nothing was sent.");
    return finish(1);
  }

  try {
    const result = await sendPost({ kind, slug, dryRun });
    describeResult(result).forEach(say);
    if (dryRun && problems.length) {
      say("Before a real send, fix these:");
      problems.forEach((problem) => say(`- ${problem}`));
    }
    return finish(0);
  } catch (error) {
    if (error instanceof SendRefused) {
      say(error.message);
      return finish(1);
    }
    // Unexpected errors keep their message (a driver or network error) but
    // never a stack, which could quote a connection string.
    say(`Unexpected error: ${String(error?.message || error)}`);
    return finish(1);
  }
}
