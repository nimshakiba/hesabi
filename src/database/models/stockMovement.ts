/**
 * StockMovement Model (representing inventory stock logs)
 */
export interface StockMovement {
  id: string;
  productId: string; // Relation to Product
  previousQty: number;
  newQty: number;
  changeQty: number; // e.g. +5, -2
  reason: string; // "ثبت در فاکتور شماره X", "ویرایش مستقیم" etc.
  createdAt: string;
  updatedAt: string;
}
