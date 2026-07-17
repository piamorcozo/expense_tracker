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

export type InstallmentFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface InstallmentPayment {
  id: number;
  plan_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'Pending' | 'Paid';
  paid_date: string | null;
  is_advance: boolean;
}

export interface InstallmentPlan {
  id: number;
  name: string;
  amount: number;
  total_count: number;
  frequency: InstallmentFrequency;
  start_date: string;
  bank: string | null;
  notes: string | null;
  status: 'Active' | 'Completed';
  paid_count: number;
  pending_count: number;
  progress_pct: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  next_due_date: string | null;
  next_amount: number | null;
  payments?: InstallmentPayment[];
}

export interface UpcomingInstallment {
  plan_id: number;
  plan_name: string;
  payment_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  days_remaining: number | null;
  bank: string | null;
  total_count: number;
  paid_count: number;
}

export interface UpcomingInstallmentsResponse {
  next: UpcomingInstallment | null;
  upcoming: UpcomingInstallment[];
}
