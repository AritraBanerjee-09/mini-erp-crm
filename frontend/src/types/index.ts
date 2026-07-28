export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type CustomerType = 'Retail' | 'Wholesale' | 'Distributor';
export type CustomerStatus = 'Lead' | 'Active' | 'Inactive';

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  createdById: string;
  createdAt: string;
  createdBy?: {
    name: string;
    role: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  followUps?: CustomerFollowUp[];
}

export interface StockLog {
  id: string;
  productId: string;
  quantityChanged: number;
  movementType: 'IN' | 'OUT';
  reason: string;
  createdById: string;
  createdAt: string;
  createdBy?: {
    name: string;
    role: string;
    email?: string;
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  stockLogs?: StockLog[];
}

export type ChallanStatus = 'Draft' | 'Confirmed' | 'Cancelled';

export interface ChallanItem {
  id?: string;
  productId: string;
  productSnapshotJson?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product?: {
    name: string;
    sku: string;
  };
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerSnapshotJson: string;
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    businessName: string;
    mobile: string;
    email: string;
  };
  createdBy?: {
    id: string;
    name: string;
    role: string;
  };
  items: ChallanItem[];
  invoices?: {
    id: string;
    invoiceNumber: string;
    status: string;
  }[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  salesChallanId: string;
  customerId: string;
  totalAmount: number;
  status: 'Pending' | 'Paid' | 'Cancelled';
  dueDate: string;
  createdAt: string;
  customer?: Customer;
  salesChallan?: SalesChallan;
}

export interface DashboardStats {
  stats: {
    totalCustomers: number;
    leadsCount: number;
    activeCustomersCount: number;
    totalProducts: number;
    lowStockCount: number;
    totalChallans: number;
    confirmedChallansCount: number;
    totalConfirmedRevenue: number;
    totalInvoicesCount: number;
    pendingInvoicesCount: number;
    pendingInvoiceRevenue: number;
  };
  lowStockProducts: Product[];
  upcomingFollowups: Customer[];
}
