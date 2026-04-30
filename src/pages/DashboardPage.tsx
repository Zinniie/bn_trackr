import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { useTrackrStore } from '../store';
import {
  filterTransactions, getCategorySummary,
  getMonthlyTrend, getTotals, formatCurrency, formatCompact, getBudgetStatus,
} from '../utils';

interface Props { onNavigate: (page: any) => void; }

export function DashboardPage({ onNavigate }: Props) {
  const { transactions, budgets, accounts, filter, notifications } = useTrackrStore();

  const filtered  = useMemo(() => filterTransactions(transactions, filter), [transactions, filter]);
  const totals    = useMemo(() => getTotals(filtered), [filtered]);
  const trend     = useMemo(() => getMonthlyTrend(transactions, 6), [transactions]);
  const catData   = useMemo(() => getCategorySummary(filtered).slice(0, 5), [filtered]);
  const budStatus = useMemo(() => getBudgetStatus(budgets, transactions), [budgets, transactions]);
  const recent    = filtered.slice(0, 6);
  const unread    = notifications.filter((n) => !n.read);

  const netColor = totals.net >= 0 ? 'var(--teal)' : 'var(--coral)';

  return (
    <div>
      {/* ── Alerts ─────────────────────────────────────────── */}
      {unread.length > 0 && (
        <div className="section-gap">
          {unread.slice(0, 2).map((n) => (
            <div key={n.id} className={`card card-sm fade-up`}
              style={{ borderLeft: `3px solid ${n.type === 'budget_over' ? 'var(--coral)' : 'var(--amber)'}`, marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{n.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Stats ──────────────────────────────────────────── */}
      <div className="stats-grid fade-up fade-up-1">
        <StatCard label="Income" value={formatCurrency(totals.income)} valueClass="stat-income" sub="This period" icon={<TrendingUp size={16} />} />
        <StatCard label="Expenses" value={formatCurrency(totals.expenses)} valueClass="stat-expense" sub="This period" icon={<TrendingDown size={16} />} />
        <StatCard label="Net" value={(totals.net >= 0 ? '+' : '') + formatCurrency(totals.net)} valueClass="stat-net" sub="Balance" icon={<Minus size={16} />} color={netColor} />
        <StatCard
          label="Total Balance"
          value={formatCompact(accounts.reduce((s, a) => s + a.balance, 0))}
          valueClass="stat-net"
          sub={`${accounts.length} accounts`}
          icon={null}
        />
      </div>

      {/* ── Charts row ─────────────────────────────────────── */}
      <div className="grid-2 section-gap fade-up fade-up-2">
        {/* Income vs Expenses trend */}
        <div className="card">
          <p className="card-label">6-Month Trend</p>
          <p className="card-title">Income vs Expenses</p>
          <div style={{ marginTop: '1.25rem', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tickFormatter={(v) => format(parseISO(v + '-01'), 'MMM')} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: 'var(--muted)' }} axisLine={false} tickLine={false} width={52} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} labelFormatter={(v) => format(parseISO(v + '-01'), 'MMMM yyyy')} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="income"   fill="var(--teal)"  radius={[4,4,0,0]} name="Income"   />
                <Bar dataKey="expenses" fill="var(--coral)" radius={[4,4,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending by category */}
        <div className="card">
          <p className="card-label">Breakdown</p>
          <p className="card-title">Top Categories</p>
          <div style={{ marginTop: '1.25rem', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={entry.colour} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                <Legend formatter={(v) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Budget overview + Recent tx ────────────────────── */}
      <div className="grid-2 section-gap fade-up fade-up-3">
        {/* Budget overview */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <p className="card-label">Budgets</p>
              <p className="card-title">This Month</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('budgets')}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {budStatus.slice(0, 4).map((b) => (
              <BudgetRow key={b.id} budget={b} />
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <p className="card-label">Activity</p>
              <p className="card-title">Recent</p>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => onNavigate('transactions')}>
              See all <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recent.map((tx) => (
              <TxRow key={tx.id} tx={tx} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Accounts ───────────────────────────────────────── */}
      <div className="card fade-up fade-up-4">
        <p className="card-label">Accounts</p>
        <p className="card-title" style={{ marginBottom: '1.25rem' }}>Your Accounts</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {useTrackrStore.getState().accounts.map((acc) => (
            <AccountCard key={acc.id} account={acc} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function StatCard({ label, value, valueClass, sub, icon, color }: any) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${valueClass}`} style={color ? { color } : undefined}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function BudgetRow({ budget }: { budget: any }) {
  const color = budget.isOver ? 'var(--coral)' : budget.isAlert ? 'var(--amber)' : 'var(--teal)';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{budget.category}</span>
        <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color }}>
          ${budget.spent.toFixed(0)} / ${budget.limit}
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${budget.percentage}%`, background: color }} />
      </div>
    </div>
  );
}

function TxRow({ tx }: { tx: any }) {
  const isIncome = tx.type === 'income';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{tx.description}</p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--mono)' }}>{tx.date}</p>
      </div>
      <span className={isIncome ? 'amount-pos' : 'amount-neg'} style={{ fontSize: 14 }}>
        {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
      </span>
    </div>
  );
}

function AccountCard({ account }: { account: any }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: account.colour }} />
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{account.name}</span>
      </div>
      <p style={{ fontFamily: 'var(--display)', fontSize: '1.2rem', fontWeight: 600, color: account.balance >= 0 ? 'var(--text-primary)' : 'var(--coral)' }}>
        {formatCurrency(account.balance)}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'capitalize', marginTop: 2 }}>{account.type}</p>
    </div>
  );
}
