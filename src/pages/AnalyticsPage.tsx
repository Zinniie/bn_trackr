import { useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useTrackrStore } from '../store';
import { filterTransactions, getCategorySummary, getMonthlyTrend, getTotals, formatCurrency, getBudgetStatus } from '../utils';
import { useState } from 'react';
import { Plus, Trash2, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import type { Budget, Category } from '../types';

// ── Analytics Page ─────────────────────────────────────────────
export function AnalyticsPage() {
  const { transactions, filter } = useTrackrStore();
  const filtered = useMemo(() => filterTransactions(transactions, filter), [transactions, filter]);
  const trend    = useMemo(() => getMonthlyTrend(transactions, 6), [transactions]);
  const catData  = useMemo(() => getCategorySummary(filtered), [filtered]);
  const totals   = useMemo(() => getTotals(filtered), [filtered]);

  const savingsRate = totals.income > 0
    ? Math.max(0, ((totals.income - totals.expenses) / totals.income) * 100)
    : 0;

  return (
    <div>
      {/* ── Summary stats ──────────────────────────────────── */}
      <div className="stats-grid section-gap fade-up">
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value stat-income">{formatCurrency(totals.income)}</div>
          <div className="stat-sub">This period</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value stat-expense">{formatCurrency(totals.expenses)}</div>
          <div className="stat-sub">This period</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Savings Rate</div>
          <div className="stat-value" style={{ color: savingsRate >= 20 ? 'var(--teal)' : 'var(--amber)' }}>
            {savingsRate.toFixed(1)}%
          </div>
          <div className="stat-sub">{savingsRate >= 20 ? 'Great job!' : 'Aim for 20%+'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Transactions</div>
          <div className="stat-value stat-net">{filtered.length}</div>
          <div className="stat-sub">This period</div>
        </div>
      </div>

      {/* ── Income vs Expenses area chart ──────────────────── */}
      <div className="card section-gap fade-up fade-up-2">
        <p className="card-label">Trend</p>
        <p className="card-title" style={{ marginBottom: '1.5rem' }}>6-Month Financial Flow</p>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--teal)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--teal)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--coral)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="var(--coral)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(v) => format(parseISO(v + '-01'), 'MMM')} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} labelFormatter={(v) => format(parseISO(v + '-01'), 'MMMM yyyy')} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
              <Area type="monotone" dataKey="income"   stroke="var(--teal)"  strokeWidth={2} fill="url(#incomeGrad)"  name="Income"   />
              <Area type="monotone" dataKey="expenses" stroke="var(--coral)" strokeWidth={2} fill="url(#expenseGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Category breakdown ─────────────────────────────── */}
      <div className="grid-2 section-gap fade-up fade-up-3">
        <div className="card">
          <p className="card-label">Spending</p>
          <p className="card-title" style={{ marginBottom: '1.5rem' }}>By Category</p>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={45}>
                  {catData.map((e, i) => <Cell key={i} fill={e.colour} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <p className="card-label">Breakdown</p>
          <p className="card-title" style={{ marginBottom: '1.25rem' }}>Category Detail</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {catData.slice(0, 6).map((cat) => (
              <div key={cat.category}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="cat-dot" style={{ background: cat.colour }} />
                    <span style={{ fontSize: 13 }}>{cat.category}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{formatCurrency(cat.amount)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 6 }}>{cat.percentage.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${cat.percentage}%`, background: cat.colour }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Net savings bar chart ───────────────────────────── */}
      <div className="card fade-up fade-up-4">
        <p className="card-label">Net Savings</p>
        <p className="card-title" style={{ marginBottom: '1.5rem' }}>Monthly Net (Income − Expenses)</p>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tickFormatter={(v) => format(parseISO(v + '-01'), 'MMM')} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={44} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="net" radius={[4,4,0,0]} name="Net Savings">
                {trend.map((entry, i) => (
                  <Cell key={i} fill={entry.net >= 0 ? 'var(--teal)' : 'var(--coral)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Budgets Page ───────────────────────────────────────────────
const CATEGORIES: Category[] = [
  'Housing','Food & Dining','Transportation','Shopping',
  'Entertainment','Healthcare','Utilities','Education','Travel','Other',
];

export function BudgetsPage() {
  const { budgets, transactions, addBudget, deleteBudget } = useTrackrStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({ category: 'Food & Dining' as Category, limit: '', alertAt: '80' });

  const budgetStatus = useMemo(() => getBudgetStatus(budgets, transactions), [budgets, transactions]);
  const over         = budgetStatus.filter((b) => b.isOver);
  const alerts       = budgetStatus.filter((b) => b.isAlert);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addBudget({ category: form.category, limit: parseFloat(form.limit), period: 'monthly', alertAt: parseInt(form.alertAt) });
    setForm({ category: 'Other', limit: '', alertAt: '80' });
    setShowAdd(false);
  };

  return (
    <div>
      {/* ── Alert banners ──────────────────────────────────── */}
      {over.length > 0 && (
        <div className="card card-sm section-gap fade-up" style={{ borderLeft: '3px solid var(--coral)', background: 'var(--coral-light)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangle size={16} color="var(--coral)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--coral)' }}>{over.length} budget{over.length > 1 ? 's' : ''} exceeded</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{over.map((b) => b.category).join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <p className="card-label">Planning</p>
          <h2 style={{ fontFamily: 'var(--display)', fontWeight: 300, fontSize: '1.8rem', letterSpacing: '-0.02em' }}>Monthly Budgets</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add Budget
        </button>
      </div>

      {/* ── Budget cards ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }} className="fade-up">
        {budgetStatus.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <p className="empty-title">No budgets yet</p>
              <p className="empty-sub">Set spending limits to stay on track</p>
            </div>
          </div>
        ) : (
          budgetStatus.map((b) => {
            const color = b.isOver ? 'var(--coral)' : b.isAlert ? 'var(--amber)' : 'var(--teal)';
            return (
              <div key={b.id} className="card" style={{ borderTop: `3px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>{b.category}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--mono)', marginTop: 2 }}>Monthly</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    {b.isOver ? <AlertTriangle size={16} color="var(--coral)" /> : <CheckCircle size={16} color="var(--teal)" />}
                    <button onClick={() => deleteBudget(b.id)} style={{ color: 'var(--muted)' }}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Spent</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color }}>{formatCurrency(b.spent)}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${b.percentage}%`, background: color }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Limit: {formatCurrency(b.limit)}</span>
                  <span style={{ color: b.isOver ? 'var(--coral)' : 'var(--text-secondary)' }}>
                    {b.isOver ? `Over by ${formatCurrency(b.spent - b.limit)}` : `${formatCurrency(b.remaining)} left`}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Add Budget Modal ─────────────────────────────────── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontFamily: 'var(--display)', fontWeight: 300, marginBottom: '1.5rem' }}>Add Budget</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Limit (CAD)</label>
                <input className="form-input" type="number" min="1" step="10" placeholder="e.g. 500" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Alert at {form.alertAt}% of limit</label>
                <input type="range" min="50" max="95" step="5" value={form.alertAt} onChange={(e) => setForm({ ...form, alertAt: e.target.value })} style={{ width: '100%', accentColor: 'var(--teal)' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
