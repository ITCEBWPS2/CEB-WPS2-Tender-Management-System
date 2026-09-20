import { useAuth } from '../context/AuthContext';

/**
 * Returns the URL path prefix corresponding to a user role.
 * Mapping (case-insensitive, trimmed):
 * - 'admin' and 'super admin' -> '/admin'
 * - 'procurement' -> '/procurement'
 * - 'cecom' -> '/cecom'
 * - 'clerk' -> '/clerk'
 * - default -> '/admin'
 */
export function getRolePrefix(role?: string): string {
  if (!role) return '/admin';
  const normalized = role.trim().toLowerCase();
  if (normalized === 'admin' || normalized === 'super admin') {
    return '/admin';
  }
  if (normalized === 'procurement') {
    return '/procurement';
  }
  if (normalized === 'cecom') {
    return '/cecom';
  }
  if (normalized === 'clerk') {
    return '/clerk';
  }
  return '/admin';
}

/**
 * React hook that returns the active user's role prefix and a helper function
 * to prefix any sub-path with the user's role.
 */
export function useRolePath() {
  const { user } = useAuth();
  const prefix = getRolePrefix(user?.role);

  const path = (sub: string): string => {
    if (!sub) return prefix;
    const cleanSub = sub.startsWith('/') ? sub : `/${sub}`;
    return `${prefix}${cleanSub}`;
  };

  return { prefix, path };
}
