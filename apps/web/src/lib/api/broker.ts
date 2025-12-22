import { apiClient } from './client';
import type { BrokerCompany } from '@/stores/auth-store';
import type { ClaimStatus } from '@poa/shared';

// Response types
export interface BrokerAggregatedStats {
  totalCompanies: number;
  totalClaims: number;
  totalVehicles: number;
  totalUsers: number;
  claimsByStatus: Record<string, number>;
  claimsByCompany: Array<{
    companyId: string;
    companyName: string;
    claimCount: number;
    pendingCount: number;
  }>;
}

export interface BrokerCompanyStats {
  totalClaims: number;
  totalVehicles: number;
  totalUsers: number;
  claimsByStatus: Record<string, number>;
}

export interface BrokerClaimListItem {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  accidentDate: string;
  accidentLocation: string | null;
  damageCategory: string;
  estimatedCost: number | null;
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
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface PaginatedBrokerClaims {
  data: BrokerClaimListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Filter type
export interface BrokerClaimFilters {
  companyId?: string;
  status?: ClaimStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// API functions
export const brokerApi = {
  /**
   * Get all companies linked to the broker with stats
   */
  async getLinkedCompanies(): Promise<BrokerCompany[]> {
    const response = await apiClient.get<BrokerCompany[]>('/broker/companies');
    return response.data;
  },

  /**
   * Get aggregated statistics across all linked companies
   */
  async getAggregatedStats(): Promise<BrokerAggregatedStats> {
    const response = await apiClient.get<BrokerAggregatedStats>('/broker/stats');
    return response.data;
  },

  /**
   * Get stats for a specific company
   */
  async getCompanyStats(companyId: string): Promise<BrokerCompanyStats> {
    const response = await apiClient.get<BrokerCompanyStats>(
      `/broker/companies/${companyId}/stats`
    );
    return response.data;
  },

  /**
   * Get claims with optional filters
   */
  async getClaims(filters?: BrokerClaimFilters): Promise<PaginatedBrokerClaims> {
    const params = new URLSearchParams();

    if (filters?.companyId) {
      params.append('companyId', filters.companyId);
    }
    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.search) {
      params.append('search', filters.search);
    }
    if (filters?.page) {
      params.append('page', filters.page.toString());
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString());
    }

    const response = await apiClient.get<PaginatedBrokerClaims>('/broker/claims', {
      params,
    });
    return response.data;
  },
};
