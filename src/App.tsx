import { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, ArrowLeftRight, PieChart, Target, Bell, Menu, X, Moon, Sun, Download } from 'lucide-react';
import { useTrackrStore } from './store';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BudgetsPage } from './pages/BudgetsPage';
import { formatCurrency } from './utils';
import './index.css';

type Page = 'dashboard' | 'transactions' | 'analytics' | 'budgets';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight  },
  { id: 'analytics',   label: 'Analytics',    icon: PieChart        },
  { id: 'budgets',     label: 'Budgets',       icon: Target          },
] as const;

export default function App() {
  const [page,        setPage]    = useState<Page>('dashboard');
  const [sidebarOpen, setSidebar] = useState(false);

  const { theme, toggleTheme, notifications, accounts, markNotificationRead, clearNotifications } = useTrackrStore();
  const unread = notifications.filter((n) => !n.read).length;
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className={`app ${theme}`}>
      {/* ── Mobile overlay ───────────────────────────────────── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebar(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-mark" style={{ fontSize: 11 }}>BN</span>
            <span className="logo-text">BN TrackR</span>
          </div>
          <button className="close-btn" onClick={() => setSidebar(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Balance summary */}
        <div className="sidebar-balance">
          <p className="balance-label">Net Worth</p>
          <p className="balance-amount">{formatCurrency(totalBalance)}</p>
          <p className="balance-sub">Across {accounts.length} accounts</p>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => { setPage(id); setSidebar(false); }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="sidebar-footer">
          <button className="footer-btn" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
          <a
            className="footer-btn"
            href="https://github.com/Zinniie"
            target="_blank"
            rel="noreferrer"
          >
            <span className="gh-icon">{ }</span>
            <span>GitHub</span>
          </a>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="main">
        {/* Top bar */}
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebar(true)}>
            <Menu size={20} />
          </button>
          <div className="topbar-title">
            {NAV_ITEMS.find((n) => n.id === page)?.label}
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button className="icon-btn notif-btn" title="Notifications" onClick={() => setShowNotif((v) => !v)}>
                <Bell size={18} />
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </button>
              {showNotif && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 320, maxHeight: 400, overflowY: 'auto',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                  zIndex: 100,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
                    {notifications.length > 0 && (
                      <button onClick={clearNotifications} style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 500 }}>
                        Clear all
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--border)',
                        background: n.read ? 'transparent' : 'rgba(29,158,117,0.04)',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</p>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.4 }}>{n.message}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--mono)' }}>
                            {new Date(n.createdAt).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!n.read && (
                          <button onClick={() => markNotificationRead(n.id)} style={{ color: 'var(--muted)', flexShrink: 0, padding: 2 }}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="page-content">
          {page === 'dashboard'    && <DashboardPage    onNavigate={setPage} />}
          {page === 'transactions' && <TransactionsPage />}
          {page === 'analytics'   && <AnalyticsPage    />}
          {page === 'budgets'     && <BudgetsPage       />}
        </div>
      </main>
    </div>
  );
}
