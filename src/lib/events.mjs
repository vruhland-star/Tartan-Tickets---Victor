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

export function getUpcomingEvents(now = new Date()) {
  return events
    .filter((event) => new Date(event.startsAt) > now)
    .sort((first, second) => new Date(first.startsAt) - new Date(second.startsAt))
    .map(({ sold, ...event }) => ({
      ...event,
      seatsRemaining: Math.max(event.capacity - sold, 0),
      isSoldOut: sold >= event.capacity,
    }));
}

export function getEventAction(event) {
  return event.seatsRemaining === 0 ? "waitlist" : "buy";
}

export function purchaseTicket(eventId, name) {
  const event = events.find((item) => item.id === eventId);
  if (!event) return { error: "Event not found.", status: 404 };

  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) return { error: "Enter your name to continue.", status: 400 };

  if (event.sold >= event.capacity) {
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
    event: getUpcomingEvents().find((item) => item.id === eventId),
  };
}

export function addToWaitlist(eventId, name) {
  const event = events.find((item) => item.id === eventId);
  if (!event) return { error: "Event not found.", status: 404 };

  const cleanName = typeof name === "string" ? name.trim() : "";
  if (!cleanName) return { error: "Enter your name to join the waitlist.", status: 400 };
  if (event.sold < event.capacity) {
    return { error: "This event has seats available. You can buy a ticket instead.", status: 409 };
  }

  waitlist.push({ eventId, name: cleanName });
  return { joined: true, position: waitlist.filter((item) => item.eventId === eventId).length };
}
