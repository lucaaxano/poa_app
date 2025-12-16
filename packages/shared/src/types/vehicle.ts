// Vehicle Types

export enum VehicleType {
  CAR = 'CAR',
  TRUCK = 'TRUCK',
  VAN = 'VAN',
  MOTORCYCLE = 'MOTORCYCLE',
  OTHER = 'OTHER',
}

export interface Vehicle {
  id: string;
  companyId: string;
  licensePlate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  vin: string | null;
  hsn: string | null;
  tsn: string | null;
  internalName: string | null;
  vehicleType: VehicleType;
  color: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleInput {
  licensePlate: string;
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  hsn?: string;
  tsn?: string;
  internalName?: string;
  vehicleType?: VehicleType;
  color?: string;
}

export interface UpdateVehicleInput {
  licensePlate?: string;
  brand?: string;
  model?: string;
  year?: number;
  vin?: string;
  hsn?: string;
  tsn?: string;
  internalName?: string;
  vehicleType?: VehicleType;
  color?: string;
  isActive?: boolean;
}

export interface VehicleWithStats extends Vehicle {
  claimsCount: number;
  totalClaimsCost: number;
}
