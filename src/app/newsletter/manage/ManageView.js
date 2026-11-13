"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Button, Checkbox, FormControlLabel, Typography } from "@mui/material";
import NewsletterPageShell from "@/components/newsletter-page-shell";
import { ink, muted, dim, SERIF_BODY, focusRing } from "@/lib/editorial";

export default function ManageView() {
  const token = useSearchParams().get("token");

  const [state, setState] = useState("loading"); // loading | ready | error | gone | confirm
  const [email, setEmail] = useState("");
  const [topics, setTopics] = useState({ blog: false, poetry: false });
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("That link is missing its token.");
      return;
    }

    (async () => {
      try {
        const response = await fetch(
          `/api/newsletter/manage?token=${encodeURIComponent(token)}`
        );
        const payload = await response.json();
        if (!response.ok) {
          setState("error");
          setMessage(payload.error || "That link didn't work.");
          return;
        }
        setEmail(payload.email);
        setTopics({ blog: payload.blog, poetry: payload.poetry });
        setStatus(payload.status);
        setState("ready");
      } catch {
        setState("error");
        setMessage("Couldn't reach the server.");
      }
    })();
  }, [token]);

  const toggle = (key) => (event) =>
    setTopics((prev) => ({ ...prev, [key]: event.target.checked }));

  async function save(next) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/newsletter/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...next }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error || "Couldn't save that.");
        setSaving(false);
        return;
      }
      // Clearing both topics is an unsubscribe — the route says so, and the
      // page should reflect that rather than claiming preferences were saved.
      if (payload.status === "unsubscribed") {
        setState("gone");
        return;
      }
      // Picking topics again after unsubscribing is a re-join, and re-joining
      // costs a confirmation click. Saying "Saved." here would be a lie: the
      // row is `pending` and receives nothing until the link in that mail is
      // clicked.
      if (payload.status === "pending") {
        setState("confirm");
        return;
      }
      setStatus(payload.status);
      setTopics({ blog: payload.blog, poetry: payload.poetry });
      setMessage("Saved.");
    } catch {
      setMessage("Couldn't reach the server.");
    }
    setSaving(false);
  }

  if (state === "loading") return <NewsletterPageShell title="Loading…" />;

  if (state === "error") {
    return (
      <NewsletterPageShell title="That link didn't work" intro={message}>
        <Typography sx={{ fontFamily: SERIF_BODY, color: muted }}>
          <Link href="/newsletter" style={{ color: "inherit" }}>
            Sign up again
          </Link>{" "}
          if you&rsquo;d like to start over.
        </Typography>
      </NewsletterPageShell>
    );
  }

  if (state === "confirm") {
    return (
      <NewsletterPageShell
        title="One last click"
        intro={`Because you'd unsubscribed, ${email} has to be confirmed again. There's a link in your inbox — the subscription starts when you click it.`}
      />
    );
  }

  if (state === "gone") {
    return (
      <NewsletterPageShell
        title="You're unsubscribed"
        intro={`${email} won't get any more email from me.`}
      >
        <Typography sx={{ fontFamily: SERIF_BODY, color: muted }}>
          No hard feelings. The{" "}
          <Link href="/newsletter" style={{ color: "inherit" }}>
            door stays open
          </Link>
          .
        </Typography>
      </NewsletterPageShell>
    );
  }

  const labelSx = {
    "& .MuiFormControlLabel-label": {
      fontFamily: SERIF_BODY,
      fontSize: "1rem",
      color: ink,
    },
  };

  return (
    <NewsletterPageShell
      title="Your subscription"
      intro={
        status === "unsubscribed"
          ? `${email} — currently unsubscribed. Pick what you'd like and confirm to start again.`
          : status === "pending"
            ? `${email} — not confirmed yet. Check your inbox for the confirmation link.`
            : email
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 3 }}>
        <FormControlLabel
          sx={labelSx}
          control={
            <Checkbox
              checked={topics.blog}
              onChange={toggle("blog")}
              sx={{ color: dim, ...focusRing("0px") }}
            />
          }
          label="Technical writing"
        />
        <FormControlLabel
          sx={labelSx}
          control={
            <Checkbox
              checked={topics.poetry}
              onChange={toggle("poetry")}
              sx={{ color: dim, ...focusRing("0px") }}
            />
          }
          label="Poetry"
        />
      </Box>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Button
          onClick={() => save(topics)}
          disabled={saving}
          sx={{
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            color: ink,
            border: "1px solid",
            borderColor: "currentColor",
            borderRadius: 0,
            px: 2.5,
            py: 0.9,
            ...focusRing(),
          }}
        >
          {saving ? "Saving…" : "Save preferences"}
        </Button>
        <Button
          onClick={() => save({ blog: false, poetry: false })}
          disabled={saving}
          sx={{
            fontFamily: SERIF_BODY,
            fontSize: "0.9rem",
            color: muted,
            textDecoration: "underline",
            ...focusRing(),
          }}
        >
          Unsubscribe from everything
        </Button>
      </Box>

      {message && (
        <Typography
          role="status"
          sx={{ fontFamily: SERIF_BODY, fontSize: "0.9rem", color: muted, mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </NewsletterPageShell>
  );
}
