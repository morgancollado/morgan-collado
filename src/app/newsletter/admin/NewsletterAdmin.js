"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import NewsletterPageShell from "@/components/newsletter-page-shell";
import { formatDate } from "@/lib/format-date";
import { ink, muted, dim, SERIF_BODY, focusRing } from "@/lib/editorial";

const LABELS = { blog: "Technical writing", poetry: "Poetry" };

function PostRow({ post, kind, send, sending, sentAt }) {
  const [confirming, setConfirming] = useState(false);
  const busy = sending === `${kind}:${post.slug}`;

  return (
    <Box
      component="li"
      sx={{
        listStyle: "none",
        py: 1.75,
        borderBottom: "1px solid",
        borderColor: (t) => (t.palette.mode === "light" ? "#e2d9c8" : "#2a2333"),
        display: "flex",
        gap: 2,
        alignItems: "baseline",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontFamily: SERIF_BODY, fontSize: "1rem", color: ink }}>
          {post.title}
        </Typography>
        <Typography sx={{ fontFamily: SERIF_BODY, fontSize: "0.8rem", color: dim }}>
          {formatDate(post.date)}
          {sentAt && ` · sent ${formatDate(sentAt)}`}
        </Typography>
      </Box>

      {sentAt ? (
        <Typography
          sx={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "0.85rem",
            color: dim,
            flexShrink: 0,
          }}
        >
          sent
        </Typography>
      ) : confirming ? (
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
          <Button
            onClick={() => send(kind, post.slug)}
            disabled={busy}
            sx={{
              fontFamily: SERIF_BODY,
              fontSize: "0.8rem",
              color: ink,
              border: "1px solid",
              borderColor: "currentColor",
              borderRadius: 0,
              ...focusRing(),
            }}
          >
            {busy ? "Sending…" : "Confirm send"}
          </Button>
          <Button
            onClick={() => setConfirming(false)}
            disabled={busy}
            sx={{ fontFamily: SERIF_BODY, fontSize: "0.8rem", color: muted, ...focusRing() }}
          >
            Cancel
          </Button>
        </Box>
      ) : (
        <Button
          onClick={() => setConfirming(true)}
          sx={{
            fontFamily: SERIF_BODY,
            fontSize: "0.8rem",
            color: muted,
            flexShrink: 0,
            ...focusRing(),
          }}
        >
          Send…
        </Button>
      )}
    </Box>
  );
}

function Column({ kind, posts, sentMap, count, send, sending }) {
  const unsent = posts.filter((p) => !sentMap[`${kind}:${p.slug}`]).length;

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        component="h2"
        sx={{
          fontFamily: "var(--font-playfair)",
          fontSize: "1.25rem",
          color: ink,
          mb: 0.5,
        }}
      >
        {LABELS[kind]}
      </Typography>
      <Typography
        sx={{ fontFamily: SERIF_BODY, fontSize: "0.85rem", color: muted, mb: 2 }}
      >
        {count} subscriber{count === 1 ? "" : "s"} · {unsent} not yet sent
      </Typography>
      <Box component="ul" sx={{ m: 0, p: 0 }}>
        {posts.map((post) => (
          <PostRow
            key={post.slug}
            post={post}
            kind={kind}
            send={send}
            sending={sending}
            sentAt={sentMap[`${kind}:${post.slug}`]}
          />
        ))}
      </Box>
    </Box>
  );
}

export default function NewsletterAdmin({ blog, poetry }) {
  const [gate, setGate] = useState("checking"); // checking | locked | prompt | open
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sends, setSends] = useState([]);
  const [counts, setCounts] = useState({ blog: 0, poetry: 0, pending: 0 });
  const [sending, setSending] = useState(null);
  const [notice, setNotice] = useState("");

  const loadState = useCallback(async () => {
    const response = await fetch("/api/newsletter/admin/state");
    if (!response.ok) return;
    const payload = await response.json();
    setSends(payload.sends || []);
    setCounts(payload.counts || { blog: 0, poetry: 0, pending: 0 });
  }, []);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/newsletter/admin/auth");
      const payload = await response.json();
      // An unset password locks this console rather than opening it, so there
      // is a third state here that the queen gate doesn't have.
      if (!payload.configured) return setGate("locked");
      if (!payload.authorized) return setGate("prompt");
      setGate("open");
      loadState();
    })();
  }, [loadState]);

  async function unlock(event) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/newsletter/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Wrong password.");
      return;
    }
    setGate("open");
    loadState();
  }

  async function send(kind, slug) {
    setSending(`${kind}:${slug}`);
    setNotice("");
    try {
      const response = await fetch("/api/newsletter/admin/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, slug }),
      });
      const payload = await response.json();
      setNotice(
        response.ok
          ? `Sent “${payload.subject}” to ${payload.recipients} subscriber${payload.recipients === 1 ? "" : "s"}.`
          : payload.error
      );
    } catch {
      setNotice("Couldn't reach the server.");
    }
    setSending(null);
    // Refresh regardless: a failed send may still have claimed its row, and
    // the list should show the truth rather than what we hoped happened.
    loadState();
  }

  if (gate === "checking") return <NewsletterPageShell title="…" />;

  if (gate === "locked") {
    return (
      <NewsletterPageShell
        title="Console locked"
        intro="NEWSLETTER_ADMIN_PASSWORD isn't set, so nothing can be sent from here. Set it in the environment and reload."
      />
    );
  }

  if (gate === "prompt") {
    return (
      <NewsletterPageShell title="Newsletter">
        <Box component="form" onSubmit={unlock} sx={{ display: "flex", gap: 1.5 }}>
          <TextField
            type="password"
            size="small"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            autoFocus
            sx={{
              "& .MuiInputBase-root": { fontFamily: SERIF_BODY, color: ink },
              "& .MuiInputLabel-root": { fontFamily: SERIF_BODY, color: muted },
            }}
          />
          <Button
            type="submit"
            sx={{
              fontFamily: SERIF_BODY,
              color: ink,
              border: "1px solid",
              borderColor: "currentColor",
              borderRadius: 0,
              ...focusRing(),
            }}
          >
            Unlock
          </Button>
        </Box>
        {error && (
          <Typography
            role="alert"
            sx={{ fontFamily: SERIF_BODY, fontSize: "0.9rem", color: ink, mt: 2 }}
          >
            {error}
          </Typography>
        )}
      </NewsletterPageShell>
    );
  }

  const sentMap = Object.fromEntries(
    sends.map((s) => [`${s.kind}:${s.slug}`, s.sent_at])
  );

  return (
    <NewsletterPageShell
      title="Newsletter"
      intro={`${counts.pending} address${counts.pending === 1 ? "" : "es"} awaiting confirmation. Sending is one-way — there is no recall.`}
    >
      {notice && (
        <Typography
          role="status"
          sx={{
            fontFamily: SERIF_BODY,
            fontSize: "0.95rem",
            color: ink,
            border: "1px solid",
            borderColor: "currentColor",
            p: 2,
            mb: 4,
          }}
        >
          {notice}
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 6 }}>
        <Column
          kind="blog"
          posts={blog}
          sentMap={sentMap}
          count={counts.blog}
          send={send}
          sending={sending}
        />
        <Column
          kind="poetry"
          posts={poetry}
          sentMap={sentMap}
          count={counts.poetry}
          send={send}
          sending={sending}
        />
      </Box>
    </NewsletterPageShell>
  );
}
