"use client";

import { useState } from "react";

function formatEventDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(cents) {
  if (cents === 0) return "Free";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default function EventsExplorer({ initialEvents }) {
  const [events, setEvents] = useState(initialEvents);
  const [activeEvent, setActiveEvent] = useState(null);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function openAction(event) {
    setActiveEvent(event);
    setName("");
    setNotice("");
    setError("");
  }

  async function submitAction() {
    if (!activeEvent || pending) return;
    setPending(true);
    setError("");
    setNotice("");

    try {
      const isWaitlist = activeEvent.seatsRemaining === 0;
      const response = await fetch(isWaitlist ? "/api/waitlist" : "/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: activeEvent.id, name }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        if (response.status === 409 && !isWaitlist) {
          const refreshed = await fetch("/api/events");
          if (refreshed.ok) setEvents(await refreshed.json());
        }
        return;
      }

      if (isWaitlist) {
        setNotice(`You’re on the list! You’re #${result.position}.`);
      } else {
        setNotice(
          activeEvent.priceCents === 0
            ? "You’re in! Your free ticket is claimed."
            : "You’re in! Your simulated payment is complete.",
        );
        setEvents((current) =>
          current.map((item) =>
            item.id === activeEvent.id
              ? { ...item, seatsRemaining: result.event.seatsRemaining }
              : item,
          ),
        );
      }
    } catch {
      setError("Couldn’t reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="event-grid">
        {events.map((event, index) => {
          const soldOut = event.seatsRemaining === 0;
          return (
            <article className={`event-card card-${event.accent}`} key={event.id}>
              <div className={`event-art event-art-${event.artwork}`}>
                <span className="event-number">0{index + 1}</span>
                {event.artwork === "jazz" && (
                  <div className="jazz-art" aria-hidden="true">
                    <span className="jazz-note">♪</span>
                    <span className="jazz-disc" />
                    <span className="jazz-line" />
                  </div>
                )}
                {event.artwork === "makers" && (
                  <div className="makers-art" aria-hidden="true">
                    <span className="maker-shape shape-a" />
                    <span className="maker-shape shape-b" />
                    <span className="maker-shape shape-c" />
                    <span className="maker-sun" />
                  </div>
                )}
                {event.artwork === "market" && (
                  <div className="market-art" aria-hidden="true">
                    <span className="market-tree tree-a">✳</span>
                    <span className="market-tree tree-b">✳</span>
                    <span className="market-roof" />
                    <span className="market-stall" />
                  </div>
                )}
                {soldOut && <span className="sold-out-tag">SOLD OUT</span>}
              </div>
              <div className="event-content">
                <p className="event-category">{event.category}</p>
                <h3>{event.title}</h3>
                <p className="event-description">{event.description}</p>
                <div className="event-details">
                  <p><span className="detail-icon" aria-hidden="true">◷</span>{formatEventDate(event.startsAt)}</p>
                  <p><span className="detail-icon location-icon" aria-hidden="true">⌖</span>{event.location}</p>
                </div>
                <div className="event-bottom">
                  <div>
                    <span className="price">{formatPrice(event.priceCents)}</span>
                    <span className={`seats ${soldOut ? "seats-sold" : ""}`}>
                      {soldOut ? "No seats left" : `${event.seatsRemaining} seats left`}
                    </span>
                  </div>
                  <button
                    className={`event-action ${soldOut ? "waitlist-action" : ""}`}
                    onClick={() => openAction(event)}
                    type="button"
                    aria-label={soldOut ? `Join waitlist for ${event.title}` : `Buy tickets for ${event.title}`}
                  >
                    {soldOut ? "Join waitlist" : "Buy"} <span aria-hidden="true">↗</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {activeEvent && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setActiveEvent(null);
        }}>
          <section className="action-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
            <button className="dialog-close" type="button" onClick={() => setActiveEvent(null)} aria-label="Close">×</button>
            <p className="eyebrow">{activeEvent.seatsRemaining === 0 ? "SAVE YOUR SPOT" : "ONE GOOD PLAN"}</p>
            <h2 id="dialog-title">{activeEvent.seatsRemaining === 0 ? "Join the waitlist." : "You’re almost in."}</h2>
            <p className="dialog-event">{activeEvent.title} <span>·</span> {formatPrice(activeEvent.priceCents)}</p>
            <form
              aria-busy={pending}
              onSubmit={(event) => {
                event.preventDefault();
                void submitAction();
              }}
            >
              <label htmlFor="attendee-name">Your name</label>
              <input
                id="attendee-name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Type your name"
                maxLength={100}
                required
              />
              {error && <p className="form-message form-error" role="alert">{error}</p>}
              {notice && <p className="form-message form-success" role="status">{notice}</p>}
              <button className="submit-action" type="submit" disabled={pending || Boolean(notice)}>
                {pending
                  ? "One moment…"
                  : activeEvent.seatsRemaining === 0
                    ? "Join waitlist"
                    : activeEvent.priceCents === 0
                      ? "Claim free ticket"
                      : "Simulated payment"}
                {!pending && !notice && <span aria-hidden="true">↗</span>}
              </button>
              <p className="simulation-note">No card details. This demo keeps activity in server memory only.</p>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
