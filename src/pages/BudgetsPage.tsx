import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { useTrackrStore } from '../store';
import { getBudgetStatus, formatCurrency, CATEGORY_COLOURS } from '../utils';
import type { Budget, Category } from '../types';

const CATEGORIES: Category[] = [
  'Housing', 'Food & Dining', 'Transportation', 'Shopping',
  'Entertainment', 'Healthcare', 'Utilities', 'Education',
  'Travel', 'Savings', 'Investment', 'Other',
];

const PERIODS = ['monthly', 'weekly', 'yearly'] as const;

const EMPTY_FORM = {
  category: 'Food & Dining' as Category,
  limit: '',
  period: 'monthly' as Budget['period'],
  alertAt: '80',
};

export function BudgetsPage() {
  const { budgets, transactions, addBudget, updateBudget, deleteBudget } = useTrackrStore();
  const [showForm, setShowForm]   = useState(false);
  const [editing,  setEditing]    = useState<Budget | null>(null);
  const [form,     setForm]       = useState(EMPTY_FORM);

  const statuses = useMemo(() => getBudgetStatus(budgets, transactions), [budgets, transactions]);

  const overCount   = statuses.filter((s) => s.isOver).length;
  const alertCount  = statuses.filter((s) => s.isAlert && !s.isOver).length;
  const totalLimit  = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent  = statuses.reduce((s, b) => s + b.spent, 0);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (b: Budget) => {
    setEditing(b);
    setForm({ category: b.category, limit: String(b.limit), period: b.period, alertAt: String(b.alertAt) });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      category: form.category,
      limit:    parseFloat(form.limit) || 0,
      period:   form.period,
      alertAt:  parseInt(form.alertAt) || 80,
    };
    if (editing) {
      updateBudget(editing.id, payload);
    } else {
      addBudget(payload);
    }
    closeForm();
  };

  return (
    <div className="fade-up">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <p className="card-label">Budgets</p>
          <h1 className="card-title" style={{ fontSize: '1.4rem', fontWeight: 600 }}>Spending Limits</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <Plus size={15} /> Add Budget
        </button>
      </div>

      {/* ── Summary stats ──────────────────────────────────────── */}
      <div className="stats-grid section-gap">
        <div className="card card-sm">
          <p className="card-label">Total Budgeted</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCurrency(totalLimit)}</p>
          <p className="card-label" style={{ marginTop: 4 }}>{budgets.length} budgets</p>
        </div>
        <div className="card card-sm">
          <p className="card-label">Total Spent</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: totalSpent > totalLimit ? 'var(--coral)' : 'inherit' }}>
            {formatCurrency(totalSpent)}
          </p>
          <p className="card-label" style={{ marginTop: 4 }}>this period</p>
        </div>
        <div className="card card-sm">
          <p className="card-label">Over Budget</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: overCount > 0 ? 'var(--coral)' : 'inherit' }}>
            {overCount}
          </p>
          <p className="card-label" style={{ marginTop: 4 }}>categories</p>
        </div>
        <div className="card card-sm">
          <p className="card-label">Near Limit</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: alertCount > 0 ? 'var(--amber)' : 'inherit' }}>
            {alertCount}
          </p>
          <p className="card-label" style={{ marginTop: 4 }}>categories</p>
        </div>
      </div>

      {/* ── Budget cards ────────────────────────────────────────── */}
      {statuses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <Target size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
          <p>No budgets yet. Add one to start tracking your spending limits.</p>
        </div>
      ) : (
        <div className="grid-2" style={{ gap: '1rem' }}>
          {statuses.map((s) => {
            const colour = s.isOver ? 'var(--coral)' : s.isAlert ? 'var(--amber)' : 'var(--teal)';
            const catColour = CATEGORY_COLOURS[s.category] ?? 'var(--teal)';
            return (
              <div key={s.id} className="card card-sm fade-up" style={{ position: 'relative' }}>
                {/* Category + actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: catColour, display: 'inline-block', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.category}</p>
                      <p className="card-label" style={{ marginTop: 1 }}>{s.period}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {s.isOver ? (
                      <AlertTriangle size={15} color="var(--coral)" />
                    ) : s.isAlert ? (
                      <AlertTriangle size={15} color="var(--amber)" />
                    ) : (
                      <CheckCircle size={15} color="var(--teal)" />
                    )}
                    <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => openEdit(s)}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn-icon" style={{ width: 28, height: 28, color: 'var(--coral)' }} onClick={() => deleteBudget(s.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-bar" style={{ marginBottom: '0.5rem' }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(s.percentage, 100)}%`, background: colour }}
                  />
                </div>

                {/* Amounts */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <span>
                    <span style={{ fontWeight: 600, color: colour }}>{formatCurrency(s.spent)}</span> spent
                  </span>
                  <span>{formatCurrency(s.remaining >= 0 ? s.remaining : 0)} left</span>
                  <span>{formatCurrency(s.limit)} limit</span>
                </div>

                {/* Alert threshold note */}
                <p className="card-label" style={{ marginTop: '0.5rem' }}>
                  {Math.round(s.percentage)}% used · alert at {s.alertAt}%
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit modal ──────────────────────────────────── */}
      {showForm && (
        <div onClick={closeForm} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }}>
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(420px, 90vw)', zIndex: 201 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>{editing ? 'Edit Budget' : 'New Budget'}</h2>
              <button className="btn-icon" onClick={closeForm}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Limit ($)</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 500"
                  value={form.limit}
                  onChange={(e) => setForm({ ...form, limit: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Period</label>
                <select
                  className="form-select"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value as Budget['period'] })}
                >
                  {PERIODS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Alert threshold (%)</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g. 80"
                  value={form.alertAt}
                  onChange={(e) => setForm({ ...form, alertAt: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">{editing ? 'Save' : 'Add Budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
