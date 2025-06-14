import React, { useEffect, useState } from 'react';
import { createExpense, deleteExpense, fetchExpenses, fetchSummary } from '../services/expenses';
import ExpenseForm from '../components/ExpenseForm';
import SummaryChart from '../components/SummaryChart';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [adding, setAdding] = useState(false);

  const loadData = async () => {
  setError('');
  setLoading(true);
  try {
    console.log('[Dashboard] Fetching expenses...');
    const expRes = await fetchExpenses();
    console.log('[Dashboard] Fetched expenses:', expRes.data);

    console.log('[Dashboard] Fetching summary...');
    const sumRes = await fetchSummary();
    console.log('[Dashboard] Fetched summary:', sumRes.data);

    setExpenses(expRes.data.expenses);
    setSummary(sumRes.data.summary);
  } catch (err) {
    console.error('[Dashboard] loadData error:', err);
    setError('Failed to load data');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (data) => {
    setError('');
    setAdding(true);
    try {
      await createExpense(data);
      await loadData();
    } catch (err) {
      console.error('[Dashboard] add error:', err);
      setError(err.response?.data?.error || 'Invalid data');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    setError('');
    setDeletingId(id);
    try {
      await deleteExpense(id);
      setExpenses((exps) => exps.filter((e) => e.id !== id));
    } catch (err) {
      console.error('[Dashboard] delete error:', err);
      setError('Deletion failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem' }}>
      <h1>Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          <ExpenseForm onSubmit={handleAdd} disabled={adding} />
          <SummaryChart data={summary} />

          {expenses.length ? (
            expenses.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span>
                  {e.description} — ${e.amount}
                </span>
                <button
                  onClick={() => handleDelete(e.id)}
                  disabled={deletingId === e.id}
                >
                  {deletingId === e.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ))
          ) : (
            <p>No expenses yet.</p>
          )}
        </>
      )}
    </div>
  );
}

