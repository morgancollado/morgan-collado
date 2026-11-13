"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import NewsletterPageShell from "@/components/newsletter-page-shell";
import { formatDate } from "@/lib/format-date";
import { ink, muted, dim, SERIF_BODY, focusRing } from "@/lib/editorial";

const LABELS = { blog: "Technical writing", poetry: "Poetry" };

function PostRow({ post, kind, send, sending, record }) {
  const [confirming, setConfirming] = useState(false);
  const busy = sending === `${kind}:${post.slug}`;
  const confirmButton = useRef(null);
  const sendButton = useRef(null);

  // Both branches replace the button that was just activated, so focus would
  // otherwise land on <body> and a keyboard user would lose their place in a
  // long list.
  useEffect(() => {
    if (confirming) confirmButton.current?.focus();
  }, [confirming]);

  const cancel = () => {
    setConfirming(false);
    sendButton.current?.focus();
  };

  // A row with a send that stopped partway is not "sent" and not untouched —
  // it is resumable, and saying so is the difference between the operator
  // pressing Send again and going to look for the database.
  const partial = record && !record.completed_at;
  const done = record && record.completed_at;

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
          {done && ` · sent ${formatDate(record.sent_at)} to ${record.recipients}`}
          {partial && ` · stopped after ${record.recipients}`}
        </Typography>
      </Box>

      {done ? (
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
            ref={confirmButton}
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
            {busy ? "Sending…" : partial ? "Confirm resume" : "Confirm send"}
          </Button>
          <Button
            onClick={cancel}
            disabled={busy}
            sx={{ fontFamily: SERIF_BODY, fontSize: "0.8rem", color: muted, ...focusRing() }}
          >
            Cancel
          </Button>
        </Box>
      ) : (
        <Button
          ref={sendButton}
          onClick={() => setConfirming(true)}
          sx={{
            fontFamily: SERIF_BODY,
            fontSize: "0.8rem",
            color: muted,
            flexShrink: 0,
            ...focusRing(),
          }}
        >
          {partial ? "Resume…" : "Send…"}
        </Button>
      )}
    </Box>
  );
}

function Column({ kind, posts, records, count, send, sending }) {
  const unsent = posts.filter(
    (p) => !records[`${kind}:${p.slug}`]?.completed_at
  ).length;

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
            record={records[`${kind}:${post.slug}`]}
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
      if (!response.ok) {
        setNotice(payload.error);
      } else {
        const fresh = payload.recipients - (payload.skipped || 0);
        setNotice(
          `Sent “${payload.subject}” to ${fresh} subscriber${fresh === 1 ? "" : "s"}` +
            (payload.skipped
              ? `, on top of the ${payload.skipped} reached before. ${payload.recipients} in total.`
              : ".")
        );
      }
    } catch {
      setNotice("Couldn't reach the server.");
    }
    setSending(null);
    // Refresh regardless: a failed send may still have claimed its row, and
    // the list should show the truth rather than what we hoped happened.
    loadState();
  }

  // A literal ellipsis as the page heading is read aloud as "horizontal
  // ellipsis". Say what is happening instead.
  if (gate === "checking") {
    return <NewsletterPageShell title="Newsletter" intro="Checking access…" />;
  }

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

  const records = Object.fromEntries(
    sends.map((s) => [`${s.kind}:${s.slug}`, s])
  );

  return (
    <NewsletterPageShell
      title="Newsletter"
      intro={`${counts.pending} address${counts.pending === 1 ? "" : "es"} awaiting confirmation. Sending is one-way — there is no recall.`}
    >
      {/*
        Mounted whether or not there is anything to say. A live region that
        appears at the same moment as its first message is announced
        inconsistently across screen readers; one that is already on the page
        when the text arrives is not.
      */}
      <Box role="status" aria-live="polite">
        {notice && (
          <Typography
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
      </Box>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 6 }}>
        <Column
          kind="blog"
          posts={blog}
          records={records}
          count={counts.blog}
          send={send}
          sending={sending}
        />
        <Column
          kind="poetry"
          posts={poetry}
          records={records}
          count={counts.poetry}
          send={send}
          sending={sending}
        />
      </Box>
    </NewsletterPageShell>
  );
}
