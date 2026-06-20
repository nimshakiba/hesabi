/**
 * Payment Model
 */
export interface Payment {
  id: string;
  invoiceId?: string; // Optional relation to specific Invoice
  customerId?: string; // Reference to Customer
  supplierId?: string; // Reference to Supplier
  amount: number;
  paymentMethod: 'Cash' | 'POS' | 'Mixed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
