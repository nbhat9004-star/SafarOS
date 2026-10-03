// SafarOS — PLATFORM-LEVEL RBAC (Final Stage 1).
// This is a SEPARATE authorization concept from agency RBAC (lib/rbac.js).
// Platform roles govern the SafarOS platform itself and are NOT part of the
// agency Owner/Manager/Agent/Finance hierarchy. Platform admins live in the
// `platformAdmins` collection and authenticate via a separate session cookie.

// Current + future platform roles. Only super_admin is active this phase.
export const PLATFORM_ROLES = ['super_admin', 'platform_admin', 'support_admin', 'finance_admin'];

// Granular platform permissions mapped to roles. super_admin has everything.
// Future roles are listed for architecture only and intentionally NOT overbuilt.
const PLATFORM_PERMISSIONS = {
  'platform:dashboard':     ['super_admin', 'platform_admin', 'support_admin', 'finance_admin'],
  'agencies:read':          ['super_admin', 'platform_admin', 'support_admin'],
  'agencies:manage':        ['super_admin', 'platform_admin'],
  'agencies:delete':        ['super_admin'],
  'users:read':             ['super_admin', 'platform_admin', 'support_admin'],
  'users:manage':           ['super_admin', 'platform_admin'],
  'subscriptions:read':     ['super_admin', 'platform_admin', 'finance_admin'],
  'subscriptions:manage':   ['super_admin', 'finance_admin'],
  'plans:read':             ['super_admin', 'platform_admin', 'finance_admin'],
  'plans:manage':           ['super_admin'],
  'ai:read':                ['super_admin', 'platform_admin'],
  'ai:manage':              ['super_admin'],
  'integrations:read':      ['super_admin', 'platform_admin'],
  'analytics:read':         ['super_admin', 'platform_admin', 'finance_admin'],
  'audit:read':             ['super_admin', 'platform_admin'],
  'settings:read':          ['super_admin', 'platform_admin'],
  'settings:manage':        ['super_admin'],
};

export function canPlatform(role, permission) {
  const allowed = PLATFORM_PERMISSIONS[permission];
  if (!allowed) return role === 'super_admin'; // unknown perm → super_admin only
  return allowed.includes(role);
}

export function isValidPlatformRole(role) {
  return PLATFORM_ROLES.includes(role);
}
