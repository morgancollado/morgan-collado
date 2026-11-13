"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Button, Typography } from "@mui/material";
import NewsletterPageShell from "@/components/newsletter-page-shell";
import { ink, muted, SERIF_BODY, focusRing } from "@/lib/editorial";

/**
 * The human half of unsubscribing.
 *
 * It asks before acting rather than unsubscribing on page load. The link lives
 * in an email footer, and mail clients and security scanners both follow
 * footer links unprompted — doing the deed on GET would quietly unsubscribe
 * people who never clicked anything. One-click from the mail client's own
 * button goes to the API route instead, where a POST is unambiguous.
 */
export default function UnsubscribeView() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState("ask"); // ask | working | done | error
  const [message, setMessage] = useState("");

  async function unsubscribe() {
    setState("working");
    try {
      const response = await fetch(
        `/api/newsletter/unsubscribe?token=${encodeURIComponent(token || "")}`,
        { method: "POST" }
      );
      const payload = await response.json();
      if (!response.ok) {
        setState("error");
        setMessage(payload.error || "That link didn't work.");
        return;
      }
      setState("done");
      setMessage(payload.email);
    } catch {
      setState("error");
      setMessage("Couldn't reach the server.");
    }
  }

  if (state === "done") {
    return (
      <NewsletterPageShell
        title="You're unsubscribed"
        intro={`${message} won't get any more email from me.`}
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

  if (state === "error") {
    return <NewsletterPageShell title="That link didn't work" intro={message} />;
  }

  return (
    <NewsletterPageShell
      title="Unsubscribe?"
      intro="This stops all email — both the technical writing and the poetry."
    >
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Button
          onClick={unsubscribe}
          disabled={state === "working" || !token}
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
          {state === "working" ? "Unsubscribing…" : "Yes, unsubscribe me"}
        </Button>
        {token && (
          <Typography sx={{ fontFamily: SERIF_BODY, fontSize: "0.9rem", color: muted }}>
            or{" "}
            <Link
              href={`/newsletter/manage?token=${encodeURIComponent(token)}`}
              style={{ color: "inherit" }}
            >
              keep just one of them
            </Link>
          </Typography>
        )}
      </Box>
    </NewsletterPageShell>
  );
}
