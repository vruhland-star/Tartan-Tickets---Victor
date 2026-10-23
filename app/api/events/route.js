import { getUpcomingEvents } from "../../../src/lib/events.mjs";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(getUpcomingEvents());
}
