/**
 * Customer Model
 */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number; // positive: debtor (بدهکار), negative: creditor (بستانکار), zero: settled
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
