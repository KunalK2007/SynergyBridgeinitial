import { describe, it, expect } from 'vitest';
import { isApproved, hasRole, canAccessAdmin } from '../lib/auth/helpers';
import { UserRole, AccountStatus, User } from '../types/auth';

describe('Auth Helpers', () => {
  const baseUser: User = {
    uid: '123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: UserRole.STUDENT,
    accountStatus: AccountStatus.ACTIVE,
    profileCompleted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  it('isApproved should return true for active accounts', () => {
    expect(isApproved(baseUser)).toBe(true);
  });

  it('isApproved should return false for pending accounts', () => {
    const pendingUser = { ...baseUser, accountStatus: AccountStatus.PENDING };
    expect(isApproved(pendingUser)).toBe(false);
  });

  it('hasRole should return true if user has the specified role', () => {
    expect(hasRole(baseUser, [UserRole.STUDENT, UserRole.MENTOR])).toBe(true);
  });

  it('hasRole should return false if user does not have the specified role', () => {
    expect(hasRole(baseUser, [UserRole.INDUSTRY, UserRole.GOVERNMENT])).toBe(false);
  });

  it('canAccessAdmin should return true only for active admins', () => {
    const adminUser = { ...baseUser, role: UserRole.ADMIN };
    expect(canAccessAdmin(adminUser)).toBe(true);

    const pendingAdmin = { ...adminUser, accountStatus: AccountStatus.PENDING };
    expect(canAccessAdmin(pendingAdmin)).toBe(false);

    expect(canAccessAdmin(baseUser)).toBe(false);
  });
});
