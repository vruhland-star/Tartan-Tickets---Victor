import { releaseEventSeat } from "../../../../src/lib/events.mjs";
import { authorizeDemoRequest } from "../../../../src/lib/authorization.mjs";

export const runtime = "nodejs";

export async function POST(request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Send a valid JSON request." }, { status: 400 });
  }

  const authorization = authorizeDemoRequest({
    actorName: input?.actorName,
    requiredRole: "officer",
    eventId: input?.eventId,
  });
  if (!authorization.authorized) {
    return Response.json({ error: authorization.error }, { status: authorization.status });
  }

  const result = releaseEventSeat(input?.eventId);
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result);
}
