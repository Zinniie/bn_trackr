import { format, startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from 'date-fns';
import type {
  Transaction, Category, CategorySummary,
  MonthlySummary, BudgetStatus, Budget, DateRange,
} from '../types';

// ── Category Colours ───────────────────────────────────────────
export const CATEGORY_COLOURS: Record<Category, string> = {
  'Housing':        '#0D1B2A',
  'Food & Dining':  '#1D9E75',
  'Transportation': '#BA7517',
  'Shopping':       '#D85A30',
  'Entertainment':  '#5DCAA5',
  'Healthcare':     '#3C4A5C',
  'Utilities':      '#6B7A8D',
  'Education':      '#1A2F45',
  'Travel':         '#E8B97A',
  'Savings':        '#0F6E56',
  'Investment':     '#633806',
  'Income':         '#1D9E75',
  'Other':          '#9AA5B4',
};

// ── Currency Formatter ─────────────────────────────────────────
export const formatCurrency = (amount: number, currency = 'CAD'): string =>
  new Intl.NumberFormat('en-CA', {
    style:    'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));

export const formatCompact = (amount: number): string => {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000)     return `$${(abs / 1_000).toFixed(1)}K`;
  return formatCurrency(amount);
};

// ── Date helpers ───────────────────────────────────────────────
export const getDateRangeFromPreset = (preset: string): DateRange => {
  const now = new Date();
  switch (preset) {
    case 'this_month':    return { from: format(startOfMonth(now), 'yyyy-MM-dd'), to: format(endOfMonth(now), 'yyyy-MM-dd') };
    case 'last_month':    return { from: format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'), to: format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd') };
    case 'last_3_months': return { from: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'), to: format(endOfMonth(now), 'yyyy-MM-dd') };
    case 'last_6_months': return { from: format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd'), to: format(endOfMonth(now), 'yyyy-MM-dd') };
    case 'this_year':     return { from: format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd'), to: format(new Date(now.getFullYear(), 11, 31), 'yyyy-MM-dd') };
    default:              return { from: format(startOfMonth(now), 'yyyy-MM-dd'), to: format(endOfMonth(now), 'yyyy-MM-dd') };
  }
};

// ── Filter Transactions ────────────────────────────────────────
export const filterTransactions = (
  transactions: Transaction[],
  filter: { dateRange: DateRange; categories: Category[]; types: string[]; accounts: string[]; search: string }
): Transaction[] => {
  return transactions.filter((tx) => {
    const inRange = tx.date >= filter.dateRange.from && tx.date <= filter.dateRange.to;
    const inCat   = filter.categories.length === 0 || filter.categories.includes(tx.category);
    const inType  = filter.types.length === 0 || filter.types.includes(tx.type);
    const inAcc   = filter.accounts.length === 0 || filter.accounts.includes(tx.account);
    const inSearch = !filter.search || tx.description.toLowerCase().includes(filter.search.toLowerCase());
    return inRange && inCat && inType && inAcc && inSearch;
  });
};

// ── Category Summary ───────────────────────────────────────────
export const getCategorySummary = (transactions: Transaction[]): CategorySummary[] => {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const total    = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const byCategory: Record<string, { amount: number; count: number }> = {};

  for (const tx of expenses) {
    if (!byCategory[tx.category]) byCategory[tx.category] = { amount: 0, count: 0 };
    byCategory[tx.category].amount += Math.abs(tx.amount);
    byCategory[tx.category].count  += 1;
  }

  return Object.entries(byCategory)
    .map(([category, data]) => ({
      category:   category as Category,
      amount:     data.amount,
      count:      data.count,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      colour:     CATEGORY_COLOURS[category as Category] ?? '#9AA5B4',
    }))
    .sort((a, b) => b.amount - a.amount);
};

// ── Monthly Summary (last N months) ───────────────────────────
export const getMonthlyTrend = (transactions: Transaction[], months = 6): MonthlySummary[] => {
  const result: MonthlySummary[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date  = subMonths(now, i);
    const from  = format(startOfMonth(date), 'yyyy-MM-dd');
    const to    = format(endOfMonth(date), 'yyyy-MM-dd');
    const month = format(date, 'yyyy-MM');

    const monthTxs = transactions.filter((t) => t.date >= from && t.date <= to);
    const income   = monthTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);

    result.push({ month, income, expenses, net: income - expenses });
  }
  return result;
};

// ── Budget Status ──────────────────────────────────────────────
export const getBudgetStatus = (budgets: Budget[], transactions: Transaction[]): BudgetStatus[] => {
  const now  = new Date();
  const from = format(startOfMonth(now), 'yyyy-MM-dd');
  const to   = format(endOfMonth(now), 'yyyy-MM-dd');

  return budgets.map((budget) => {
    const spent = transactions
      .filter((t) =>
        t.category === budget.category &&
        t.type === 'expense' &&
        t.date >= from &&
        t.date <= to
      )
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    const percentage = (spent / budget.limit) * 100;
    return {
      ...budget,
      spent,
      remaining:  Math.max(0, budget.limit - spent),
      percentage: Math.min(100, percentage),
      isOver:     percentage >= 100,
      isAlert:    percentage >= budget.alertAt && percentage < 100,
    };
  });
};

// ── Totals ─────────────────────────────────────────────────────
export const getTotals = (transactions: Transaction[]) => {
  const income   = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  return { income, expenses, net: income - expenses };
};

// ── Export CSV ─────────────────────────────────────────────────
export const exportToCSV = (transactions: Transaction[]): void => {
  const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account'];
  const rows    = transactions.map((t) => [
    t.date, t.description, t.amount.toFixed(2), t.type, t.category, t.account,
  ]);
  const csv     = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob    = new Blob([csv], { type: 'text/csv' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  a.download    = `trackr-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
