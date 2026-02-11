import { apiClient } from './client';
import type { Company, DamageCategory } from '@poa/shared';

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

// Timeline Stats Types
export interface TimelineDataPoint {
  period: string;
  claimCount: number;
  totalEstimatedCost: number;
  totalFinalCost: number;
}

export interface TimelineStats {
  data: TimelineDataPoint[];
}

// Vehicle Stats Types
export interface VehicleStatsItem {
  vehicleId: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
  claimCount: number;
  totalCost: number;
}

// Driver Stats Types
export interface DriverStatsItem {
  userId: string;
  firstName: string;
  lastName: string;
  claimCount: number;
  totalCost: number;
}

// Category Stats Types
export interface CategoryStatsItem {
  category: DamageCategory;
  claimCount: number;
  totalCost: number;
  percentage: number;
}

// Quota Stats Types
export interface QuotaMonthlyData {
  month: string;
  claimCost: number;
  claimCount: number;
}

export interface QuotaStats {
  totalPremium: number;
  totalClaimCost: number;
  quotaRatio: number;
  quotaThreshold: number | null;
  isOverThreshold: boolean;
  monthlyData: QuotaMonthlyData[];
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

  async getStatsTimeline(
    period: 'week' | 'month' = 'month',
    range: number = 12
  ): Promise<TimelineStats> {
    const response = await apiClient.get<TimelineStats>(
      `/companies/current/stats/timeline`,
      { params: { period, range } }
    );
    return response.data;
  },

  async getStatsByVehicle(limit: number = 10): Promise<VehicleStatsItem[]> {
    const response = await apiClient.get<VehicleStatsItem[]>(
      `/companies/current/stats/by-vehicle`,
      { params: { limit } }
    );
    return response.data;
  },

  async getStatsByDriver(limit: number = 10): Promise<DriverStatsItem[]> {
    const response = await apiClient.get<DriverStatsItem[]>(
      `/companies/current/stats/by-driver`,
      { params: { limit } }
    );
    return response.data;
  },

  async getStatsByCategory(): Promise<CategoryStatsItem[]> {
    const response = await apiClient.get<CategoryStatsItem[]>(
      `/companies/current/stats/by-category`
    );
    return response.data;
  },

  async getQuotaStats(year?: number): Promise<QuotaStats> {
    const params = year ? { year } : {};
    const response = await apiClient.get<QuotaStats>(
      `/companies/current/stats/quota`,
      { params }
    );
    return response.data;
  },

  async update(data: UpdateCompanyInput): Promise<Company> {
    const response = await apiClient.patch<Company>('/companies/current', data);
    return response.data;
  },

  async uploadLogo(file: File): Promise<Company> {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await apiClient.post<Company>('/companies/current/logo', formData);
    return response.data;
  },

  async deleteLogo(): Promise<Company> {
    const response = await apiClient.delete<Company>('/companies/current/logo');
    return response.data;
  },
};
