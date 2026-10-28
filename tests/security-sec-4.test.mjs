import test from "node:test";
import assert from "node:assert/strict";
import { GET as getEvents } from "../app/api/events/route.js";
import { POST as postOrder } from "../app/api/orders/route.js";
import {
  GET as getWaitlist,
  POST as postWaitlist,
} from "../app/api/waitlist/route.js";
import { POST as claimWaitlist } from "../app/api/waitlist/claim/route.js";
import { POST as releaseSeat } from "../app/api/demo/release-seat/route.js";

function jsonRequest(url, body) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("The server checks roles and club membership before every protected request.", async () => {
  assert.equal((await getEvents()).status, 200, "public event browsing remains available");

  const orderResponse = await postOrder(
    jsonRequest("http://localhost/api/orders", {
      eventId: "makers-night",
      name: "Security test student",
      role: "officer",
      clubId: "untrusted-browser-club",
    }),
  );
  assert.equal(orderResponse.status, 201, "the server treats the typed name as a student");

  const waitlistResponse = await postWaitlist(
    jsonRequest("http://localhost/api/waitlist", {
      eventId: "autumn-jazz",
      name: "Security test waitlist student",
      role: "officer",
    }),
  );
  assert.equal(waitlistResponse.status, 201);

  const waitlistStatusResponse = await getWaitlist(
    new Request(
      "http://localhost/api/waitlist?eventId=autumn-jazz&name=Security%20test%20waitlist%20student&role=officer",
    ),
  );
  assert.equal(waitlistStatusResponse.status, 200);

  const claimResponse = await claimWaitlist(
    jsonRequest("http://localhost/api/waitlist/claim", {
      eventId: "autumn-jazz",
      name: "Security test waitlist student",
      role: "officer",
    }),
  );
  assert.equal(claimResponse.status, 409, "student is authorized, but has no active seat offer");

  const studentReleaseResponse = await releaseSeat(
    jsonRequest("http://localhost/api/demo/release-seat", {
      eventId: "autumn-jazz",
      actorName: "Security test student",
      role: "officer",
      clubId: "jazz-collective",
    }),
  );
  assert.equal(studentReleaseResponse.status, 403, "browser-supplied role and club are ignored");

  const authorizedOfficerResponse = await releaseSeat(
    jsonRequest("http://localhost/api/demo/release-seat", {
      eventId: "autumn-jazz",
      actorName: "Demo Club Officer",
    }),
  );
  assert.equal(authorizedOfficerResponse.status, 200);

  const otherClubResponse = await releaseSeat(
    jsonRequest("http://localhost/api/demo/release-seat", {
      eventId: "winter-market",
      actorName: "Demo Club Officer",
    }),
  );
  assert.equal(otherClubResponse.status, 403, "officer is denied access to another club's event");
});
