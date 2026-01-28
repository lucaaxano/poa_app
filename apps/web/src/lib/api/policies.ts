import { apiClient } from './client';

export interface Insurer {
  id: string;
  name: string;
  claimsEmail: string;
}

export interface Policy {
  id: string;
  companyId: string;
  insurerId: string;
  policyNumber: string;
  coverageType: 'FLEET' | 'SINGLE' | 'PARTIAL' | 'FULL';
  pricingModel: 'QUOTA' | 'PER_PIECE' | 'SMALL_FLEET' | null;
  annualPremium: number | null;
  deductible: number | null;
  quotaThreshold: number | null;
  validFrom: string;
  validTo: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  insurer: {
    id: string;
    name: string;
    claimsEmail: string;
  };
}

export interface CreatePolicyData {
  insurerId: string;
  policyNumber: string;
  coverageType?: 'FLEET' | 'SINGLE' | 'PARTIAL' | 'FULL';
  pricingModel?: 'QUOTA' | 'PER_PIECE' | 'SMALL_FLEET';
  annualPremium?: number;
  deductible?: number;
  quotaThreshold?: number;
  validFrom: string;
  validTo?: string;
  notes?: string;
}

export interface UpdatePolicyData {
  insurerId?: string;
  policyNumber?: string;
  coverageType?: 'FLEET' | 'SINGLE' | 'PARTIAL' | 'FULL';
  pricingModel?: 'QUOTA' | 'PER_PIECE' | 'SMALL_FLEET';
  annualPremium?: number;
  deductible?: number;
  quotaThreshold?: number;
  validFrom?: string;
  validTo?: string;
  notes?: string;
  isActive?: boolean;
}

// Insurers API
export async function getInsurers(): Promise<Insurer[]> {
  const response = await apiClient.get<Insurer[]>('/insurers');
  return response.data;
}

export async function getInsurerById(id: string): Promise<Insurer> {
  const response = await apiClient.get<Insurer>(`/insurers/${id}`);
  return response.data;
}

// Policies API
export async function getPolicies(): Promise<Policy[]> {
  const response = await apiClient.get<Policy[]>('/policies');
  return response.data;
}

export async function getPolicyById(id: string): Promise<Policy> {
  const response = await apiClient.get<Policy>(`/policies/${id}`);
  return response.data;
}

export async function createPolicy(data: CreatePolicyData): Promise<Policy> {
  const response = await apiClient.post<Policy>('/policies', data);
  return response.data;
}

export async function updatePolicy(id: string, data: UpdatePolicyData): Promise<Policy> {
  const response = await apiClient.patch<Policy>(`/policies/${id}`, data);
  return response.data;
}

export async function deletePolicy(id: string): Promise<Policy> {
  const response = await apiClient.delete<Policy>(`/policies/${id}`);
  return response.data;
}
