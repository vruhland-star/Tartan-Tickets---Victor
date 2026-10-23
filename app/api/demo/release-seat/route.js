import { releaseEventSeat } from "../../../../src/lib/events.mjs";

export const runtime = "nodejs";

export async function POST(request) {
  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Send a valid JSON request." }, { status: 400 });
  }

  const result = releaseEventSeat(input?.eventId);
  if (result.error) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json(result);
}
