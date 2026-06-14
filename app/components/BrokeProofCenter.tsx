"use client";

import { useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";

export type BrokeProofCardId =
  | "mascot"
  | "boss"
  | "social"
  | "routine"
  | "challenge";

export type BrokeProofMetric = {
  label: string;
  value: string;
};

export type BrokeProofCard = {
  id: BrokeProofCardId;
  label: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  badge: string;
  primary: string;
  secondary: string;
  artSrc: string;
  tone: string;
  fileName: string;
  text: string;
  metrics: BrokeProofMetric[];
  chips: string[];
};

export type BrokeProofCenterState = {
  defaultCardId: BrokeProofCardId;
  cards: BrokeProofCard[];
};

type BrokeProofShareAction = (
  card: BrokeProofCard,
  element: HTMLDivElement | null,
) => Promise<void>;

export function MyBrokeProofCenter({
  state,
  onCopyText,
  onShareImage,
  onShareToX,
  onSendToBot,
  onImageError,
}: {
  state: BrokeProofCenterState;
  onCopyText: (card: BrokeProofCard) => Promise<void>;
  onShareImage: BrokeProofShareAction;
  onShareToX: BrokeProofShareAction;
  onSendToBot: BrokeProofShareAction;
  onImageError?: (event: SyntheticEvent<HTMLImageElement, Event>) => void;
}) {
  const [activeCardId, setActiveCardId] = useState<BrokeProofCardId>(
    state.defaultCardId,
  );
  const [copied, setCopied] = useState(false);
  const [busyAction, setBusyAction] = useState<"image" | "x" | "bot" | null>(
    null,
  );
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const activeCard =
    state.cards.find((card) => card.id === activeCardId) ?? state.cards[0];

  useEffect(() => {
    if (!state.cards.some((card) => card.id === activeCardId)) {
      setActiveCardId(state.defaultCardId);
    }
  }, [activeCardId, state.cards, state.defaultCardId]);

  async function copyProofText() {
    try {
      await onCopyText(activeCard);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  async function runShareAction(
    action: "image" | "x" | "bot",
    handler: BrokeProofShareAction,
  ) {
    if (busyAction) return;

    setBusyAction(action);

    try {
      await handler(activeCard, shareCardRef.current);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="broke-proof-center-card">
      <div className="broke-proof-center-head">
        <div>
          <span>My BROKE Proof</span>
          <strong>One public-safe share center</strong>
          <small>
            Pick a proof card, then share the same way: text, PNG, bot, or X
            image flow.
          </small>
        </div>
        <b>{activeCard.label}</b>
      </div>

      <div
        className="broke-proof-tabs"
        role="tablist"
        aria-label="BROKE proof card types"
      >
        {state.cards.map((card) => (
          <button
            key={card.id}
            type="button"
            role="tab"
            aria-selected={card.id === activeCard.id}
            className={card.id === activeCard.id ? "active" : ""}
            onClick={() => setActiveCardId(card.id)}
          >
            {card.label}
          </button>
        ))}
      </div>

      <div className="broke-proof-mobile-hint">
        <strong>{activeCard.label} proof selected</strong>
        <span>
          Same card, same actions: copy text, share PNG, send to bot, or open X
          with image-first fallback.
        </span>
      </div>

      <div
        className={`broke-proof-share-card tone-${activeCard.tone}`}
        ref={shareCardRef}
      >
        <div className="broke-proof-share-top">
          <div>
            <span>{activeCard.eyebrow}</span>
            <strong>{activeCard.title}</strong>
            <small>{activeCard.subtitle}</small>
          </div>
          <b>{activeCard.badge}</b>
        </div>

        <div className="broke-proof-share-main">
          <img
            src={activeCard.artSrc}
            alt=""
            loading="lazy"
            decoding="async"
            onError={onImageError}
          />
          <div>
            <span>{activeCard.label} card</span>
            <strong>{activeCard.primary}</strong>
            <small>{activeCard.secondary}</small>
          </div>
        </div>

        <div className="broke-proof-metric-grid">
          {activeCard.metrics.map((metric) => (
            <article key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>

        <div className="broke-proof-chip-row">
          {activeCard.chips.slice(0, 4).map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>

        <footer>
          <span>Real app proof only</span>
          <b>No income · No balance · No wallet value · No payout promise</b>
        </footer>
      </div>

      <div
        className="broke-proof-text-preview"
        aria-label="Selected public proof text"
      >
        <span>Text proof</span>
        <p>
          {activeCard.text.split("\n").filter(Boolean).slice(0, 4).join(" · ")}
        </p>
      </div>

      <div className="broke-proof-actions" aria-label="BROKE proof share actions">
        <button type="button" onClick={copyProofText} aria-label={`Copy ${activeCard.label} proof text`}>
          {copied ? "Copied" : "Copy text"}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => runShareAction("image", onShareImage)}
          aria-label={`Share ${activeCard.label} proof image`}
        >
          {busyAction === "image" ? "Preparing..." : "Share image"}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => runShareAction("x", onShareToX)}
          aria-label={`Share ${activeCard.label} proof to X`}
        >
          {busyAction === "x" ? "Preparing..." : "Share to X"}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => runShareAction("bot", onSendToBot)}
          aria-label={`Send ${activeCard.label} proof to Telegram bot`}
        >
          {busyAction === "bot" ? "Sending..." : "Send to bot"}
        </button>
      </div>

      <p className="broke-proof-center-note">
        Public-safe only: no balance, income, debt, wallet value, payout value,
        or reward promise. If X opens without an attached image, use the
        downloaded PNG.
      </p>
    </section>
  );
}
