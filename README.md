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
