import { UserRole, AccountStatus, User } from '@/types/auth';

export const isApproved = (user: User | null): boolean => {
  if (!user) return false;
  return user.accountStatus === AccountStatus.ACTIVE;
};

export const hasRole = (user: User | null, roles: UserRole[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

export const canAccessAdmin = (user: User | null): boolean => {
  return hasRole(user, [UserRole.ADMIN]) && isApproved(user);
};
