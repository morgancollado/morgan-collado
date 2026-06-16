"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./queen.module.css";

const STORAGE_KEY = "queen-chat-history";
const HISTORY_CAP = 40;
const PORTRAIT_URL =
  "https://static.wikia.nocookie.net/overwatch_gamepedia/images/6/63/Junker_Queen_Hero.png/revision/latest?cb=20251128224452";

function loadHistory() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      )
      .slice(-HISTORY_CAP);
  } catch {
    return [];
  }
}

function saveHistory(messages) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(messages.slice(-HISTORY_CAP)),
    );
  } catch {
    // quota or disabled — ignore
  }
}

export default function QueenChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [portraitOk, setPortraitOk] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // null = checking, true = gated, false = unlocked
  const [locked, setLocked] = useState(null);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const rootRef = useRef(null);
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMessages(loadHistory());
    setHydrated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/queen/auth", { method: "GET" });
        const data = await res.json();
        if (!cancelled) setLocked(!data?.authorized);
      } catch {
        if (!cancelled) setLocked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hydrated) saveHistory(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, locked]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

  // Keep the composer above the on-screen keyboard. iOS Safari does not
  // shrink a `position: fixed` element when the keyboard opens, so we track
  // the visual viewport and size the container to it.
  useEffect(() => {
    const vv =
      typeof window !== "undefined" ? window.visualViewport : null;
    const root = rootRef.current;
    if (!vv || !root) return;
    const update = () => {
      root.style.height = `${vv.height}px`;
      root.style.transform = `translateY(${vv.offsetTop}px)`;
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      root.style.height = "";
      root.style.transform = "";
    };
  }, []);

  const submitPassword = async (e) => {
    e.preventDefault();
    if (!password || authBusy) return;
    setAuthBusy(true);
    setAuthError("");
    try {
      const res = await fetch("/api/queen/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword("");
        setLocked(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setAuthError(data?.error || "Wrong password.");
      }
    } catch {
      setAuthError("Couldn't reach the gate. Try again.");
    } finally {
      setAuthBusy(false);
    }
  };

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const next = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setSending(true);
    setStreaming(false);

    const payload = next.slice(-HISTORY_CAP);
    let res;
    try {
      res = await fetch("/api/queen/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "The line went dead. Try again in a moment.",
          error: true,
        },
      ]);
      setSending(false);
      return;
    }

    if (res.status === 401) {
      // Access expired — bounce back to the gate, keep the message.
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
      setLocked(true);
      setSending(false);
      return;
    }

    if (!res.ok || !res.body) {
      let msg = "Somethin' broke. Try again in a moment.";
      try {
        const data = await res.json();
        if (data?.error) msg = data.error;
      } catch {
        // fall through
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: msg, error: true },
      ]);
      setSending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let started = false;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        if (!started) {
          // First token: drop the typing dot and open the bubble.
          started = true;
          setStreaming(true);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: chunk },
          ]);
        } else {
          setMessages((prev) => {
            const out = prev.slice();
            const last = out[out.length - 1];
            if (last && last.role === "assistant" && !last.error) {
              out[out.length - 1] = {
                ...last,
                content: last.content + chunk,
              };
            }
            return out;
          });
        }
      }
      if (!started) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "The Queen went quiet. Try again in a moment.",
            error: true,
          },
        ]);
      }
    } catch {
      if (!started) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "The line went dead. Try again in a moment.",
            error: true,
          },
        ]);
      }
    } finally {
      setSending(false);
      setStreaming(false);
    }
  }, [input, sending, messages, streaming]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearConversation = () => {
    if (sending) return;
    setMessages([]);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  };

  const waitingForFirstToken =
    sending &&
    !streaming &&
    messages.length > 0 &&
    messages[messages.length - 1]?.role === "user";

  const portrait = (
    <div className={styles.portraitFrame}>
      {portraitOk ? (
        <img
          className={styles.portrait}
          src={PORTRAIT_URL}
          alt="The Queen"
          referrerPolicy="no-referrer"
          loading="eager"
          onError={() => setPortraitOk(false)}
        />
      ) : (
        <div className={styles.portraitFallback} aria-hidden="true">
          Q
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={styles.grain} aria-hidden="true" />

      {locked === null ? (
        <div className={styles.loading} role="status" aria-label="Loading">
          <span className={styles.dot} />
        </div>
      ) : locked ? (
        <div className={styles.gate}>
          <div className={styles.gateCard}>
            {portrait}
            <h1 className={styles.title}>The Queen</h1>
            <p className={styles.gateText}>
              State the password, mate. No password, no audience.
            </p>
            <form className={styles.gateForm} onSubmit={submitPassword}>
              <input
                className={styles.gateInput}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                aria-label="Password"
                aria-invalid={!!authError}
                aria-describedby="gate-error"
                autoFocus
                autoComplete="current-password"
                disabled={authBusy}
              />
              {authError && (
                <div id="gate-error" className={styles.gateError} role="alert">
                  {authError}
                </div>
              )}
              <button
                type="submit"
                className={styles.gateButton}
                disabled={authBusy || !password}
              >
                Enter
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <header className={styles.header}>
            {portrait}
            <h1 className={styles.title}>The Queen</h1>
            <button
              type="button"
              className={styles.clearButton}
              onClick={clearConversation}
              disabled={sending || messages.length === 0}
              aria-label="Clear conversation"
            >
              clear
            </button>
          </header>

          <div
            className={styles.list}
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation with the Queen"
          >
            {messages.length === 0 && hydrated && (
              <div className={styles.empty}>
                The throne is empty. Speak, and the Queen will answer.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? styles.userRow
                    : m.error
                      ? styles.errorRow
                      : styles.queenRow
                }
              >
                <div
                  className={
                    m.role === "user"
                      ? styles.userBubble
                      : m.error
                        ? styles.errorBubble
                        : styles.queenBubble
                  }
                >
                  <span className={styles.srOnly}>
                    {m.role === "user"
                      ? "You said: "
                      : m.error
                        ? "Error: "
                        : "The Queen said: "}
                  </span>
                  {m.content}
                </div>
              </div>
            ))}
            {waitingForFirstToken && (
              <div className={styles.queenRow}>
                <div
                  className={styles.typing}
                  aria-label="The Queen is typing"
                >
                  <span className={styles.dot} />
                </div>
              </div>
            )}
          </div>

          <form
            className={styles.composer}
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Address the throne..."
              rows={1}
              disabled={sending}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={sending || !input.trim()}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}
