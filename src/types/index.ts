// ── Transaction Types ──────────────────────────────────────────
export type TransactionType = 'income' | 'expense' | 'transfer';

export type Category =
  | 'Housing' | 'Food & Dining' | 'Transportation' | 'Shopping'
  | 'Entertainment' | 'Healthcare' | 'Utilities' | 'Education'
  | 'Travel' | 'Savings' | 'Investment' | 'Income' | 'Other';

export interface Transaction {
  id:          string;
  date:        string;        // ISO date string
  description: string;
  amount:      number;        // positive = income, negative = expense
  type:        TransactionType;
  category:    Category;
  account:     string;
  note?:       string;
  tags?:       string[];
}

// ── Budget Types ───────────────────────────────────────────────
export interface Budget {
  id:        string;
  category:  Category;
  limit:     number;
  period:    'monthly' | 'weekly' | 'yearly';
  alertAt:   number;          // percentage (0–100) to trigger alert
}

export interface BudgetStatus extends Budget {
  spent:      number;
  remaining:  number;
  percentage: number;
  isOver:     boolean;
  isAlert:    boolean;
}

// ── Account Types ──────────────────────────────────────────────
export interface Account {
  id:       string;
  name:     string;
  type:     'chequing' | 'savings' | 'credit' | 'investment';
  balance:  number;
  currency: string;
  colour:   string;
}

// ── Summary Types ──────────────────────────────────────────────
export interface MonthlySummary {
  month:    string;           // 'YYYY-MM'
  income:   number;
  expenses: number;
  net:      number;
}

export interface CategorySummary {
  category:   Category;
  amount:     number;
  percentage: number;
  count:      number;
  colour:     string;
}

export interface DailySummary {
  date:     string;
  income:   number;
  expenses: number;
}

// ── Filter / View Types ────────────────────────────────────────
export type DateRangePreset =
  | 'this_month' | 'last_month' | 'last_3_months'
  | 'last_6_months' | 'this_year' | 'custom';

export interface DateRange {
  from: string;
  to:   string;
}

export interface TransactionFilter {
  dateRange:  DateRange;
  preset:     DateRangePreset;
  categories: Category[];
  types:      TransactionType[];
  accounts:   string[];
  search:     string;
  minAmount?: number;
  maxAmount?: number;
}

// ── CSV Import Types ───────────────────────────────────────────
export interface CsvRow {
  [key: string]: string;
}

export interface ColumnMapping {
  date:        string;
  description: string;
  amount:      string;
  type?:       string;
  category?:   string;
  account?:    string;
}

export interface ImportPreview {
  rows:    Transaction[];
  errors:  string[];
  mapping: ColumnMapping;
}

// ── Notification Types ─────────────────────────────────────────
export type NotificationType = 'budget_alert' | 'budget_over' | 'info' | 'success';

export interface AppNotification {
  id:        string;
  type:      NotificationType;
  title:     string;
  message:   string;
  createdAt: string;
  read:      boolean;
}

// ── Store Types ────────────────────────────────────────────────
export interface TrackrStore {
  // Data
  transactions:  Transaction[];
  budgets:       Budget[];
  accounts:      Account[];
  notifications: AppNotification[];

  // UI State
  filter:        TransactionFilter;
  activeAccount: string | null;
  theme:         'light' | 'dark';

  // Actions — Transactions
  addTransaction:     (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction:  (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction:  (id: string) => void;
  importTransactions: (txs: Omit<Transaction, 'id'>[]) => void;

  // Actions — Budgets
  addBudget:    (b: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, b: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  // Actions — Accounts
  addAccount:    (a: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, a: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  // Actions — UI
  setFilter:         (f: Partial<TransactionFilter>) => void;
  resetFilter:       () => void;
  setActiveAccount:  (id: string | null) => void;
  toggleTheme:       () => void;
  addNotification:   (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}
