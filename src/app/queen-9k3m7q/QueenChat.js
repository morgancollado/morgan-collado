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

  const listRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setMessages(loadHistory());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveHistory(messages);
  }, [messages, hydrated]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [input]);

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

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        if (!streaming) setStreaming(true);
        setMessages((prev) => {
          const out = prev.slice();
          const last = out[out.length - 1];
          if (last && last.role === "assistant" && !last.error) {
            out[out.length - 1] = { ...last, content: last.content + chunk };
          }
          return out;
        });
      }
    } catch {
      setMessages((prev) => {
        const out = prev.slice();
        const last = out[out.length - 1];
        if (last && last.role === "assistant" && last.content === "") {
          out[out.length - 1] = {
            role: "assistant",
            content: "The line went dead. Try again in a moment.",
            error: true,
          };
        }
        return out;
      });
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

  return (
    <div className={styles.root}>
      <div className={styles.grain} aria-hidden="true" />
      <header className={styles.header}>
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

      <div className={styles.list} ref={listRef}>
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
              {m.content}
            </div>
          </div>
        ))}
        {waitingForFirstToken && (
          <div className={styles.queenRow}>
            <div className={styles.typing} aria-label="The Queen is typing">
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
    </div>
  );
}
