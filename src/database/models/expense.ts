/**
 * Expense Model
 */
export interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId?: string; // Relation to Category
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
