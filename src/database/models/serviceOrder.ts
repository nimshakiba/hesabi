/**
 * ServiceOrder Model (representing services or work orders)
 */
export interface ServiceOrder {
  id: string;
  title: string;
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
