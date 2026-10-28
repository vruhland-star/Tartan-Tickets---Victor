# Tartan Tickets demo

This demo implements event browsing (Story 1) and a simulated waitlist seat offer (Story 4).

## Run locally

Start the app with `npm run dev`, then open http://localhost:3000.

## Try Story 4

1. On **Autumn Jazz on the Cut**, click **Join waitlist**.
2. Type your name and click **Join waitlist**.
3. Close the dialog, then click **Demo: simulate a released seat**.
4. Keep the page open. The next waitlisted person sees an in-app offer, checked every few seconds, with a 30-minute hold.
5. Click **Claim held seat · Simulated payment** to claim it.

The demo uses names typed into a text box instead of real sign-in. It does not
process real payments, send email or use a database. Event, purchase, and
waitlist data are held in server memory and reset when the server restarts or
the app is redeployed.

## Security spec audit

Compared with [the security specification](./Docs/Starter%20Spec%20A%20-%20Tartan%20Tickets%20-%20SECURITY_SPEC.md), the current demo:

| Requirement | Status | Why |
|---|---|---|
| SEC-1 | Not at all | There is no CMU SSO or authentication; users type a name. |
| SEC-2 | Not at all | The app has no sign-in sessions or idle-expiration behavior. |
| SEC-3 | Partly | HTTPS/HSTS enforcement is not configured in the app; local development runs over HTTP. |
| SEC-4 | Partly | API handlers resolve demo roles and check officer club membership on the server, ignoring browser-supplied role claims; typed names are not authenticated, so identities (including the demo officer) can be impersonated. |
| SEC-5 | Not at all | Club-scoped access checks and denied-access logging are not implemented. |
| SEC-6 | Not at all | There are no ticket lookup routes or per-student access controls. |
| SEC-7 | Not at all | Purchases are simulated; Stripe Checkout is not integrated. |
| SEC-8 | Partly | The server selects the event and price from its own event data, but does not charge money or accept a ticket quantity. |
| SEC-9 | Not at all | There is no Stripe webhook endpoint, signature verification, or rejection log. |
| SEC-10 | Not at all | Stripe events are not processed, so webhook idempotency is not implemented. |
| SEC-11 | Partly | No Stripe keys are used or stored, but secrets-manager and production-key controls are absent. |
| SEC-12 | Not at all | Connected Stripe accounts and two-person approval are not implemented. |
| SEC-13 | Not at all | The app does not generate QR tickets or random ticket tokens. |
| SEC-14 | Not at all | Ticket scanning and duplicate-scan protection are not implemented. |
| SEC-15 | Not at all | Invalid-scan rate limiting and officer notifications are not implemented. |
| SEC-16 | Not at all | Checkout hoarding limits are not implemented. |
| SEC-17 | Partly | Orders store a typed name and event/order identifiers; Andrew email, ticket status, and Stripe payment ID are absent, and there is no defined minimal purchase schema. |
| SEC-18 | Not at all | Attendee data is not anonymized after an event. |
| SEC-19 | Not at all | Officer-only attendee exports and export logging are not implemented. |
| SEC-20 | Fully | Event titles and descriptions render as React text, which escapes markup rather than executing it. |
| SEC-21 | Not at all | Audit logging for sensitive actions is not implemented. |
| SEC-22 | Not at all | There is no append-only, admin-restricted, one-year audit log. |
