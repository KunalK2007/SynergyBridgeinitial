export enum UserRole {
  STUDENT = 'STUDENT',
  MENTOR = 'MENTOR',
  INDUSTRY = 'INDUSTRY',
  GOVERNMENT = 'GOVERNMENT',
  FACULTY = 'FACULTY',
  INCUBATION = 'INCUBATION',
  ADMIN = 'ADMIN'
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED'
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  institutionId?: string;
  profileCompleted: boolean;
  isInstitutionVerified?: boolean;
  reputationScore?: number;
  createdAt: number;
  updatedAt: number;
}
