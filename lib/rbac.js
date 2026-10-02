// SafarOS — RBAC (REBUILD). Agency-oriented roles, not consumer roles.
export const ROLES = ['owner', 'manager', 'agent', 'finance'];

// action -> roles allowed
const MATRIX = {
  'agency:manage':   ['owner'],
  'members:invite':  ['owner', 'manager'],
  'members:read':    ['owner', 'manager', 'agent', 'finance'],
  'clients:create':  ['owner', 'manager', 'agent'],
  'clients:read':    ['owner', 'manager', 'agent', 'finance'],
  'clients:update':  ['owner', 'manager', 'agent'],
  'clients:delete':  ['owner', 'manager'],

  // CRM workspace (same shape as clients: read=all, create/update=owner/manager/agent, delete=owner/manager)
  'crm:read':         ['owner', 'manager', 'agent', 'finance'],
  'leads:read':       ['owner', 'manager', 'agent', 'finance'],
  'leads:create':     ['owner', 'manager', 'agent'],
  'leads:update':     ['owner', 'manager', 'agent'],
  'leads:delete':     ['owner', 'manager'],
  'followups:read':   ['owner', 'manager', 'agent', 'finance'],
  'followups:create': ['owner', 'manager', 'agent'],
  'followups:update': ['owner', 'manager', 'agent'],
  'followups:delete': ['owner', 'manager'],
  'tasks:read':       ['owner', 'manager', 'agent', 'finance'],
  'tasks:create':     ['owner', 'manager', 'agent'],
  'tasks:update':     ['owner', 'manager', 'agent'],
  'tasks:delete':     ['owner', 'manager'],
  'activities:read':  ['owner', 'manager', 'agent', 'finance'],

  'quotations:read':   ['owner', 'manager', 'agent', 'finance'],
  'quotations:create': ['owner', 'manager', 'agent'],
  'quotations:update': ['owner', 'manager', 'agent'],
  'quotations:delete': ['owner', 'manager'],

  'packages:read':     ['owner', 'manager', 'agent', 'finance'],
  'packages:create':   ['owner', 'manager', 'agent'],
  'packages:update':   ['owner', 'manager', 'agent'],
  'packages:delete':   ['owner', 'manager'],
  'itineraries:read':   ['owner', 'manager', 'agent', 'finance'],
  'itineraries:create': ['owner', 'manager', 'agent'],
  'itineraries:update': ['owner', 'manager', 'agent'],
  'itineraries:delete': ['owner', 'manager'],

  'suppliers:read':   ['owner', 'manager', 'agent', 'finance'],
  'suppliers:create': ['owner', 'manager', 'agent'],
  'suppliers:update': ['owner', 'manager', 'agent'],
  'suppliers:delete': ['owner', 'manager'],

  'bookings:read':   ['owner', 'manager', 'agent', 'finance'],
  'bookings:create': ['owner', 'manager', 'agent'],
  'bookings:update': ['owner', 'manager', 'agent'],
  'bookings:delete': ['owner', 'manager'],

  'fleet:read':   ['owner', 'manager', 'agent', 'finance'],
  'fleet:create': ['owner', 'manager', 'agent'],
  'fleet:update': ['owner', 'manager', 'agent'],
  'fleet:manage': ['owner', 'manager'],

  'finance:read':   ['owner', 'manager', 'finance'],
  'finance:create': ['owner', 'manager', 'finance'],
  'finance:update': ['owner', 'manager', 'finance'],
  'finance:manage': ['owner'],
};

export function can(role, action) {
  const allowed = MATRIX[action];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function isValidRole(role) {
  return ROLES.includes(role);
}
