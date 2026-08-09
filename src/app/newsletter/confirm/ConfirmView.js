"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import NewsletterPageShell from "@/components/newsletter-page-shell";
import { ink, muted, SERIF_BODY } from "@/lib/editorial";

export default function ConfirmView() {
  const token = useSearchParams().get("token");
  const [state, setState] = useState("working"); // working | done | error
  const [message, setMessage] = useState("");
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true; // StrictMode double-invokes effects in development.

    if (!token) {
      setState("error");
      setMessage("That link is missing its token.");
      return;
    }

    (async () => {
      try {
        const response = await fetch("/api/newsletter/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
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
        setMessage("Couldn't reach the server. Try the link again?");
      }
    })();
  }, [token]);

  if (state === "working") {
    return (
      <NewsletterPageShell
        title="Confirming your subscription"
        intro="One moment."
      />
    );
  }

  if (state === "error") {
    return (
      <NewsletterPageShell title="That link didn't work" intro={message}>
        <Typography sx={{ fontFamily: SERIF_BODY, color: muted }}>
          You can{" "}
          <Link href="/newsletter" style={{ color: "inherit" }}>
            sign up again
          </Link>{" "}
          — it only takes the one field.
        </Typography>
      </NewsletterPageShell>
    );
  }

  return (
    <NewsletterPageShell
      title="You're in"
      intro={`${message} is confirmed. You'll hear from me when something new goes up.`}
    >
      <Typography sx={{ fontFamily: SERIF_BODY, color: ink }}>
        In the meantime there&rsquo;s the{" "}
        <Link href="/blog" style={{ color: "inherit" }}>
          writing
        </Link>{" "}
        and the{" "}
        <Link href="/poetry" style={{ color: "inherit" }}>
          poetry
        </Link>
        .
      </Typography>
    </NewsletterPageShell>
  );
}
