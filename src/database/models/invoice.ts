import { InvoiceItem } from './invoiceItem';

/**
 * Invoice Model
 */
export interface Invoice {
  id: string;
  customerId?: string; // Relation to Customer (or general_customer)
  supplierId?: string; // Relation to Supplier (if type is Purchase)
  invoiceNumber: string;
  type: 'Sale' | 'Quick Sale' | 'Purchase';
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  paymentMethod: 'Cash' | 'POS' | 'Mixed';
  items?: InvoiceItem[]; // Navigation relation to InvoiceItem list
  createdAt: string;
  updatedAt: string;
}
