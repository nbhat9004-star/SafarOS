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
};

export function can(role, action) {
  const allowed = MATRIX[action];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function isValidRole(role) {
  return ROLES.includes(role);
}
