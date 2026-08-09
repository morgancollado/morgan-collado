"use client";

import { useId, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
} from "@mui/material";
import { ink, muted, dim, SERIF_BODY, focusRing } from "@/lib/editorial";

/**
 * The one signup form, used in the footer and at the foot of both indexes.
 *
 * `variant` controls density rather than substance: "compact" for the footer,
 * where the form is a quiet offer under the colophon, and "card" for the end of
 * an index, where it is the page's closing invitation. `defaultTopics` lets the
 * poetry index pre-tick poetry — someone who just read four poems is telling
 * you what they came for.
 */
export default function NewsletterSignup({
  variant = "compact",
  defaultTopics = { blog: true, poetry: true },
}) {
  const id = useId();
  const card = variant === "card";

  const [email, setEmail] = useState("");
  const [topics, setTopics] = useState(defaultTopics);
  const [hp, setHp] = useState("");
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [message, setMessage] = useState("");

  const toggle = (key) => (event) =>
    setTopics((prev) => ({ ...prev, [key]: event.target.checked }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (state === "sending") return;

    if (!topics.blog && !topics.poetry) {
      setState("error");
      setMessage("Pick at least one kind of writing.");
      return;
    }

    setState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...topics, hp }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setState("error");
        setMessage(payload.error || "Something went wrong.");
        return;
      }
      setState("done");
      setMessage(payload.message);
    } catch {
      setState("error");
      setMessage("Couldn't reach the server. Try again?");
    }
  }

  if (state === "done") {
    return (
      <Box sx={{ maxWidth: "34rem", width: "100%", textAlign: card ? "left" : "center" }}>
        <Typography
          role="status"
          sx={{ fontFamily: SERIF_BODY, fontSize: "0.95rem", color: ink }}
        >
          {message}
        </Typography>
      </Box>
    );
  }

  const labelSx = {
    "& .MuiFormControlLabel-label": {
      fontFamily: SERIF_BODY,
      fontSize: "0.9rem",
      color: muted,
    },
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: "100%",
        maxWidth: "34rem",
        ...(card && {
          border: "1px solid",
          borderColor: "currentColor",
          p: { xs: 3, md: 4 },
          mx: "auto",
        }),
      }}
    >
      {card && (
        <>
          <Typography
            component="h2"
            sx={{
              fontFamily: "var(--font-playfair)",
              fontSize: "1.4rem",
              color: ink,
              mb: 1,
            }}
          >
            Get new work by email
          </Typography>
          <Typography
            sx={{
              fontFamily: SERIF_BODY,
              fontSize: "0.95rem",
              color: muted,
              mb: 3,
            }}
          >
            A note when something new goes up. Nothing else, and you can leave in
            one click.
          </Typography>
        </>
      )}

      {!card && (
        <Typography
          component="label"
          htmlFor={`${id}-email`}
          sx={{
            display: "block",
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "0.85rem",
            fontVariantCaps: "small-caps",
            letterSpacing: 2,
            color: muted,
            textAlign: "center",
            mb: 1.5,
          }}
        >
          Get new work by email
        </Typography>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          alignItems: "flex-start",
        }}
      >
        <TextField
          id={`${id}-email`}
          type="email"
          required
          fullWidth
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          label={card ? "Email address" : undefined}
          aria-label={card ? undefined : "Email address"}
          inputProps={{ autoComplete: "email" }}
          sx={{
            "& .MuiInputBase-root": { fontFamily: SERIF_BODY, color: ink },
            "& .MuiInputLabel-root": { fontFamily: SERIF_BODY, color: muted },
          }}
        />
        <Button
          type="submit"
          disabled={state === "sending"}
          sx={{
            flexShrink: 0,
            fontFamily: "var(--font-playfair)",
            fontStyle: "italic",
            fontSize: "0.9rem",
            color: ink,
            border: "1px solid",
            borderColor: "currentColor",
            px: 2.5,
            py: 0.9,
            borderRadius: 0,
            ...focusRing(),
          }}
        >
          {state === "sending" ? "Sending…" : "Subscribe"}
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1, justifyContent: card ? "flex-start" : "center" }}>
        <FormControlLabel
          sx={labelSx}
          control={
            <Checkbox
              size="small"
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
              size="small"
              checked={topics.poetry}
              onChange={toggle("poetry")}
              sx={{ color: dim, ...focusRing("0px") }}
            />
          }
          label="Poetry"
        />
      </Box>

      {/*
        Honeypot. Hidden from sight and from screen readers, skipped by tab
        order, and never autofilled — anything that arrives with it filled in
        is a bot, and the route accepts the submission without writing a row.
      */}
      <Box
        component="input"
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        sx={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          border: 0,
        }}
      />

      {state === "error" && (
        <Typography
          role="alert"
          sx={{ fontFamily: SERIF_BODY, fontSize: "0.85rem", color: ink, mt: 1.5 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}
