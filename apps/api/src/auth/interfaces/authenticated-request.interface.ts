import { Request } from 'express';
import { UserRole } from '@poa/database';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  companyId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
