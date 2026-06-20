/**
 * Supplier Model
 */
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  balance: number; // positive: debtor (بدهکار), negative: creditor (بستانکار)
  nationalCode?: string;
  economicCode?: string;
  address?: string;
  email?: string;
  notes?: string;
  postalCode?: string;
  landline?: string;
  createdAt: string;
  updatedAt: string;
}
