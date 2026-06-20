/**
 * InvoiceItem Model
 */
export interface InvoiceItem {
  id: string;
  invoiceId: string; // Relation to Invoice
  itemId: string; // Reference to Product ID or Service ID
  itemType: 'Product' | 'Service';
  quantity: number;
  price: number; // Unit price at the time of purchase/sale
  total: number; // quantity * price
  createdAt: string;
  updatedAt: string;
}
