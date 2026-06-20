/**
 * User Model
 */
export interface User {
  id: string;
  username: string;
  fullName: string;
  passwordHash?: string; // Optional field for secure authentication
  role: 'Admin' | 'Salesperson' | 'Accountant'; // Custom enterprise roles
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  password?: string;
  personId?: string;
}
