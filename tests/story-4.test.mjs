import test from "node:test";
import assert from "node:assert/strict";
import {
  addToWaitlist,
  claimWaitlistOffer,
  getUpcomingEvents,
  getWaitlistStatus,
  purchaseTicket,
  releaseEventSeat,
} from "../src/lib/events.mjs";

const NOW = new Date("2026-10-23T12:00:00.000Z");
const EVENT_ID = "autumn-jazz";
const HOLD_DURATION_MS = 30 * 60 * 1000;

test("Story 4: releasing a seat notifies the next person and holds it for 30 minutes", () => {
  assert.equal(addToWaitlist(EVENT_ID, "First student").position, 1);
  assert.equal(addToWaitlist(EVENT_ID, "Second student").position, 2);

  const release = releaseEventSeat(EVENT_ID, NOW);
  assert.equal(release.released, true);

  const firstOffer = getWaitlistStatus(EVENT_ID, "First student", NOW);
  assert.equal(firstOffer.status, "offered");
  assert.equal(firstOffer.notification, "A seat is available. Claim it within 30 minutes.");
  assert.equal(
    new Date(firstOffer.expiresAt).getTime(),
    NOW.getTime() + HOLD_DURATION_MS,
  );
  assert.equal(getWaitlistStatus(EVENT_ID, "Second student", NOW).status, "waiting");
  assert.equal(
    getUpcomingEvents(NOW).find((event) => event.id === EVENT_ID).seatsRemaining,
    0,
  );
  assert.equal(purchaseTicket(EVENT_ID, "Another student", NOW).status, 409);

  const justBeforeExpiry = new Date(NOW.getTime() + HOLD_DURATION_MS - 1);
  assert.equal(getWaitlistStatus(EVENT_ID, "First student", justBeforeExpiry).status, "offered");
  assert.equal(getWaitlistStatus(EVENT_ID, "Second student", justBeforeExpiry).status, "waiting");

  const atExpiry = new Date(NOW.getTime() + HOLD_DURATION_MS);
  assert.equal(getWaitlistStatus(EVENT_ID, "First student", atExpiry).status, "expired");
  const secondOffer = getWaitlistStatus(EVENT_ID, "Second student", atExpiry);
  assert.equal(secondOffer.status, "offered");
  assert.equal(
    new Date(secondOffer.expiresAt).getTime(),
    atExpiry.getTime() + HOLD_DURATION_MS,
  );
  assert.equal(purchaseTicket(EVENT_ID, "Another student", atExpiry).status, 409);

  assert.equal(claimWaitlistOffer(EVENT_ID, "Second student", atExpiry).claimed, true);
  assert.equal(
    getUpcomingEvents(atExpiry).find((event) => event.id === EVENT_ID).seatsRemaining,
    0,
  );
});
