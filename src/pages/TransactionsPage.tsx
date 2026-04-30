import { useState, useMemo, useRef } from "react";
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Papa from "papaparse";
import { useTrackrStore } from "../store";
import {
  filterTransactions,
  getCategorySummary,
  exportToCSV,
  formatCurrency,
  getDateRangeFromPreset,
} from "../utils";
import type { Transaction, Category, TransactionType } from "../types";

const CATEGORIES: Category[] = [
  "Housing",
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Healthcare",
  "Utilities",
  "Education",
  "Travel",
  "Savings",
  "Investment",
  "Income",
  "Other",
];

export function TransactionsPage() {
  const {
    transactions,
    filter,
    setFilter,
    deleteTransaction,
    importTransactions,
    addTransaction,
  } = useTrackrStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => filterTransactions(transactions, filter),
    [transactions, filter],
  );

  // ── CSV Import ────────────────────────────────────────────
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        const parsed = rows.map((r) => ({
          date: r.Date || r.date || new Date().toISOString().split("T")[0],
          description: r.Description || r.description || r.Payee || "Imported",
          amount: parseFloat(r.Amount || r.amount || "0"),
          type: (parseFloat(r.Amount || "0") >= 0
            ? "income"
            : "expense") as TransactionType,
          category: (r.Category || r.category || "Other") as Category,
          account: r.Account || r.account || "acc-1",
        }));
        importTransactions(parsed);
        alert(`Imported ${parsed.length} transactions.`);
      },
    });
    e.target.value = "";
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const deleteSelected = () => {
    selected.forEach((id) => deleteTransaction(id));
    setSelected(new Set());
  };

  return (
    <div>
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: "1.5rem",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search
            size={15}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--muted)",
            }}
          />
          <input
            className="form-input"
            style={{ paddingLeft: 36, height: 40 }}
            placeholder="Search transactions..."
            value={filter.search}
            onChange={(e) => setFilter({ search: e.target.value })}
          />
        </div>

        {/* Period selector */}
        <select
          className="form-input form-select"
          style={{ width: 160, height: 40 }}
          value={filter.preset}
          onChange={(e) => {
            const preset = e.target.value as any;
            setFilter({ preset, dateRange: getDateRangeFromPreset(preset) });
          }}
        >
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="last_3_months">Last 3 Months</option>
          <option value="last_6_months">Last 6 Months</option>
          <option value="this_year">This Year</option>
        </select>

        <button
          className="btn btn-outline btn-sm"
          onClick={() => setShowFilter(!showFilter)}
        >
          <Filter size={14} /> Filter{" "}
          {filter.categories.length > 0 && `(${filter.categories.length})`}
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => exportToCSV(filtered)}
        >
          <Download size={14} /> Export
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={14} /> Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={handleImport}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAdd(true)}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* ── Filter panel ────────────────────────────────────── */}
      {showFilter && (
        <div className="card card-sm section-gap">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              Filter by Category
            </span>
            <button
              onClick={() => {
                setFilter({ categories: [] });
                setShowFilter(false);
              }}
              style={{ color: "var(--muted)", fontSize: 12 }}
            >
              Clear
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const cats = filter.categories.includes(cat)
                    ? filter.categories.filter((c) => c !== cat)
                    : [...filter.categories, cat];
                  setFilter({ categories: cats });
                }}
                className={`chip ${filter.categories.includes(cat) ? "chip-teal" : "chip-navy"}`}
                style={{ cursor: "pointer" }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Bulk actions ────────────────────────────────────── */}
      {selected.size > 0 && (
        <div
          className="card card-sm section-gap"
          style={{
            background: "var(--amber-light)",
            borderColor: "rgba(186,117,23,0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--amber)" }}>
              {selected.size} selected
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-sm"
                style={{
                  color: "var(--coral)",
                  borderColor: "var(--coral)",
                  border: "1px solid",
                }}
                onClick={deleteSelected}
              >
                <Trash2 size={13} /> Delete
              </button>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setSelected(new Set())}
              >
                <X size={13} /> Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p className="card-label">Transactions</p>
            <p className="card-title">{filtered.length} records</p>
          </div>
        </div>
        <div className="table-wrap">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p className="empty-title">No transactions found</p>
              <p className="empty-sub">
                Try adjusting your filters or add a new transaction
              </p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(tx.id)}
                        onChange={() => toggleSelect(tx.id)}
                        style={{ accentColor: "var(--teal)" }}
                      />
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 12,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {tx.date}
                    </td>
                    <td style={{ fontWeight: 500 }}>{tx.description}</td>
                    <td>
                      <span
                        className={`badge ${tx.type === "income" ? "badge-income" : tx.type === "expense" ? "badge-expense" : "badge-transfer"}`}
                      >
                        {tx.category}
                      </span>
                    </td>
                    <td
                      style={{ fontSize: 12, color: "var(--text-secondary)" }}
                    >
                      {tx.account}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        className={
                          tx.type === "income"
                            ? "amount-pos"
                            : tx.type === "expense"
                              ? "amount-neg"
                              : "amount-neutral"
                        }
                      >
                        {tx.type === "income"
                          ? "+"
                          : tx.type === "expense"
                            ? "-"
                            : ""}
                        {formatCurrency(Math.abs(tx.amount))}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        style={{ color: "var(--muted)", padding: 4 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add Transaction Modal ────────────────────────────── */}
      {showAdd && (
        <AddTransactionModal
          onClose={() => setShowAdd(false)}
          onAdd={addTransaction}
        />
      )}
    </div>
  );
}

function AddTransactionModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (tx: any) => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense" as TransactionType,
    category: "Other" as Category,
    account: "acc-1",
    note: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      ...form,
      amount:
        form.type === "expense"
          ? -Math.abs(parseFloat(form.amount))
          : Math.abs(parseFloat(form.amount)),
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 480 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--display)",
              fontWeight: 300,
              fontSize: "1.3rem",
            }}
          >
            Add Transaction
          </h2>
          <button onClick={onClose} style={{ color: "var(--muted)" }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-input form-select"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as TransactionType })
                }
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              placeholder="e.g. Grocery Store, Phone Bill, Gym Membership..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Amount (CAD)</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input form-select"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as Category })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note (optional)</label>
            <input
              className="form-input"
              placeholder="Any additional notes..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginTop: "1.5rem",
            }}
          >
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
