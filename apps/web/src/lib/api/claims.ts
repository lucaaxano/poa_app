import { apiClient } from './client';
import type {
  Claim,
  ClaimWithRelations,
  ClaimStatus,
  DamageCategory,
  ClaimEvent,
  ClaimComment,
  ClaimAttachment,
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

// Paginated Response Type
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
    if (filters?.limit) params.append('pageSize', filters.limit.toString());

    const response = await apiClient.get<PaginatedResponse<ClaimListItem>>('/claims', { params });
    return response.data.data;
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
    const response = await apiClient.post<Claim>(`/claims/${id}/reject`, { rejectionReason: reason });
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

  // Attachment functions
  async getAttachments(id: string): Promise<ClaimAttachment[]> {
    const response = await apiClient.get<ClaimAttachment[]>(`/claims/${id}/attachments`);
    return response.data;
  },

  async uploadAttachment(id: string, file: File): Promise<ClaimAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ClaimAttachment>(`/claims/${id}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteAttachment(claimId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/claims/${claimId}/attachments/${attachmentId}`);
  },

  async exportClaims(
    format: 'csv' | 'xlsx' = 'xlsx',
    filters?: {
      status?: ClaimStatus[];
      dateFrom?: string;
      dateTo?: string;
      vehicleId?: string;
      damageCategory?: DamageCategory;
    }
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    if (filters?.status?.length) {
      params.append('status', filters.status.join(','));
    }
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters?.damageCategory) params.append('damageCategory', filters.damageCategory);

    const response = await apiClient.get('/claims/export', {
      params,
      responseType: 'blob',
    });

    // Ensure correct MIME type for the blob
    const mimeType = format === 'csv'
      ? 'text/csv;charset=utf-8'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    return new Blob([response.data], { type: mimeType });
  },
};
