import { getEventClubId } from "./events.mjs";

const DEMO_OFFICER_NAME = "demo club officer";
const demoOfficer = {
  id: "demo-club-officer",
  role: "officer",
  clubIds: ["jazz-collective"],
};

function resolveDemoActor(actorName) {
  if (typeof actorName !== "string" || !actorName.trim()) return null;

  if (actorName.trim().toLowerCase() === DEMO_OFFICER_NAME) {
    return demoOfficer;
  }

  return {
    id: `student:${actorName.trim().toLowerCase()}`,
    role: "student",
    clubIds: [],
  };
}

export function authorizeDemoRequest({ actorName, requiredRole, eventId } = {}) {
  if (requiredRole === "public") {
    return { authorized: true, actor: { id: "public", role: "public", clubIds: [] } };
  }

  const actor = resolveDemoActor(actorName);
  if (!actor) {
    return { authorized: false, error: "Enter your name to continue.", status: 401 };
  }
  if (actor.role !== requiredRole) {
    return { authorized: false, error: "You are not allowed to perform this action.", status: 403 };
  }

  if (eventId) {
    const clubId = getEventClubId(eventId);
    if (!clubId) {
      return { authorized: false, error: "Event not found.", status: 404 };
    }
    if (actor.role === "officer" && !actor.clubIds.includes(clubId)) {
      return { authorized: false, error: "You are not allowed to perform this action.", status: 403 };
    }
  }

  return { authorized: true, actor };
}
