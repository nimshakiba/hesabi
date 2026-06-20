/**
 * Product Model
 */
export interface Product {
  id: string;
  name: string;
  barcode: string;
  categoryId?: string; // Relation to Category model
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minimumStock?: number;
  unit: string; // e.g., 'کیسه', 'عدد', 'کیلوگرم' 
  createdAt: string;
  updatedAt: string;
}
