import { describe, it, expect } from 'vitest';
import { getRolePrefix } from '../utils/rolePath';

describe('getRolePrefix utility', () => {
  it('maps admin and super admin to /admin (case-insensitive and trimmed)', () => {
    expect(getRolePrefix('admin')).toBe('/admin');
    expect(getRolePrefix('Admin')).toBe('/admin');
    expect(getRolePrefix('ADMIN')).toBe('/admin');
    expect(getRolePrefix('super admin')).toBe('/admin');
    expect(getRolePrefix('Super Admin')).toBe('/admin');
    expect(getRolePrefix('  SUPER ADMIN  ')).toBe('/admin');
  });

  it('maps procurement to /procurement (case-insensitive and trimmed)', () => {
    expect(getRolePrefix('procurement')).toBe('/procurement');
    expect(getRolePrefix('Procurement')).toBe('/procurement');
    expect(getRolePrefix(' PROCUREMENT ')).toBe('/procurement');
  });

  it('maps cecom to /cecom (case-insensitive and trimmed)', () => {
    expect(getRolePrefix('cecom')).toBe('/cecom');
    expect(getRolePrefix('CECOM')).toBe('/cecom');
    expect(getRolePrefix(' cecom ')).toBe('/cecom');
  });

  it('maps clerk to /clerk (case-insensitive and trimmed)', () => {
    expect(getRolePrefix('clerk')).toBe('/clerk');
    expect(getRolePrefix('Clerk')).toBe('/clerk');
    expect(getRolePrefix(' CLERK ')).toBe('/clerk');
  });

  it('defaults to /admin for unknown roles, undefined, or empty strings', () => {
    expect(getRolePrefix(undefined)).toBe('/admin');
    expect(getRolePrefix('')).toBe('/admin');
    expect(getRolePrefix('   ')).toBe('/admin');
    expect(getRolePrefix('guest')).toBe('/admin');
    expect(getRolePrefix('unknown_role')).toBe('/admin');
  });
});
