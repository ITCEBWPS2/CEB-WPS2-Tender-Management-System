export const PERMISSIONS = {
  add: ['Admin', 'Super Admin', 'Procurement', 'Clerk'],
  edit: ['Admin', 'Super Admin', 'Procurement', 'Clerk'],
  delete: ['Admin', 'Super Admin'],
  view: ['Admin', 'Super Admin', 'Procurement', 'Clerk', 'CECOM', 'User'],
} as const;

export type PermissionAction = keyof typeof PERMISSIONS;

export function can(action: PermissionAction, role: string | null | undefined): boolean {
  if (!role) return false;
  const cleanRole = role.trim().toLowerCase();

  const allowedRoles = PERMISSIONS[action] as readonly string[];
  const normalizedAllowed = allowedRoles.map(r => r.trim().toLowerCase());

  // Direct match
  if (normalizedAllowed.includes(cleanRole)) {
    return true;
  }

  // Handle aliases / role equivalence
  if (cleanRole === 'super admin' && normalizedAllowed.includes('admin')) {
    return true;
  }
  if (cleanRole === 'commercial user' && normalizedAllowed.includes('clerk')) {
    return true;
  }
  if (cleanRole === 'c.com user' && normalizedAllowed.includes('cecom')) {
    return true;
  }

  return false;
}
