const events = [
  {
    id: "autumn-jazz",
    title: "Autumn Jazz on the Cut",
    category: "LIVE MUSIC",
    description:
      "An open-air set from the Tartan Jazz Collective, with warm drinks and a front-row view of the fall colors.",
    startsAt: "2026-11-07T18:30:00-05:00",
    location: "The Cut, Carnegie Mellon University",
    priceCents: 800,
    capacity: 120,
    sold: 120,
    accent: "plum",
    artwork: "jazz",
  },
  {
    id: "makers-night",
    title: "Makers After Dark",
    category: "STUDENT SHOWCASE",
    description:
      "A hands-on night of tiny builds, big ideas, and demos from Pittsburgh's student maker community.",
    startsAt: "2026-11-14T19:00:00-05:00",
    location: "Cohon University Center, Rangos Ballroom",
    priceCents: 500,
    capacity: 90,
    sold: 57,
    accent: "orange",
    artwork: "makers",
  },
  {
    id: "winter-market",
    title: "Tartan Winter Market",
    category: "CAMPUS COMMUNITY",
    description:
      "Meet local makers, find one-of-a-kind gifts, and settle in for a cozy afternoon on campus.",
    startsAt: "2026-12-05T12:00:00-05:00",
    location: "Posner Center, Great Hall",
    priceCents: 0,
    capacity: 200,
    sold: 42,
    accent: "green",
    artwork: "market",
  },
];

const waitlist = [];
const orders = [];
const WAITLIST_HOLD_MS = 30 * 60 * 1000;

function getEvent(eventId) {
  return events.find((item) => item.id === eventId);
}

function getActiveHoldCount(eventId, now) {
  return waitlist.filter(
    (entry) =>
      entry.eventId === eventId &&
      entry.status === "offered" &&
      entry.offerExpiresAt > now.getTime(),
  ).length;
}

function offerNextWaitlistedSeat(eventId, now) {
  const nextPerson = waitlist.find(
    (entry) => entry.eventId === eventId && entry.status === "waiting",
  );
  if (!nextPerson) return null;

  nextPerson.status = "offered";
  nextPerson.offerExpiresAt = now.getTime() + WAITLIST_HOLD_MS;
  return nextPerson;
}

function expireWaitlistOffers(now) {
  for (const entry of waitlist) {
    if (entry.status !== "offered" || entry.offerExpiresAt > now.getTime()) continue;

    entry.status = "expired";
    offerNextWaitlistedSeat(entry.eventId, now);
  }
}

export function getUpcomingEvents(now = new Date()) {
  expireWaitlistOffers(now);

  return events
    .filter((event) => new Date(event.startsAt) > now)
    .sort((first, second) => new Date(first.startsAt) - new Date(second.startsAt))
    .map(({ sold, ...event }) => {
      const seatsRemaining = Math.max(
        event.capacity - sold - getActiveHoldCount(event.id, now),
        0,
      );
      return {
        ...event,
        seatsRemaining,
        isSoldOut: seatsRemaining === 0,
      };
    });
}

export function getEventAction(event) {
  return event.seatsRemaining === 0 ? "waitlist" : "buy";
}

export function purchaseTicket(eventId, name, now = new Date()) {
  expireWaitlistOffers(now);
  const event = getEvent(eventId);
  if (!event) return { error: "Event not found.", status: 404 };

  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) return { error: "Enter your name to continue.", status: 400 };

  if (event.sold + getActiveHoldCount(eventId, now) >= event.capacity) {
    return { error: "This event just sold out. Join the waitlist instead.", status: 409 };
  }

  event.sold += 1;
  const order = {
    id: `order-${orders.length + 1}`,
    eventId,
    name: cleanName,
  };
  orders.push(order);

  return {
    order,
    event: getUpcomingEvents(now).find((item) => item.id === eventId),
  };
}

export function addToWaitlist(eventId, name) {
  const event = getEvent(eventId);
  if (!event) return { error: "Event not found.", status: 404 };

  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) return { error: "Enter your name to join the waitlist.", status: 400 };
  if (event.sold < event.capacity) {
    return { error: "This event has seats available. You can buy a ticket instead.", status: 409 };
  }

  waitlist.push({ eventId, name: cleanName, status: "waiting" });
  return { joined: true, position: waitlist.filter((item) => item.eventId === eventId).length };
}

export function releaseEventSeat(eventId, now = new Date()) {
  expireWaitlistOffers(now);
  const event = getEvent(eventId);
  if (!event) return { error: "Event not found.", status: 404 };
  if (event.sold === 0) {
    return { error: "There are no sold seats to release.", status: 409 };
  }

  event.sold -= 1;
  const offer = offerNextWaitlistedSeat(eventId, now);

  return {
    released: true,
    offerExpiresAt: offer ? new Date(offer.offerExpiresAt).toISOString() : null,
    event: getUpcomingEvents(now).find((item) => item.id === eventId),
  };
}

export function getWaitlistStatus(eventId, name, now = new Date()) {
  expireWaitlistOffers(now);
  if (!getEvent(eventId)) return { error: "Event not found.", status: 404 };

  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) return { error: "Enter your name to check the waitlist.", status: 400 };

  const entry = waitlist.find(
    (item) => item.eventId === eventId && item.name === cleanName,
  );
  if (!entry) return { error: "Waitlist entry not found.", status: 404 };

  if (entry.status === "offered") {
    return {
      status: "offered",
      notification: "A seat is available. Claim it within 30 minutes.",
      expiresAt: new Date(entry.offerExpiresAt).toISOString(),
    };
  }

  return { status: entry.status };
}

export function claimWaitlistOffer(eventId, name, now = new Date()) {
  expireWaitlistOffers(now);
  const cleanName = typeof name === "string" ? name.trim() : "";
  const entry = waitlist.find(
    (item) =>
      item.eventId === eventId &&
      item.name === cleanName &&
      item.status === "offered" &&
      item.offerExpiresAt > now.getTime(),
  );
  if (!entry) {
    return { error: "This seat offer is no longer available.", status: 409 };
  }

  const event = getEvent(eventId);
  if (!event) return { error: "Event not found.", status: 404 };

  entry.status = "claimed";
  event.sold += 1;
  const order = {
    id: `order-${orders.length + 1}`,
    eventId,
    name: cleanName,
  };
  orders.push(order);

  return {
    claimed: true,
    order,
    event: getUpcomingEvents(now).find((item) => item.id === eventId),
  };
}
