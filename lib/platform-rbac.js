// SafarOS — PLATFORM-LEVEL RBAC.
// This is a SEPARATE authorization concept from agency RBAC (lib/rbac.js).
// Platform roles govern the SafarOS platform itself and are NOT part of the
// agency Owner/Manager/Agent/Finance hierarchy. Platform staff live in the
// `platformAdmins` collection and authenticate via a separate session cookie.
// Deny-by-default: unknown permissions are allowed for super_admin only.

export const PLATFORM_ROLES = ['super_admin', 'platform_admin', 'support_admin', 'finance_admin', 'blog_editor'];
// Roles the Super Admin may assign to staff. super_admin is NEVER assignable (single Super Admin).
export const ASSIGNABLE_STAFF_ROLES = ['platform_admin', 'support_admin', 'finance_admin', 'blog_editor'];
export const PLATFORM_ROLE_LABELS = {
  super_admin: 'Super Admin', platform_admin: 'Platform Admin', support_admin: 'Support Admin',
  finance_admin: 'Finance Admin', blog_editor: 'Blog Editor',
};

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
  'integrations:manage':    ['super_admin'],
  'analytics:read':         ['super_admin', 'platform_admin', 'finance_admin'],
  'audit:read':             ['super_admin', 'platform_admin'],
  'settings:read':          ['super_admin', 'platform_admin'],
  'settings:manage':        ['super_admin'],
  'themes:manage':          ['super_admin'],
  'staff:manage':           ['super_admin'],
  'blog:manage':            ['super_admin', 'platform_admin', 'blog_editor'],
};

export function canPlatform(role, permission) {
  if (!PLATFORM_ROLES.includes(role)) return false;
  const allowed = PLATFORM_PERMISSIONS[permission];
  if (!allowed) return role === 'super_admin'; // unknown perm → super_admin only
  return allowed.includes(role);
}

export function platformPermissionsFor(role) {
  return Object.keys(PLATFORM_PERMISSIONS).filter((p) => canPlatform(role, p));
}

export function isValidPlatformRole(role) {
  return PLATFORM_ROLES.includes(role);
}
