"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUp, Link as LinkIcon, Sparkles } from "lucide-react";
import muninnLogo from "@/src/logo/muninn-mark.png";
import type { MuninnCitation } from "@/lib/muninn/types";

const SUGGESTIONS = [
  { label: "Portfolio", prompt: "What is this assistant built to answer?" },
  { label: "RAG stack", prompt: "Explain Muninn's RAG architecture." },
  { label: "Cost", prompt: "How does Muninn keep operating cost at zero?" },
];

type MuninnUiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: MuninnCitation[];
};

const DISPLAY_PREFIX = "display-";

function parseCitations(header: string | null): MuninnCitation[] {
  if (!header) return [];
  try {
    return JSON.parse(decodeURIComponent(header)) as MuninnCitation[];
  } catch {
    return [];
  }
}

function messageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function Muninn() {
  const [messages, setMessages] = useState<MuninnUiMessage[]>([
    {
      id: `${DISPLAY_PREFIX}intro`,
      role: "assistant",
      content: "Hi. Ask me anything",
    },
    {
      id: `${DISPLAY_PREFIX}user-1`,
      role: "user",
      content: "What is Muninn?",
    },
    {
      id: `${DISPLAY_PREFIX}assistant-1`,
      role: "assistant",
      content:
        "Muninn is a memory-backed assistant: build-time local embeddings, bundled JSON vector search, Groq streaming, and citation chips.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const apiMessages = useMemo(
    () =>
      messages
        .filter((message) => !message.id.startsWith(DISPLAY_PREFIX))
        .map(({ role, content }) => ({ role, content }))
        .slice(-8),
    [messages],
  );

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function ask(prompt: string) {
    const content = prompt.trim();
    if (!content || isStreaming) return;

    const userMessage: MuninnUiMessage = { id: messageId("user"), role: "user", content };
    const assistantId = messageId("assistant");
    const assistantMessage: MuninnUiMessage = { id: assistantId, role: "assistant", content: "" };
    const nextMessages = [...apiMessages, { role: "user" as const, content }];

    setInput("");
    setError("");
    setIsStreaming(true);
    setMessages((current) => [...current, userMessage, assistantMessage]);

    try {
      const res = await fetch("/api/muninn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Muninn is offline. Try again in a moment.");
      }

      const citations = parseCitations(res.headers.get("x-muninn-citations"));
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId ? { ...message, citations } : message,
        ),
      );

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const delta = decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: message.content + delta }
              : message,
          ),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Muninn is offline. Try again in a moment.";
      setError(message);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? { ...item, content: "Muninn is offline. Try again in a moment." }
            : item,
        ),
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(input);
  }

  return (
    <article className="muninn-card">
      <div className="muninn-head">
        <div className="muninn-icon">
          <Image src={muninnLogo} alt="" aria-hidden="true" width={26} height={26} priority />
        </div>
        <div className="title">
          <strong>Muninn</strong>
          <span>: Trained on memory, built for citations</span>
        </div>
        <span className="live">
          <span className="dot" aria-hidden="true" /> Live
        </span>
      </div>

      <div ref={scrollerRef} className="thread">
        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="user-row">
              <div className="user-bubble">{message.content}</div>
            </div>
          ) : (
            <div key={message.id}>
              <div className="micro">Assistant</div>
              <div className="body">{message.content || "Thinking through the sources..."}</div>
              {!!message.citations?.length && (
                <div className="citations">
                  {message.citations.map((citation) => (
                    <a key={citation.id} href={citation.href} className="chip citation">
                      <LinkIcon size={12} /> {citation.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ),
        )}

        {error && <div className="notice">{error}</div>}

        <form className="input" onSubmit={onSubmit}>
          <Sparkles size={16} />
          <label htmlFor="muninn-input" className="sr-only">
            Ask Muninn a question
          </label>
          <input
            ref={inputRef}
            id="muninn-input"
            type="text"
            value={input}
            maxLength={1000}
            disabled={isStreaming}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask anything"
          />
          <button type="submit" className="send" aria-label="Send" disabled={isStreaming || !input.trim()}>
            <ArrowUp size={16} />
          </button>
        </form>
      </div>

      <div className="suggestions">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.label}
            className="chip"
            disabled={isStreaming}
            onClick={() => void ask(suggestion.prompt)}
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </article>
  );
}
