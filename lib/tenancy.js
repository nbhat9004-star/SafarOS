// SafarOS — Multi-tenant scoping helpers (REBUILD).
// GOLDEN RULE: agencyId is ALWAYS taken from the server-verified session,
// NEVER from client input. These helpers make that the path of least resistance.

// Build a Mongo filter guaranteed to be scoped to the session's agency.
export function tenantFilter(session, extra = {}) {
  if (!session || !session.agencyId) {
    throw new Error('tenantFilter: missing agency context');
  }
  // Spread extra first, then force agencyId so it can never be overridden by caller.
  return { ...extra, agencyId: session.agencyId };
}

// Stamp a document with the session's agencyId, stripping any client-supplied one.
export function withAgency(session, doc = {}) {
  if (!session || !session.agencyId) {
    throw new Error('withAgency: missing agency context');
  }
  const clean = { ...doc };
  delete clean.agencyId; // defense-in-depth: drop anything the client sent
  return { ...clean, agencyId: session.agencyId };
}
