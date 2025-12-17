import { apiClient } from './client';
import type { Company } from '@poa/shared';

// Types
export interface CompanyStats {
  totalClaims: number;
  totalVehicles: number;
  totalUsers: number;
  claimsByStatus: Record<string, number>;
}

export interface UpdateCompanyInput {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  website?: string;
}

// Company API functions
export const companiesApi = {
  async getCurrent(): Promise<Company> {
    const response = await apiClient.get<Company>('/companies/current');
    return response.data;
  },

  async getStats(): Promise<CompanyStats> {
    const response = await apiClient.get<CompanyStats>('/companies/current/stats');
    return response.data;
  },

  async update(data: UpdateCompanyInput): Promise<Company> {
    const response = await apiClient.patch<Company>('/companies/current', data);
    return response.data;
  },
};
