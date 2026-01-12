import { apiClient } from './client';
import type { User, UserRole, ClaimStatus } from '@poa/shared';

// Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalCompanies: number;
  totalUsers: number;
  totalClaims: number;
  totalVehicles: number;
  totalInsurers: number;
  activeUsers: number;
  claimsByStatus: Record<string, number>;
  recentActivity: {
    newCompaniesThisMonth: number;
    newClaimsThisWeek: number;
    pendingClaims: number;
  };
}

export interface AdminCompany {
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
  createdAt: string;
  updatedAt: string;
  _count: {
    users: number;
    vehicles: number;
    claims: number;
  };
}

export interface AdminCompanyDetails extends AdminCompany {
  users: User[];
}

export interface AdminUser extends User {
  company: {
    id: string;
    name: string;
  } | null;
}

export interface AdminClaim {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  accidentDate: string;
  damageCategory: string;
  description: string | null;
  estimatedCost: number | null;
  finalCost: number | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
  };
  vehicle: {
    id: string;
    licensePlate: string;
    brand: string | null;
    model: string | null;
  };
  reporterUser: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Insurer {
  id: string;
  name: string;
  claimsEmail: string;
  contactPhone: string | null;
  website: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInsurerDto {
  name: string;
  claimsEmail: string;
  contactPhone?: string;
  website?: string;
  logoUrl?: string;
  isActive?: boolean;
}

export interface UpdateInsurerDto {
  name?: string;
  claimsEmail?: string;
  contactPhone?: string;
  website?: string;
  logoUrl?: string;
  isActive?: boolean;
}

// Filter types
export interface AdminCompanyFilters {
  search?: string;
  page?: number;
  limit?: number;
  orderBy?: 'name' | 'createdAt' | 'numVehicles' | 'numEmployees';
  orderDir?: 'asc' | 'desc';
}

export interface AdminUserFilters {
  search?: string;
  companyId?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface AdminClaimFilters {
  search?: string;
  companyId?: string;
  status?: ClaimStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface AdminInsurerFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// Admin API functions

// Stats
export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

// Companies
export const getAdminCompanies = async (
  filters: AdminCompanyFilters = {}
): Promise<PaginatedResponse<AdminCompany>> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.orderBy) params.append('orderBy', filters.orderBy);
  if (filters.orderDir) params.append('orderDir', filters.orderDir);

  const response = await apiClient.get(`/admin/companies?${params.toString()}`);
  return response.data;
};

export const getAdminCompanyById = async (id: string): Promise<AdminCompanyDetails> => {
  const response = await apiClient.get(`/admin/companies/${id}`);
  return response.data;
};

// Users
export const getAdminUsers = async (
  filters: AdminUserFilters = {}
): Promise<PaginatedResponse<AdminUser>> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.companyId) params.append('companyId', filters.companyId);
  if (filters.role) params.append('role', filters.role);
  if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await apiClient.get(`/admin/users?${params.toString()}`);
  return response.data;
};

export const getAdminUserById = async (id: string): Promise<AdminUser> => {
  const response = await apiClient.get(`/admin/users/${id}`);
  return response.data;
};

export const activateUser = async (id: string): Promise<User> => {
  const response = await apiClient.patch(`/admin/users/${id}/activate`);
  return response.data;
};

export const deactivateUser = async (id: string): Promise<User> => {
  const response = await apiClient.patch(`/admin/users/${id}/deactivate`);
  return response.data;
};

// Claims
export const getAdminClaims = async (
  filters: AdminClaimFilters = {}
): Promise<PaginatedResponse<AdminClaim>> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.companyId) params.append('companyId', filters.companyId);
  if (filters.status) params.append('status', filters.status);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await apiClient.get(`/admin/claims?${params.toString()}`);
  return response.data;
};

export const getAdminClaimById = async (id: string): Promise<AdminClaim> => {
  const response = await apiClient.get(`/admin/claims/${id}`);
  return response.data;
};

// Insurers
export const getAdminInsurers = async (
  filters: AdminInsurerFilters = {}
): Promise<PaginatedResponse<Insurer>> => {
  const params = new URLSearchParams();
  if (filters.search) params.append('search', filters.search);
  if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await apiClient.get(`/admin/insurers?${params.toString()}`);
  return response.data;
};

export const getAdminInsurerById = async (id: string): Promise<Insurer> => {
  const response = await apiClient.get(`/admin/insurers/${id}`);
  return response.data;
};

export const createInsurer = async (data: CreateInsurerDto): Promise<Insurer> => {
  const response = await apiClient.post('/admin/insurers', data);
  return response.data;
};

export const updateInsurer = async (id: string, data: UpdateInsurerDto): Promise<Insurer> => {
  const response = await apiClient.patch(`/admin/insurers/${id}`, data);
  return response.data;
};

export const deleteInsurer = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/insurers/${id}`);
};
