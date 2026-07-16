export interface User {
  id: number;
  name: string;
  emoji: string;
}

export interface Bank {
  id: number;
  name: string;
}

export interface MustHave {
  id: number;
  name: string;
  amount: number;
}

export interface ItemStatusOption {
  id: number;
  name: string;
}

export type ListType = 'cutoff' | 'other';
export type ListStatus = 'Open' | 'Pending' | 'Closed';

export interface ExpenseItem {
  id: number;
  list_id: number;
  name: string;
  amount: number;
  bank: string | null;
  status: string;
  due_date: string | null;
  remarks: string | null;
}

export interface ExpenseList {
  id: number;
  name: string;
  type: ListType;
  month: string | null;
  day: string | null;
  budget: number;
  status: ListStatus;
  icon: string | null;
  spent: number;
  remaining: number;
  created_at?: string | null;
  items?: ExpenseItem[];
  item_count?: number;
}

export interface SavingsEntry {
  id: number;
  date: string;
  amount: number;
  bank: string | null;
  status: 'Deposited' | 'Pending';
}

export interface SavingsSummary {
  total: number;
  most_frequent_amount: number;
  remaining_cutoffs: number;
  projected_year_end: number;
}
