// Asset types for TypeScript
export interface Asset {
  id?: string;
  employeeId: string;
  employeeName: string;
  userEmail: string;
  mobileNumber?: string;
  department: string;
  location: string;
  owner: string;
  category: 'laptop' | 'desktop' | 'monitor' | 'printer' | 'projector' | 'network' | 'peripheral' | 'other';
  serialNumber: string;
  manufacturer: string;
  /**
   * Ownership: 'company' = company-owned asset, 'vendor' = vendor-provided asset
   * If 'vendor', `vendorName` should be provided.
   */
  ownership: 'company' | 'vendor';
  vendorName?: string;
  model: string;
  purchaseDate: Date;
  purchasePrice: number;
  warrantyExpiration: Date;
  condition: 'new' | 'good' | 'fair' | 'poor' | 'retired';
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  cpuManufacturer: string;
  cpuModel: string;
  cpuGeneration: string;
  ramType: string;
  ramSizeGb: number;
  storageType: 'HDD' | 'SSD' | 'NVMe' | 'eMMC' | 'other';
  storageCapacityGb: number;
  os: string;
  operatingSystemVersion: string;
  macAddress: string;
  purchaseOrderNumber: string;
  notes: string;
  imageUrl: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetCategory {
  id: string;
  name: string;
  description: string;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role?: 'admin' | 'user';
  createdAt?: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  employeeName?: string;
  employeeId: string;
  mobile: string;
  department: string;
  createdAt?: Date;
}

export interface AssetRequest {
  id?: string;
  requesterId: string;
  requesterEmail: string;
  requesterName: string;
  requesterDepartment: string;
  employeeId: string;
  employeeName: string;
  mobile?: string;
  category: 'laptop' | 'desktop' | 'monitor' | 'printer' | 'projector' | 'network' | 'peripheral' | 'other';
  manufacturer?: string;
  model?: string;
  specifications?: string;
  justification: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  comments: Array<{
    id?: string;
    authorId: string;
    authorName: string;
    authorEmail: string;
    authorRole: 'user' | 'admin';
    text: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
}

export interface Incident {
  id?: string;
  incidentNumber: number;
  reporterId: string;
  reporterEmail: string;
  reporterName: string;
  reporterEmployeeId: string;
  reporterMobile: string;
  reporterDepartment: string;
  title: string;
  assetId?: string;
  assetName?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'laptop' | 'desktop' | 'network' | 'printer' | 'projector' | 'sap' | 'peripherals' | 'other';
  status: 'open' | 'work in progress' | 'monitoring' | 'resolved';
  comments: Array<{
    id?: string;
    authorId: string;
    authorName: string;
    authorEmail: string;
    authorRole: 'user' | 'admin';
    text: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
}
