import {
  addToWaitlist,
  getWaitlistStatus,
} from "../../../src/lib/events.mjs";
import { authorizeDemoRequest } from "../../../src/lib/authorization.mjs";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const name = searchParams.get("name");
  const authorization = authorizeDemoRequest({
    actorName: name,
    requiredRole: "student",
    eventId,
  });
  if (!authorization.authorized) {
    return Response.json({ error: authorization.error }, { status: authorization.status });
  }

  const result = getWaitlistStatus(
    eventId,
    name,
  );
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result);
}

export async function POST(request) {
  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Send a valid JSON request." }, { status: 400 });
  }

  const authorization = authorizeDemoRequest({
    actorName: input?.name,
    requiredRole: "student",
    eventId: input?.eventId,
  });
  if (!authorization.authorized) {
    return Response.json({ error: authorization.error }, { status: authorization.status });
  }

  const result = addToWaitlist(input?.eventId, input?.name);
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result, { status: 201 });
}
