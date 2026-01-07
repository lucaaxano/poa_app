// User Types

export enum UserRole {
  EMPLOYEE = 'EMPLOYEE',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  BROKER = 'BROKER',
  SUPERADMIN = 'SUPERADMIN',
}

export interface User {
  id: string;
  companyId: string | null;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string | null;
  position: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithCompany extends User {
  company: Company | null;
}

export interface Company {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  website: string | null;
  logoUrl: string | null;
  numEmployees: number | null;
  numVehicles: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
  phone?: string;
  position?: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  avatarUrl?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  numVehicles?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
