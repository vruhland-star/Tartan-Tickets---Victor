import { getUpcomingEvents } from "../../../src/lib/events.mjs";
import { authorizeDemoRequest } from "../../../src/lib/authorization.mjs";

export const runtime = "nodejs";

export async function GET() {
  const authorization = authorizeDemoRequest({ requiredRole: "public" });
  if (!authorization.authorized) {
    return Response.json({ error: authorization.error }, { status: authorization.status });
  }
  return Response.json(getUpcomingEvents());
}
