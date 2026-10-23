import test from "node:test";
import assert from "node:assert/strict";
import { getEventAction, getUpcomingEvents } from "../src/lib/events.mjs";

const NOW = new Date("2026-10-23T12:00:00.000Z");

test("Story 1: upcoming event cards include date, location, price, and seats remaining", () => {
  const events = getUpcomingEvents(NOW);

  assert.ok(events.length > 0, "expected at least one upcoming event");
  for (const event of events) {
    assert.ok(event.title);
    assert.ok(Number.isFinite(Date.parse(event.startsAt)));
    assert.ok(event.location);
    assert.ok(Number.isInteger(event.priceCents) && event.priceCents >= 0);
    assert.ok(Number.isInteger(event.seatsRemaining) && event.seatsRemaining >= 0);
    assert.ok(Number.isInteger(event.capacity) && event.seatsRemaining <= event.capacity);
  }
  assert.ok(events.every((event) => new Date(event.startsAt) > NOW));
  assert.ok(events.some((event) => event.priceCents > 0), "expected a paid event");
  assert.ok(events.some((event) => event.priceCents === 0), "expected a free event");
});

test('Story 1: available events offer "Buy" and sold-out events offer only "Join waitlist"', () => {
  const events = getUpcomingEvents(NOW);
  const availableEvents = events.filter((event) => event.seatsRemaining > 0);
  const soldOutEvents = events.filter((event) => event.seatsRemaining === 0);

  assert.ok(availableEvents.length > 0, "expected an event with seats available");
  assert.ok(soldOutEvents.length > 0, "expected a sold-out upcoming event");
  assert.ok(availableEvents.every((event) => getEventAction(event) === "buy"));
  assert.ok(soldOutEvents.every((event) => getEventAction(event) === "waitlist"));
});

test("Story 1: upcoming events are listed in date order", () => {
  const events = getUpcomingEvents(NOW);
  const eventDates = events.map((event) => event.startsAt);
  const sortedEventDates = eventDates.slice().sort(
    (first, second) => new Date(first) - new Date(second),
  );

  assert.deepEqual(eventDates, sortedEventDates);
});

test("Story 1: the upcoming event list is empty after every event has passed", () => {
  assert.deepEqual(getUpcomingEvents(new Date("2100-01-01T00:00:00.000Z")), []);
});
