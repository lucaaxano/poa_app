import { apiClient } from './client';
import type {
  Claim,
  ClaimWithRelations,
  ClaimStatus,
  DamageCategory,
  ClaimEvent,
  ClaimComment,
  CreateClaimInput,
  UpdateClaimInput
} from '@poa/shared';

// Types
export interface ClaimListItem {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  accidentDate: string;
  damageCategory: DamageCategory;
  description: string | null;
  estimatedCost: number | null;
  finalCost: number | null;
  createdAt: string;
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

export interface ClaimDetail extends ClaimWithRelations {
  events: ClaimEvent[];
  comments: ClaimComment[];
}

export interface ClaimFilters {
  status?: ClaimStatus[];
  vehicleId?: string;
  driverUserId?: string;
  damageCategory?: DamageCategory[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
}

// Claims API functions
export const claimsApi = {
  async getAll(filters?: ClaimFilters): Promise<ClaimListItem[]> {
    const params = new URLSearchParams();
    if (filters?.status?.length) {
      filters.status.forEach(s => params.append('status', s));
    }
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters?.driverUserId) params.append('driverUserId', filters.driverUserId);
    if (filters?.damageCategory?.length) {
      filters.damageCategory.forEach(d => params.append('damageCategory', d));
    }
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ClaimListItem[]>('/claims', { params });
    return response.data;
  },

  async getRecent(limit: number = 5): Promise<ClaimListItem[]> {
    return this.getAll({ limit });
  },

  async getById(id: string): Promise<ClaimDetail> {
    const response = await apiClient.get<ClaimDetail>(`/claims/${id}`);
    return response.data;
  },

  async create(data: CreateClaimInput): Promise<Claim> {
    const response = await apiClient.post<Claim>('/claims', data);
    return response.data;
  },

  async update(id: string, data: UpdateClaimInput): Promise<Claim> {
    const response = await apiClient.patch<Claim>(`/claims/${id}`, data);
    return response.data;
  },

  async submit(id: string): Promise<Claim> {
    const response = await apiClient.post<Claim>(`/claims/${id}/submit`);
    return response.data;
  },

  async approve(id: string): Promise<Claim> {
    const response = await apiClient.post<Claim>(`/claims/${id}/approve`);
    return response.data;
  },

  async reject(id: string, reason: string): Promise<Claim> {
    const response = await apiClient.post<Claim>(`/claims/${id}/reject`, { reason });
    return response.data;
  },

  async send(id: string): Promise<Claim> {
    const response = await apiClient.post<Claim>(`/claims/${id}/send`);
    return response.data;
  },

  async addComment(id: string, content: string): Promise<ClaimComment> {
    const response = await apiClient.post<ClaimComment>(`/claims/${id}/comments`, { content });
    return response.data;
  },

  async getComments(id: string): Promise<ClaimComment[]> {
    const response = await apiClient.get<ClaimComment[]>(`/claims/${id}/comments`);
    return response.data;
  },

  async getEvents(id: string): Promise<ClaimEvent[]> {
    const response = await apiClient.get<ClaimEvent[]>(`/claims/${id}/events`);
    return response.data;
  },
};
