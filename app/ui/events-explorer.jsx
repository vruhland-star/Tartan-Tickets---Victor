"use client";

import { useEffect, useState } from "react";

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
  const [waitlistTracking, setWaitlistTracking] = useState(null);
  const [waitlistNotice, setWaitlistNotice] = useState(null);
  const [releasePending, setReleasePending] = useState("");
  const [claimPending, setClaimPending] = useState(false);
  const [releaseError, setReleaseError] = useState("");

  useEffect(() => {
    if (!waitlistTracking || waitlistNotice?.status === "claimed") return;

    async function checkWaitlistOffer() {
      try {
        const query = new URLSearchParams({
          eventId: waitlistTracking.eventId,
          name: waitlistTracking.name,
        });
        const response = await fetch(`/api/waitlist?${query}`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Couldn’t check your waitlist status.");
        }

        setWaitlistNotice((current) => {
          if (result.status === "offered") {
            return { ...result, eventId: waitlistTracking.eventId };
          }
          if (result.status === "expired") {
            return {
              status: "expired",
              eventId: waitlistTracking.eventId,
              notification: "Your 30-minute seat hold has expired.",
            };
          }
          return current?.status === "offered"
            ? {
                status: result.status,
                eventId: waitlistTracking.eventId,
                notification: "Your seat offer is no longer available.",
              }
            : current;
        });
      } catch (requestError) {
        setWaitlistNotice({
          status: "error",
          eventId: waitlistTracking.eventId,
          notification: requestError.message,
        });
      }
    }

    void checkWaitlistOffer();
    const interval = setInterval(checkWaitlistOffer, 3000);
    return () => clearInterval(interval);
  }, [waitlistTracking, waitlistNotice?.status]);

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
        setWaitlistTracking({ eventId: activeEvent.id, name: name.trim() });
        setWaitlistNotice({
          status: "waiting",
          eventId: activeEvent.id,
          notification: `You’re on the list! You’re #${result.position}. Keep this page open for a seat offer.`,
        });
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

  async function releaseSeat(eventId) {
    setReleasePending(eventId);
    setReleaseError("");
    try {
      const response = await fetch("/api/demo/release-seat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const result = await response.json();
      if (!response.ok) {
        setReleaseError(result.error || "Couldn’t simulate a seat release.");
        return;
      }
      setEvents((current) =>
        current.map((event) => (event.id === eventId ? result.event : event)),
      );
    } catch {
      setReleaseError("Couldn’t reach the server. Please try again.");
    } finally {
      setReleasePending("");
    }
  }

  async function claimWaitlistSeat(eventId) {
    if (!waitlistTracking || waitlistTracking.eventId !== eventId || claimPending) return;
    setClaimPending(true);
    setReleaseError("");
    try {
      const response = await fetch("/api/waitlist/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waitlistTracking),
      });
      const result = await response.json();
      if (!response.ok) {
        setReleaseError(result.error || "Couldn’t claim this seat.");
        return;
      }
      setEvents((current) =>
        current.map((event) => (event.id === eventId ? result.event : event)),
      );
      setWaitlistTracking(null);
      setWaitlistNotice({
        status: "claimed",
        eventId,
        notification:
          "Your seat is claimed. Your simulated payment is complete.",
      });
    } catch {
      setReleaseError("Couldn’t reach the server. Please try again.");
    } finally {
      setClaimPending(false);
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
                {waitlistNotice?.eventId === event.id && (
                  <div className="waitlist-notice" role="status">
                    <p>{waitlistNotice.notification}</p>
                    {waitlistNotice.status === "offered" && (
                      <button
                        className="claim-seat-action"
                        type="button"
                        onClick={() => void claimWaitlistSeat(event.id)}
                        disabled={claimPending}
                      >
                        {claimPending
                          ? "Claiming seat…"
                          : event.priceCents === 0
                            ? "Claim held seat"
                            : "Claim held seat · Simulated payment"}
                      </button>
                    )}
                    {releaseError && (
                      <p className="form-message form-error" role="alert">{releaseError}</p>
                    )}
                  </div>
                )}
                {soldOut && (
                  <button
                    className="demo-release-action"
                    type="button"
                    onClick={() => void releaseSeat(event.id)}
                    disabled={releasePending === event.id}
                  >
                    {releasePending === event.id
                      ? "Releasing seat…"
                      : "Demo: simulate a released seat"}
                  </button>
                )}
                {releaseError && waitlistNotice?.eventId !== event.id && (
                  <p className="form-message form-error" role="alert">{releaseError}</p>
                )}
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
