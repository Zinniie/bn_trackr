# BN TrackR — Personal Finance Dashboard

> A responsive finance tracking dashboard built with React 18, TypeScript, Recharts, and Zustand. Live on GitHub Pages.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-2.x-22B5BF)
![Zustand](https://img.shields.io/badge/Zustand-4.x-orange)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**[Live Demo →](https://zinniie.github.io/bn-trackr)**

---

## Overview

BN TrackR is a production-quality personal finance dashboard demonstrating real-world React + TypeScript patterns — Zustand state management, interactive Recharts visualisations, CSV import/export, budget alerts, and a fully responsive design system.

**Core features:**
- Dashboard with income/expense charts, category breakdown, and account overview
- Transaction management — add, delete, search, filter by category and date range
- CSV import with auto column mapping and CSV export
- Budget tracking with configurable alert thresholds and over-budget notifications
- Analytics — 6-month trend, savings rate, category drill-down
- Dark/light mode with `localStorage` persistence
- Fully responsive — mobile-first layouts

---

## Screenshots

### Dashboard
![Dashboard](https://github.com/user-attachments/assets/73853d65-1bbb-412f-a7a6-96e81b4f7ced)

### Transactions
![Transactions](https://github.com/user-attachments/assets/1a4e0185-6a6a-46c9-b2e6-81ee0a140a95)

### Analytics
![Analytics](https://github.com/user-attachments/assets/a239ecf1-cf17-43cd-be35-415731ad1e04)

### Budgets
![Budgets](https://github.com/user-attachments/assets/6fecce2b-a831-4fe0-8351-9f72b80e485f)

### Notifications
![Notifications](https://github.com/user-attachments/assets/30c0d018-5a1d-4746-b4f1-e88d90e7eb3c)

---

## Architecture

```
src/
├── types/
│   └── index.ts          # All TypeScript interfaces and types
│
├── store/
│   └── index.ts          # Zustand store with persist middleware + seed data
│
├── utils/
│   └── index.ts          # Formatters, filters, aggregation functions
│
├── pages/
│   ├── DashboardPage.tsx  # Overview — stats, charts, recent activity
│   ├── TransactionsPage.tsx # Full transaction table + add/import/export
│   ├── AnalyticsPage.tsx  # Trend charts + category breakdown
│   └── BudgetsPage.tsx    # Budget management + alert system
│
├── App.tsx               # Root — sidebar, nav, theme
├── index.css             # Design system — tokens, layout, components
└── main.tsx              # React 18 entry point
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript 5 |
| Build tool | Vite 5 |
| State | Zustand 4 + persist middleware |
| Charts | Recharts 2 |
| CSV parsing | PapaParse |
| Icons | Lucide React |
| Date utils | date-fns |
| Deployment | GitHub Pages via gh-pages |
| Styling | Custom CSS design system (no UI library) |

---

## Getting Started

### Prerequisites
- Node.js `>=18`
- npm or yarn

### Install and run

```bash
git clone https://github.com/zinniie/bn-trackr.git
cd bn-trackr
npm install
npm run dev
```

Opens at `http://localhost:5173/bn-trackr/`

### Build for production

```bash
npm run build
```

### Deploy to GitHub Pages

```bash
npm run deploy
```

Deploys to `https://zinniie.github.io/bn-trackr` automatically.

---

## Key Features Deep-Dive

### State Management with Zustand

```typescript
const useTrackrStore = create<TrackrStore>()(
  persist(
    (set, get) => ({
      transactions: seedData,
      // ...actions
      addTransaction: (tx) => {
        set((s) => ({ transactions: [{ ...tx, id: uid() }, ...s.transactions] }));
        get()._checkBudgetAlerts(tx.category); // auto-trigger alerts
      },
    }),
    { name: 'trackr-storage', partialize: (s) => ({ transactions: s.transactions, ... }) }
  )
);
```

### CSV Import with PapaParse

```typescript
Papa.parse(file, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    const parsed = results.data.map((r) => ({
      date:        r.Date || r.date,
      description: r.Description || r.Payee,
      amount:      parseFloat(r.Amount),
      // auto-detect income vs expense from sign
      type:        parseFloat(r.Amount) >= 0 ? 'income' : 'expense',
      category:    r.Category || 'Other',
    }));
    importTransactions(parsed);
  },
});
```

### Budget Alert System

Budget alerts fire automatically when a transaction is added:

```typescript
_checkBudgetAlerts: (category) => {
  const budget = get().budgets.find((b) => b.category === category);
  const spent  = get().transactions.filter(/* this month */).reduce(...);
  const pct    = (spent / budget.limit) * 100;

  if (pct >= 100)             addNotification({ type: 'budget_over', ... });
  else if (pct >= alertAt)    addNotification({ type: 'budget_alert', ... });
},
```

---

## Roadmap

- [ ] Multi-currency support
- [ ] Recurring transaction templates
- [ ] Investment portfolio tracking
- [ ] Bank connection via Plaid API
- [ ] Mobile app version (React Native)
- [ ] Data export to Excel

---

## Author

**Blessing Nnabugwu**
Software Engineer · Toronto, ON
[linkedin.com/in/blessingnnabugwu](https://linkedin.com/in/blessingnnabugwu) · [zinniie.github.io](https://zinniie.github.io)

---

## License

MIT License — see [LICENSE](LICENSE) for details.
