import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import type {
  TrackrStore,
  Transaction,
  Budget,
  Account,
  AppNotification,
  TransactionFilter,
  Category,
} from "../types";

// ── Helpers ────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

const today = new Date();
const thisMonth = format(today, "yyyy-MM");

// ── Seed Data ──────────────────────────────────────────────────
const seedAccounts: Account[] = [
  {
    id: "acc-1",
    name: "Klyra Chequing",
    type: "chequing",
    balance: 4823.5,
    currency: "CAD",
    colour: "#1D9E75",
  },
  {
    id: "acc-2",
    name: "Klyra Savings",
    type: "savings",
    balance: 12400.0,
    currency: "CAD",
    colour: "#BA7517",
  },
  {
    id: "acc-3",
    name: "Klyra Credit",
    type: "credit",
    balance: -1240.8,
    currency: "CAD",
    colour: "#D85A30",
  },
  {
    id: "acc-4",
    name: "TFSA",
    type: "investment",
    balance: 28750.0,
    currency: "CAD",
    colour: "#3C4A5C",
  },
];

const d = (monthsAgo: number, daysOffset: number) =>
  format(subDays(subMonths(today, monthsAgo), daysOffset), "yyyy-MM-dd");

const seedTransactions: Transaction[] = [
  // ── This month ────────────────────────────────────────────────
  { id: uid(), date: d(0,  0), description: "Salary Deposit",    amount:  4200.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(0,  1), description: "Rent Payment",      amount: -1850.00, type: "expense",  category: "Housing",        account: "acc-1" },
  { id: uid(), date: d(0,  2), description: "Grocery Store",     amount:   -92.40, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(0,  3), description: "TTC Monthly Pass",  amount:  -156.00, type: "expense",  category: "Transportation", account: "acc-3" },
  { id: uid(), date: d(0,  4), description: "Netflix",           amount:   -17.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(0,  5), description: "Hydro Bill",        amount:   -84.50, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(0,  6), description: "Gym Membership",    amount:   -55.00, type: "expense",  category: "Healthcare",     account: "acc-3" },
  { id: uid(), date: d(0,  7), description: "Freelance Payment", amount:   850.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(0,  8), description: "Coffee Shop",       amount:    -8.75, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(0,  9), description: "Uber",              amount:   -18.50, type: "expense",  category: "Transportation", account: "acc-3" },
  { id: uid(), date: d(0, 10), description: "TFSA Contribution", amount:  -500.00, type: "transfer", category: "Savings",        account: "acc-1" },
  { id: uid(), date: d(0, 12), description: "Grocery Store",     amount:   -78.90, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(0, 14), description: "Phone Bill",        amount:   -89.00, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(0, 17), description: "Spotify",           amount:   -11.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(0, 20), description: "Grocery Store",     amount:   -64.15, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(0, 23), description: "Amazon",            amount:   -43.99, type: "expense",  category: "Shopping",       account: "acc-3" },

  // ── 1 month ago ───────────────────────────────────────────────
  { id: uid(), date: d(1,  0), description: "Salary Deposit",    amount:  4200.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(1,  1), description: "Rent Payment",      amount: -1850.00, type: "expense",  category: "Housing",        account: "acc-1" },
  { id: uid(), date: d(1,  2), description: "Grocery Store",     amount:  -105.30, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(1,  4), description: "TTC Monthly Pass",  amount:  -156.00, type: "expense",  category: "Transportation", account: "acc-3" },
  { id: uid(), date: d(1,  5), description: "Hydro Bill",        amount:   -79.20, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(1,  6), description: "Phone Bill",        amount:   -89.00, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(1,  7), description: "Gym Membership",    amount:   -55.00, type: "expense",  category: "Healthcare",     account: "acc-3" },
  { id: uid(), date: d(1,  8), description: "Netflix",           amount:   -17.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(1, 10), description: "Side Project",      amount:  1200.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(1, 12), description: "Grocery Store",     amount:   -88.45, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(1, 14), description: "Udemy Course",      amount:   -29.99, type: "expense",  category: "Education",      account: "acc-3" },
  { id: uid(), date: d(1, 16), description: "Coffee Shop",       amount:   -12.50, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(1, 18), description: "Spotify",           amount:   -11.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(1, 21), description: "Flight YYZ-LAX",   amount:  -420.00, type: "expense",  category: "Travel",         account: "acc-3" },
  { id: uid(), date: d(1, 25), description: "TFSA Contribution", amount:  -500.00, type: "transfer", category: "Savings",        account: "acc-1" },

  // ── 2 months ago ──────────────────────────────────────────────
  { id: uid(), date: d(2,  0), description: "Salary Deposit",    amount:  4200.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(2,  1), description: "Rent Payment",      amount: -1850.00, type: "expense",  category: "Housing",        account: "acc-1" },
  { id: uid(), date: d(2,  3), description: "Grocery Store",     amount:   -97.60, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(2,  4), description: "TTC Monthly Pass",  amount:  -156.00, type: "expense",  category: "Transportation", account: "acc-3" },
  { id: uid(), date: d(2,  5), description: "Hydro Bill",        amount:   -91.75, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(2,  6), description: "Phone Bill",        amount:   -89.00, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(2,  7), description: "Gym Membership",    amount:   -55.00, type: "expense",  category: "Healthcare",     account: "acc-3" },
  { id: uid(), date: d(2,  9), description: "Freelance Payment", amount:   650.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(2, 11), description: "Grocery Store",     amount:   -71.20, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(2, 13), description: "Netflix",           amount:   -17.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(2, 15), description: "Bulk Store Run",    amount:  -234.50, type: "expense",  category: "Shopping",       account: "acc-3" },
  { id: uid(), date: d(2, 18), description: "Uber",              amount:   -24.80, type: "expense",  category: "Transportation", account: "acc-3" },
  { id: uid(), date: d(2, 20), description: "Spotify",           amount:   -11.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(2, 24), description: "TFSA Contribution", amount:  -500.00, type: "transfer", category: "Savings",        account: "acc-1" },

  // ── 3 months ago ──────────────────────────────────────────────
  { id: uid(), date: d(3,  0), description: "Salary Deposit",    amount:  4200.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(3,  1), description: "Rent Payment",      amount: -1850.00, type: "expense",  category: "Housing",        account: "acc-1" },
  { id: uid(), date: d(3,  2), description: "Grocery Store",     amount:  -110.40, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(3,  3), description: "TTC Monthly Pass",  amount:  -156.00, type: "expense",  category: "Transportation", account: "acc-3" },
  { id: uid(), date: d(3,  5), description: "Hydro Bill",        amount:   -96.30, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(3,  6), description: "Phone Bill",        amount:   -89.00, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(3,  7), description: "Gym Membership",    amount:   -55.00, type: "expense",  category: "Healthcare",     account: "acc-3" },
  { id: uid(), date: d(3,  9), description: "Coffee Shop",       amount:   -10.25, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(3, 10), description: "Freelance Payment", amount:   975.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(3, 12), description: "Grocery Store",     amount:   -83.70, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(3, 14), description: "Netflix",           amount:   -17.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(3, 16), description: "Amazon",            amount:   -58.49, type: "expense",  category: "Shopping",       account: "acc-3" },
  { id: uid(), date: d(3, 19), description: "Spotify",           amount:   -11.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(3, 22), description: "Uber",              amount:   -31.60, type: "expense",  category: "Transportation", account: "acc-3" },
  { id: uid(), date: d(3, 26), description: "TFSA Contribution", amount:  -500.00, type: "transfer", category: "Savings",        account: "acc-1" },

  // ── 4 months ago ──────────────────────────────────────────────
  { id: uid(), date: d(4,  0), description: "Salary Deposit",    amount:  4200.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(4,  1), description: "Rent Payment",      amount: -1850.00, type: "expense",  category: "Housing",        account: "acc-1" },
  { id: uid(), date: d(4,  2), description: "Grocery Store",     amount:   -99.85, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(4,  4), description: "TTC Monthly Pass",  amount:  -156.00, type: "expense",  category: "Transportation", account: "acc-3" },
  { id: uid(), date: d(4,  5), description: "Hydro Bill",        amount:   -88.10, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(4,  6), description: "Phone Bill",        amount:   -89.00, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(4,  7), description: "Gym Membership",    amount:   -55.00, type: "expense",  category: "Healthcare",     account: "acc-3" },
  { id: uid(), date: d(4,  8), description: "Netflix",           amount:   -17.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(4, 10), description: "Grocery Store",     amount:   -76.30, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(4, 13), description: "Coffee Shop",       amount:    -9.50, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(4, 15), description: "Side Project",      amount:   800.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(4, 17), description: "Pharmacy",          amount:   -36.75, type: "expense",  category: "Healthcare",     account: "acc-3" },
  { id: uid(), date: d(4, 19), description: "Spotify",           amount:   -11.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(4, 22), description: "Amazon",            amount:   -82.14, type: "expense",  category: "Shopping",       account: "acc-3" },
  { id: uid(), date: d(4, 25), description: "TFSA Contribution", amount:  -500.00, type: "transfer", category: "Savings",        account: "acc-1" },

  // ── 5 months ago ──────────────────────────────────────────────
  { id: uid(), date: d(5,  0), description: "Salary Deposit",    amount:  4200.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(5,  1), description: "Rent Payment",      amount: -1850.00, type: "expense",  category: "Housing",        account: "acc-1" },
  { id: uid(), date: d(5,  3), description: "Grocery Store",     amount:  -108.20, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(5,  4), description: "TTC Monthly Pass",  amount:  -156.00, type: "expense",  category: "Transportation", account: "acc-3" },
  { id: uid(), date: d(5,  5), description: "Hydro Bill",        amount:   -82.40, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(5,  6), description: "Phone Bill",        amount:   -89.00, type: "expense",  category: "Utilities",      account: "acc-1" },
  { id: uid(), date: d(5,  7), description: "Gym Membership",    amount:   -55.00, type: "expense",  category: "Healthcare",     account: "acc-3" },
  { id: uid(), date: d(5,  9), description: "Freelance Payment", amount:  1100.00, type: "income",   category: "Income",         account: "acc-1" },
  { id: uid(), date: d(5, 11), description: "Grocery Store",     amount:   -90.55, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(5, 13), description: "Netflix",           amount:   -17.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(5, 15), description: "Uber",              amount:   -27.20, type: "expense",  category: "Transportation", account: "acc-3" },
  { id: uid(), date: d(5, 17), description: "Bulk Store Run",    amount:  -198.75, type: "expense",  category: "Shopping",       account: "acc-3" },
  { id: uid(), date: d(5, 20), description: "Coffee Shop",       amount:   -11.00, type: "expense",  category: "Food & Dining",  account: "acc-3" },
  { id: uid(), date: d(5, 22), description: "Spotify",           amount:   -11.99, type: "expense",  category: "Entertainment",  account: "acc-3" },
  { id: uid(), date: d(5, 24), description: "TFSA Contribution", amount:  -500.00, type: "transfer", category: "Savings",        account: "acc-1" },
];

const seedBudgets: Budget[] = [
  {
    id: "bud-1",
    category: "Food & Dining",
    limit: 400,
    period: "monthly",
    alertAt: 80,
  },
  {
    id: "bud-2",
    category: "Housing",
    limit: 2000,
    period: "monthly",
    alertAt: 90,
  },
  {
    id: "bud-3",
    category: "Transportation",
    limit: 250,
    period: "monthly",
    alertAt: 80,
  },
  {
    id: "bud-4",
    category: "Entertainment",
    limit: 100,
    period: "monthly",
    alertAt: 75,
  },
  {
    id: "bud-5",
    category: "Shopping",
    limit: 200,
    period: "monthly",
    alertAt: 80,
  },
  {
    id: "bud-6",
    category: "Healthcare",
    limit: 150,
    period: "monthly",
    alertAt: 80,
  },
  {
    id: "bud-7",
    category: "Utilities",
    limit: 200,
    period: "monthly",
    alertAt: 85,
  },
];

// ── Default Filter ─────────────────────────────────────────────
const defaultFilter: TransactionFilter = {
  dateRange: {
    from: format(startOfMonth(today), "yyyy-MM-dd"),
    to: format(endOfMonth(today), "yyyy-MM-dd"),
  },
  preset: "this_month",
  categories: [],
  types: [],
  accounts: [],
  search: "",
};

// ── Internal: Budget Alert Helper ─────────────────────────────
function checkBudgetAlerts(
  category: Category,
  budgets: Budget[],
  transactions: Transaction[],
  addNotification: TrackrStore["addNotification"],
) {
  const budget = budgets.find((b) => b.category === category);
  if (!budget) return;

  const now  = new Date();
  const from = format(startOfMonth(now), "yyyy-MM-dd");
  const to   = format(endOfMonth(now), "yyyy-MM-dd");

  const spent = transactions
    .filter(
      (t) =>
        t.category === category &&
        t.type === "expense" &&
        t.date >= from &&
        t.date <= to,
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const pct = (spent / budget.limit) * 100;

  if (pct >= 100) {
    addNotification({
      type: "budget_over",
      title: `${category} budget exceeded`,
      message: `You've spent $${spent.toFixed(2)} of your $${budget.limit} ${category} budget this month.`,
    });
  } else if (pct >= budget.alertAt) {
    addNotification({
      type: "budget_alert",
      title: `${category} budget at ${Math.round(pct)}%`,
      message: `You've used $${spent.toFixed(2)} of your $${budget.limit} ${category} budget.`,
    });
  }
}

// ── Store ──────────────────────────────────────────────────────
export const useTrackrStore = create<TrackrStore>()(
  persist(
    (set, get) => ({
        transactions: seedTransactions,
        budgets: seedBudgets,
        accounts: seedAccounts,
        notifications: [],
        filter: defaultFilter,
        activeAccount: null,
        theme: "light",

        // ── Transaction Actions ──────────────────────────────────
        addTransaction: (tx) => {
          const newTx = { ...tx, id: uid() };
          set((s) => ({ transactions: [newTx, ...s.transactions] }));
          if (tx.type === "expense") {
            const { budgets, transactions, addNotification } = get();
            checkBudgetAlerts(tx.category, budgets, transactions, addNotification);
          }
        },

        updateTransaction: (id, tx) =>
          set((s) => ({
            transactions: s.transactions.map((t) =>
              t.id === id ? { ...t, ...tx } : t,
            ),
          })),

        deleteTransaction: (id) =>
          set((s) => ({
            transactions: s.transactions.filter((t) => t.id !== id),
          })),

        importTransactions: (txs) => {
          const withIds = txs.map((tx) => ({ ...tx, id: uid() }));
          set((s) => ({ transactions: [...withIds, ...s.transactions] }));
        },

        // ── Budget Actions ───────────────────────────────────────
        addBudget: (b) =>
          set((s) => ({ budgets: [...s.budgets, { ...b, id: uid() }] })),
        updateBudget: (id, b) =>
          set((s) => ({
            budgets: s.budgets.map((bud) =>
              bud.id === id ? { ...bud, ...b } : bud,
            ),
          })),
        deleteBudget: (id) =>
          set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

        // ── Account Actions ──────────────────────────────────────
        addAccount: (a) =>
          set((s) => ({ accounts: [...s.accounts, { ...a, id: uid() }] })),
        updateAccount: (id, a) =>
          set((s) => ({
            accounts: s.accounts.map((acc) =>
              acc.id === id ? { ...acc, ...a } : acc,
            ),
          })),
        deleteAccount: (id) =>
          set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

        // ── UI Actions ───────────────────────────────────────────
        setFilter: (f) => set((s) => ({ filter: { ...s.filter, ...f } })),
        resetFilter: () => set({ filter: defaultFilter }),
        setActiveAccount: (id) => set({ activeAccount: id }),
        toggleTheme: () =>
          set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),

        addNotification: (n) =>
          set((s) => ({
            notifications: [
              {
                ...n,
                id: uid(),
                createdAt: new Date().toISOString(),
                read: false,
              },
              ...s.notifications,
            ],
          })),

        markNotificationRead: (id) =>
          set((s) => ({
            notifications: s.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n,
            ),
          })),

        clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "trackr-storage-v3",
      partialize: (s) => ({
        transactions: s.transactions,
        budgets: s.budgets,
        accounts: s.accounts,
        notifications: s.notifications,
        theme: s.theme,
      }),
    },
  ),
);
