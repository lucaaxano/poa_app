/**
 * Claims API Service
 * Schaden-Endpoints
 */

import { apiClient } from './client';

// Types
export interface ClaimListItem {
  id: string;
  claimNumber: string;
  status: string;
  accidentDate: string;
  accidentLocation: string | null;
  damageCategory: string;
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
}

export interface ClaimDetail extends ClaimListItem {
  accidentTime: string | null;
  gpsLat: number | null;
  gpsLng: number | null;
  damageSubcategory: string | null;
  policeInvolved: boolean;
  policeFileNumber: string | null;
  hasInjuries: boolean;
  injuryDetails: string | null;
  thirdPartyInfo: Record<string, unknown> | null;
  witnessInfo: Array<Record<string, unknown>> | null;
  rejectionReason: string | null;
  sentAt: string | null;
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
  };
  driver: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  attachments: Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }>;
  events: Array<{
    id: string;
    eventType: string;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

export interface CreateClaimInput {
  vehicleId: string;
  accidentDate: string;
  accidentTime?: string;
  accidentLocation?: string;
  gpsLat?: number;
  gpsLng?: number;
  damageCategory: string;
  damageSubcategory?: string;
  description?: string;
  policeInvolved?: boolean;
  policeFileNumber?: string;
  hasInjuries?: boolean;
  injuryDetails?: string;
  thirdPartyInfo?: Record<string, unknown>;
  witnessInfo?: Array<Record<string, unknown>>;
  submitImmediately?: boolean;
}

export interface ClaimFilters {
  status?: string[];
  vehicleId?: string;
  damageCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Alle Schäden abrufen (für Employee: nur eigene)
 */
export const getAll = async (filters?: ClaimFilters): Promise<PaginatedResponse<ClaimListItem>> => {
  const params = new URLSearchParams();

  if (filters?.status && filters.status.length > 0) {
    filters.status.forEach(s => params.append('status', s));
  }
  if (filters?.vehicleId) params.set('vehicleId', filters.vehicleId);
  if (filters?.damageCategory) params.set('damageCategory', filters.damageCategory);
  if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters?.dateTo) params.set('dateTo', filters.dateTo);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const response = await apiClient.get<PaginatedResponse<ClaimListItem>>(
    `/claims?${params.toString()}`
  );
  return response.data;
};

/**
 * Letzte Schäden abrufen
 */
export const getRecent = async (limit = 5): Promise<ClaimListItem[]> => {
  const response = await getAll({ limit, page: 1 });
  return response.data;
};

/**
 * Einzelnen Schaden abrufen
 */
export const getById = async (id: string): Promise<ClaimDetail> => {
  const response = await apiClient.get<ClaimDetail>(`/claims/${id}`);
  return response.data;
};

/**
 * Neuen Schaden erstellen
 */
export const create = async (input: CreateClaimInput): Promise<ClaimDetail> => {
  const response = await apiClient.post<ClaimDetail>('/claims', input);
  return response.data;
};

/**
 * Schaden einreichen (submit)
 */
export const submit = async (id: string): Promise<ClaimDetail> => {
  const response = await apiClient.post<ClaimDetail>(`/claims/${id}/submit`);
  return response.data;
};

/**
 * Kommentar hinzufügen
 */
export const addComment = async (claimId: string, content: string): Promise<void> => {
  await apiClient.post(`/claims/${claimId}/comments`, { content });
};

/**
 * Kommentare abrufen
 */
export const getComments = async (claimId: string): Promise<ClaimDetail['comments']> => {
  const response = await apiClient.get(`/claims/${claimId}/comments`);
  return response.data;
};

/**
 * Datei hochladen
 */
export const uploadAttachment = async (
  claimId: string,
  file: { uri: string; name: string; type: string }
): Promise<ClaimDetail['attachments'][0]> => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const response = await apiClient.post(
    `/claims/${claimId}/attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Attachment löschen
 */
export const deleteAttachment = async (claimId: string, attachmentId: string): Promise<void> => {
  await apiClient.delete(`/claims/${claimId}/attachments/${attachmentId}`);
};

// Export all claims functions
export const claimsApi = {
  getAll,
  getRecent,
  getById,
  create,
  submit,
  addComment,
  getComments,
  uploadAttachment,
  deleteAttachment,
};
