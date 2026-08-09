import { absoluteUrl } from "@/lib/site";
import { formatDate } from "@/lib/format-date";
import { sendOne, sendBatch } from "@/lib/newsletter/resend";

/**
 * The two emails this site sends.
 *
 * Plain HTML strings rather than a rendering library. The site's voice is
 * text-forward and serif, which is precisely what survives an email client —
 * and every dependency avoided here is one that would otherwise have to run
 * inside a route handler. Styles are inline and the palette is hardcoded hex
 * rather than read from editorial.js: mail clients have neither CSS variables
 * nor a theme callback, so these are the light-mode values pinned by hand.
 */

const PAPER = "#faf6ec";
const INK = "#1c1614";
const MUTED = "#5a4d3f";
const RULE = "#d8cfbe";

const SERIF =
  "'Iowan Old Style', 'Apple Garamond', Baskerville, 'Times New Roman', Times, Georgia, serif";

export const TOPIC_LABELS = { blog: "Technical writing", poetry: "Poetry" };

const PATHS = { blog: "blog", poetry: "poetry" };

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function manageUrl(token) {
  return absoluteUrl(`/newsletter/manage?token=${encodeURIComponent(token)}`);
}

function confirmUrl(token) {
  return absoluteUrl(`/newsletter/confirm?token=${encodeURIComponent(token)}`);
}

/**
 * Two unsubscribe URLs, for two different clickers.
 *
 * The header form is the machine one: RFC 8058 one-click, POST-only, so a
 * client that prefetches links cannot unsubscribe somebody by accident. The
 * page form is what a person sees in the footer — it confirms before acting.
 */
function unsubscribeEndpoint(token) {
  return absoluteUrl(
    `/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`
  );
}

function unsubscribePageUrl(token) {
  return absoluteUrl(`/newsletter/unsubscribe?token=${encodeURIComponent(token)}`);
}

export function postUrl(kind, slug) {
  return absoluteUrl(`/${PATHS[kind]}/${slug}`);
}

/** Shell shared by both emails: centred measure, paper ground, serif body. */
function layout({ body, footer }) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PAPER};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:34rem;">
        <tr><td style="font-family:${SERIF};color:${INK};font-size:17px;line-height:1.65;">
${body}
        </td></tr>
        <tr><td style="padding-top:28px;border-top:1px solid ${RULE};font-family:${SERIF};color:${MUTED};font-size:13px;line-height:1.6;">
${footer}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * The taste of the piece that goes above the link.
 *
 * An essay has a `description` in its frontmatter and a poem does not, so a
 * poem instead carries `excerpt` — its opening lines, which have to keep their
 * breaks. Rendering those as one runny paragraph would misrepresent the form.
 */
function blurbHtml(post) {
  if (post.excerpt?.length) {
    const lines = post.excerpt.map(escapeHtml).join("<br>");
    return `<p style="margin:0 0 28px;padding-left:14px;border-left:2px solid ${RULE};color:${MUTED};">${lines}</p>`;
  }
  if (post.description) {
    return `<p style="margin:0 0 28px;">${escapeHtml(post.description)}</p>`;
  }
  return "";
}

function blurbText(post) {
  if (post.excerpt?.length) return `\n${post.excerpt.join("\n")}\n`;
  if (post.description) return `\n${post.description}\n`;
  return "";
}

function topicSentence(topics) {
  const names = topics.map((t) => TOPIC_LABELS[t].toLowerCase());
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return names[0] || "new writing";
}

/**
 * Double opt-in. Nothing is ever sent to an address that has not answered this.
 */
export async function sendConfirmation({ email, token, topics }) {
  const url = confirmUrl(token);
  const what = topicSentence(topics);

  const html = layout({
    body: `
<p style="margin:0 0 20px;">Someone — hopefully you — asked to hear when Morgan Collado publishes new ${escapeHtml(what)}.</p>
<p style="margin:0 0 28px;">Confirm and that's the whole arrangement:</p>
<p style="margin:0 0 28px;"><a href="${url}" style="color:${INK};font-weight:600;">Confirm your subscription →</a></p>
<p style="margin:0;color:${MUTED};font-size:14px;">If this wasn't you, ignore it. Nothing happens without that click.</p>`,
    footer: `<p style="margin:0;">Sent because someone entered this address at ${escapeHtml(absoluteUrl("/newsletter"))}.</p>`,
  });

  const text = `Someone — hopefully you — asked to hear when Morgan Collado publishes new ${what}.

Confirm your subscription:
${url}

If this wasn't you, ignore it. Nothing happens without that click.`;

  return sendOne({
    to: [email],
    subject: "Confirm your subscription",
    html,
    text,
  });
}

/**
 * The notification itself, built once per recipient so each carries its own
 * unsubscribe link and one-click header.
 *
 * List-Unsubscribe is not garnish. Gmail and Yahoo's bulk-sender rules require
 * it, and mail without it lands in spam regardless of how good the content is.
 */
export async function sendNewPost({ recipients, kind, post }) {
  const label = TOPIC_LABELS[kind];
  const url = postUrl(kind, post.slug);
  const subject =
    kind === "poetry" ? `New poem: ${post.title}` : `New writing: ${post.title}`;
  const dateline = formatDate(post.date);

  const messages = recipients.map(({ email, token }) => {
    const manage = manageUrl(token);
    const unsubscribe = unsubscribePageUrl(token);
    const oneClick = unsubscribeEndpoint(token);

    const html = layout({
      body: `
<p style="margin:0 0 6px;color:${MUTED};font-size:13px;letter-spacing:2px;text-transform:uppercase;">${escapeHtml(label)}</p>
<h1 style="margin:0 0 6px;font-size:28px;line-height:1.25;font-weight:600;color:${INK};">${escapeHtml(post.title)}</h1>
<p style="margin:0 0 24px;color:${MUTED};font-size:14px;">${escapeHtml(dateline)}</p>
${blurbHtml(post)}
<p style="margin:0;"><a href="${url}" style="color:${INK};font-weight:600;">Read it on the site →</a></p>`,
      footer: `<p style="margin:0 0 6px;">You're subscribed to ${escapeHtml(label.toLowerCase())}.
<a href="${manage}" style="color:${MUTED};">Change what you get</a> or
<a href="${unsubscribe}" style="color:${MUTED};">unsubscribe</a>.</p>`,
    });

    const text = `${label.toUpperCase()}

${post.title}
${dateline}
${blurbText(post)}
Read it on the site:
${url}

—
Change what you get: ${manage}
Unsubscribe: ${unsubscribe}`;

    return {
      to: [email],
      subject,
      html,
      text,
      headers: {
        "List-Unsubscribe": `<${oneClick}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
  });

  return sendBatch(messages);
}
