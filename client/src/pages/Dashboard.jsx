import React, { useEffect, useState } from 'react';
import { createExpense, deleteExpense, fetchExpenses, fetchSummary } from '../services/expenses';
import ExpenseForm from '../components/ExpenseForm';
import SummaryChart from '../components/SummaryChart';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const [expRes, sumRes] = await Promise.all([fetchExpenses(), fetchSummary()]);
      setExpenses(expRes.data.expenses);
      setSummary(sumRes.data.summary);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAdd = async data => {
    try {
      await createExpense(data);
      await loadData();
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid data');
    }
  };

  const handleDelete = async id => {
    try {
      await deleteExpense(id);
      setExpenses(exps => exps.filter(e => e.id !== id));
    } catch (e) {
      setError('Deletion failed');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Dashboard</h1>
      {error && <div className="text-red-600">{error}</div>}
      <ExpenseForm onSubmit={handleAdd}/>
      <SummaryChart data={summary}/>
      {expenses.length
        ? expenses.map(e => (
            <div key={e.id} className="flex justify-between items-center">
              <span>{e.description} — ${e.amount}</span>
              <button onClick={() => handleDelete(e.id)}>Delete</button>
            </div>
          ))
        : <p>No expenses yet.</p>
      }
    </div>
  );
}

