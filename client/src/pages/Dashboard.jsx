import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExpense, deleteExpense, fetchExpenses, fetchSummary } from '../services/expenses';
import { fetchBudgetStatus } from '../services/budgets';
import ExpenseForm from '../components/ExpenseForm';
import SummaryChart from '../components/SummaryChart';

export default function Dashboard({ user }) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();

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

      // Fetch budget status
      console.log('[Dashboard] Fetching budget status...');
      try {
        const budgetRes = await fetchBudgetStatus();
        console.log('[Dashboard] Fetched budget status:', budgetRes.data);
        setBudgetStatus(budgetRes.data.budgetStatus || []);
      } catch (budgetErr) {
        console.warn('[Dashboard] Budget status fetch failed (might be no budgets):', budgetErr);
        setBudgetStatus([]);
      }

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
      try {
        const budgetRes = await fetchBudgetStatus();
        setBudgetStatus(budgetRes.data.budgetStatus || []);
      } catch (budgetErr) {
        console.warn('[Dashboard] Budget status refresh failed:', budgetErr);
      }
    } catch (err) {
      console.error('[Dashboard] delete error:', err);
      setError('Deletion failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateBudgets = () => {
    navigate('/budgets');
  };

  const getExpenseStyle = (expense) => {
    const baseStyle = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem',
      marginBottom: '0.5rem',
      borderRadius: '4px',
      border: '1px solid #eee',
    };

    const relatedBudget = budgetStatus.find(budget => {
      if (!budget.category) return true;
      return budget.category.toLowerCase() === expense.category?.toLowerCase();
    });

    if (relatedBudget && relatedBudget.alert_type) {
      if (relatedBudget.alert_type === 'exceeded') {
        return {
          ...baseStyle,
          backgroundColor: '#ffebee',
          borderColor: '#f44336',
          borderWidth: '2px'
        };
      } else if (relatedBudget.alert_type === 'warning') {
        return {
          ...baseStyle,
          backgroundColor: '#fff3e0',
          borderColor: '#ff9800',
          borderWidth: '2px'
        };
      }
    }

    return baseStyle;
  };

  const renderBudgetAlerts = () => {
    if (!budgetStatus || budgetStatus.length === 0) {
      return null;
    }

    const alerts = budgetStatus.filter(budget => budget.alert_type);
    if (alerts.length === 0) return null;

    return (
      <div style={{ marginBottom: '1rem' }}>
        <h3>Budget Alerts</h3>
        {alerts.map((budget) => (
          <div
            key={budget.id}
            style={{
              padding: '0.75rem',
              marginBottom: '0.5rem',
              borderRadius: '4px',
              border: '1px solid',
              borderColor: budget.alert_type === 'exceeded' ? '#f44336' : '#ff9800',
              backgroundColor: budget.alert_type === 'exceeded' ? '#ffebee' : '#fff3e0',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {budget.alert_type === 'exceeded' ? '🚨 Budget Exceeded!' : '⚠️ Budget Warning!'}
            </div>
            <div>
              <strong>{budget.name}</strong>: ${budget.spent_amount?.toFixed(2) || '0.00'} / ${budget.amount?.toFixed(2) || '0.00'}
              {budget.category && ` (${budget.category})`}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>
              {budget.alert_type === 'exceeded' 
                ? 'You have exceeded your budget limit!' 
                : `You're at ${Math.round((budget.spent_amount / budget.amount) * 100)}% of your budget limit.`
              }
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Dashboard</h1>
        <button
          onClick={handleCreateBudgets}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Create Budgets
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Loading data...</p>
      ) : (
        <>
          {renderBudgetAlerts()}
          
          <ExpenseForm onSubmit={handleAdd} disabled={adding} />
          <SummaryChart data={summary} />

          <h3>Recent Expenses</h3>
          {expenses.length ? (
            expenses.map((e) => (
              <div key={e.id} style={getExpenseStyle(e)}>
                <span>
                  {e.description} — ${e.amount}
                  {e.category && (
                    <span style={{ color: '#666', fontSize: '0.9em' }}>
                      {' '}({e.category})
                    </span>
                  )}
                </span>
                <button
                  onClick={() => handleDelete(e.id)}
                  disabled={deletingId === e.id}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    cursor: deletingId === e.id ? 'not-allowed' : 'pointer'
                  }}
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

