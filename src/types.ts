export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export type AccountLevel = 'Group' | 'Ledger' | 'Subsidiary' | 'Detailed'; // گروه، کل، معین، تفصیلی

export interface Account {
  id: string;
  code: string;
  name: string;
  nameFa: string;
  type: AccountType;
  level: AccountLevel;
  parentCode: string | null;
  system?: boolean;
}

export interface JournalEntryLine {
  id: string;
  accountCode: string;
  accountName: string;
  accountNameFa: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  docNumber: number;
  date: string; // YYYY-MM-DD or Hijri/Persian date
  description: string;
  lines: JournalEntryLine[];
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
}

export interface TrialBalanceRow {
  code: string;
  name: string;
  nameFa: string;
  level: AccountLevel;
  type: AccountType;
  debitSum: number;
  creditSum: number;
  debitBalance: number;
  creditBalance: number;
}

export interface GeneralLedgerRow {
  date: string;
  docNumber: number;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: 'Debit' | 'Credit' | 'Zero';
}

export interface FinancialStatementRow {
  groupName: string;
  groupNameFa: string;
  accounts: {
    code: string;
    name: string;
    nameFa: string;
    balance: number;
  }[];
  total: number;
}
