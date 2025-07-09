import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  fetchSummary
} from '../services/expenses';
import { fetchBudgetStatus } from '../services/budgets';
import ExpenseForm from '../components/ExpenseForm';
import SummaryChart from '../components/SummaryChart';

export default function Dashboard({ user, onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [adding, setAdding] = useState(false);

  // Account‐management modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalView, setUserModalView] = useState('menu'); // 'menu' | 'password' | 'username'
  const [userError, setUserError] = useState('');

  // Password‐change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Username‐change fields
  const [newUsername, setNewUsername] = useState('');
  const [passwordForUsername, setPasswordForUsername] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Load expenses, summary, budgets
  const loadData = async () => {
    setError('');
    setLoading(true);
    try {
      const expRes = await fetchExpenses();
      const sumRes = await fetchSummary();
      setExpenses(expRes.data.expenses);
      setSummary(sumRes.data.summary);

      try {
        const budgetRes = await fetchBudgetStatus();
        setBudgetStatus(budgetRes.data.budgetStatus || []);
      } catch {
        setBudgetStatus([]);
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Add expense
  const handleAdd = async data => {
    setError('');
    setAdding(true);
    try {
      await createExpense(data);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid data');
    } finally {
      setAdding(false);
    }
  };

  // Delete expense
  const handleDelete = async id => {
    setError('');
    setDeletingId(id);
    try {
      await deleteExpense(id);
      setExpenses(exps => exps.filter(e => e.id !== id));
      try {
        const budgetRes = await fetchBudgetStatus();
        setBudgetStatus(budgetRes.data.budgetStatus || []);
      } catch {}
    } catch {
      setError('Deletion failed');
    } finally {
      setDeletingId(null);
    }
  };

  // CSV helpers
  const convertToCSV = (data, type = 'expenses') => {
    if (!data.length) {
      return type === 'budgets'
        ? 'Category,Budget Amount,Spent Amount,Remaining\n'
        : 'Date,Category,Description,Amount\n';
    }

    if (type === 'budgets') {
      const headers = 'Category,Budget Amount,Spent Amount,Remaining\n';
      const rows = data
        .map(b => {
          const cat = b.category || '';
          const budgetAmt = b.amount || 0;
          const spent = b.spent_amount ?? 0;
          const rem = budgetAmt - spent;
          return `${cat},${budgetAmt},${spent},${rem}`;
        })
        .join('\n');
      return headers + rows;
    }

    const headers = 'Date,Category,Description,Amount\n';
    const rows = data
      .map(exp => {
        let desc = exp.description || '';
        if (desc.includes(',') || desc.includes('"') || desc.includes('\n')) {
          desc = `"${desc.replace(/"/g, '""')}"`;
        }
        return `${exp.date || ''},${exp.category || ''},${desc},${exp.amount || ''}`;
      })
      .join('\n');
    return headers + rows;
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleExportExpenses = async () => {
    if (!expenses.length) {
      setError('No expenses to export');
      return;
    }
    try {
      const res = await fetch('/api/reports/expenses/csv', {
        method: 'GET',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const text = await res.text();
        downloadCSV(text, `expenses_${new Date().toISOString().split('T')[0]}.csv`);
        return;
      }
    } catch {}
    const csv = convertToCSV(expenses, 'expenses');
    downloadCSV(csv, `expenses_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportBudgets = async () => {
    if (!budgetStatus.length) {
      setError('No budgets to export');
      return;
    }
    try {
      const res = await fetch('/api/reports/budgets/csv', {
        method: 'GET',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const text = await res.text();
        downloadCSV(text, `budgets_${new Date().toISOString().split('T')[0]}.csv`);
        return;
      }
    } catch {}
    const csv = convertToCSV(budgetStatus, 'budgets');
    downloadCSV(csv, `budgets_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportAll = async () => {
    try {
      const res = await fetch('/api/reports/comprehensive', {
        method: 'GET',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const text = await res.text();
        downloadCSV(text, `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
        return;
      }
    } catch {}
    const report = [];
    report.push('FINANCIAL SUMMARY REPORT');
    report.push(`Generated on: ${new Date().toLocaleString()}`);
    report.push(`User: ${user.email || user.username || 'Unknown'}`);
    report.push('');
    if (budgetStatus.length) {
      report.push('BUDGET SUMMARY');
      report.push('Category,Budget Amount,Spent Amount,Remaining');
      budgetStatus.forEach(b => {
        const spent = b.spent_amount ?? 0;
        report.push(`${b.category || ''},${b.amount || 0},${spent},${(b.amount || 0) - spent}`);
      });
      report.push('');
    }
    if (expenses.length) {
      report.push('EXPENSES DETAIL');
      report.push('Date,Category,Description,Amount');
      expenses.forEach(exp => {
        let desc = exp.description || '';
        if (desc.includes(',') || desc.includes('"') || desc.includes('\n')) {
          desc = `"${desc.replace(/"/g, '""')}"`;
        }
        report.push(`${exp.date || ''},${exp.category || ''},${desc},${exp.amount || ''}`);
      });
    }
    downloadCSV(report.join('\n'), `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Account‐modal handlers
  const resetUserModal = () => {
    setShowUserModal(false);
    setUserModalView('menu');
    setUserError('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNewUsername('');
    setPasswordForUsername('');
  };

  const handlePasswordChange = async e => {
    e.preventDefault();
    setUserError('');
    if (newPassword !== confirmPassword) {
      setUserError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setUserError('Password must be at least 6 characters long');
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || 'Password change failed');
      }
      resetUserModal();
      setError('Password updated successfully!');
    } catch (err) {
      setUserError(err.message || 'Password change failed');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUsernameChange = async e => {
    e.preventDefault();
    setUserError('');
    if (!newUsername.trim()) {
      setUserError('Username cannot be empty');
      return;
    }
    if (newUsername.trim().length < 3) {
      setUserError('Username must be at least 3 characters long');
      return;
    }
    setUpdatingUsername(true);
    try {
      const res = await fetch('/api/auth/change-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          newUsername: newUsername.trim(),
          password: passwordForUsername
        })
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || 'Username change failed');
      }
      resetUserModal();
      setError('Username updated successfully!');
    } catch (err) {
      setUserError(err.message || 'Username change failed');
    } finally {
      setUpdatingUsername(false);
    }
  };

  // Utility for styling expense items
  const getExpenseStyle = expense => {
    const base = {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem',
      marginBottom: '0.5rem',
      borderRadius: '4px',
      border: '1px solid #eee'
    };
    const related = budgetStatus.find(
      b => !b.category || b.category.toLowerCase() === expense.category?.toLowerCase()
    );
    if (related?.alert_type === 'exceeded') {
      return { ...base, backgroundColor: '#ffebee', borderColor: '#f44336', borderWidth: '2px' };
    }
    if (related?.alert_type === 'warning') {
      return { ...base, backgroundColor: '#fff3e0', borderColor: '#ff9800', borderWidth: '2px' };
    }
    return base;
  };

  const renderBudgetAlerts = () => {
    if (!budgetStatus.length) return null;
    const alerts = budgetStatus.filter(b => b.alert_type);
    if (!alerts.length) return null;
    return (
      <div style={{ marginBottom: '1rem' }}>
        <h3>Budget Alerts</h3>
        {alerts.map(b => (
          <div
            key={b.id}
            style={{
              padding: '0.75rem',
              marginBottom: '0.5rem',
              borderRadius: '4px',
              border: '1px solid',
              borderColor: b.alert_type === 'exceeded' ? '#f44336' : '#ff9800',
              backgroundColor: b.alert_type === 'exceeded' ? '#ffebee' : '#fff3e0'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
              {b.alert_type === 'exceeded' ? '🚨 Budget Exceeded!' : '⚠️ Budget Warning!'}
            </div>
            <div>
              <strong>{b.name}</strong>: ${b.spent_amount?.toFixed(2) || '0.00'} / $
              {b.amount?.toFixed(2) || '0.00'}
              {b.category && ` (${b.category})`}
            </div>
            <div style={{ fontSize: '0.9em', color: '#666' }}>
              {b.alert_type === 'exceeded'
                ? 'You have exceeded your budget limit!'
                : `You're at ${Math.round((b.spent_amount / b.amount) * 100)}% of your budget limit.`}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderUserModal = () => {
    if (!showUserModal) return null;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
          width: '90%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '1.5rem'
          }}>
            <h2 style={{ margin: 0 }}>
              {userModalView === 'menu' && 'Account Management'}
              {userModalView === 'password' && 'Change Password'}
              {userModalView === 'username' && 'Change Username'}
            </h2>
            <button onClick={resetUserModal} style={{
              background: 'none', border: 'none', fontSize: '1.5rem',
              cursor: 'pointer', color: '#666'
            }}>×</button>
          </div>

          {userModalView === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                padding: '1rem', backgroundColor: '#f8f9fa',
                borderRadius: '6px', marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Current Account:
                </div>
                <div style={{ color: '#666' }}>
                  {user.username && <div>Username: {user.username}</div>}
                  {user.email    && <div>Email: {user.email}</div>}
                </div>
              </div>
              <button
                onClick={() => setUserModalView('password')}
                style={{
                  backgroundColor: '#007bff', color: 'white',
                  border: 'none', padding: '0.75rem 1rem',
                  borderRadius: '4px', cursor: 'pointer',
                  fontSize: '1rem', fontWeight: 'bold'
                }}
              >🔒 Change Password</button>
              <button
                onClick={() => setUserModalView('username')}
                style={{
                  backgroundColor: '#28a745', color: 'white',
                  border: 'none', padding: '0.75rem 1rem',
                  borderRadius: '4px', cursor: 'pointer',
                  fontSize: '1rem', fontWeight: 'bold'
                }}
              >👤 Change Username</button>
            </div>
          )}

          {userModalView === 'password' && (
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {userError && <div style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '0.5rem', borderRadius: '4px' }}>{userError}</div>}
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                disabled={updatingPassword}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                disabled={updatingPassword}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                disabled={updatingPassword}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={resetUserModal}
                  disabled={updatingPassword}
                  style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >Cancel</button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  style={{
                    backgroundColor: '#007bff', color: 'white',
                    border: 'none', padding: '0.5rem 1rem',
                    borderRadius: '4px', cursor: 'pointer'
                  }}
                >{updatingPassword ? 'Updating…' : 'Update Password'}</button>
              </div>
            </form>
          )}

          {userModalView === 'username' && (
            <form onSubmit={handleUsernameChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {userError && <div style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '0.5rem', borderRadius: '4px' }}>{userError}</div>}
              <input
                type="text"
                placeholder="New Username"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                required
                disabled={updatingUsername}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input
                type="password"
                placeholder="Your Current Password"
                value={passwordForUsername}
                onChange={e => setPasswordForUsername(e.target.value)}
                required
                disabled={updatingUsername}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={resetUserModal}
                  disabled={updatingUsername}
                  style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >Cancel</button>
                <button
                  type="submit"
                  disabled={updatingUsername}
                  style={{
                    backgroundColor: '#28a745', color: 'white',
                    border: 'none', padding: '0.5rem 1rem',
                    borderRadius: '4px', cursor: 'pointer'
                  }}
                >{updatingUsername ? 'Updating…' : 'Update Username'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter(e =>
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1rem', padding: '1rem', backgroundColor: '#f8f9fa',
        borderRadius: '8px', border: '1px solid #dee2e6'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Dashboard</h1>
          {user && (
            <p style={{
              margin: '0.25rem 0 0', color: '#777', fontSize: '0.875rem'
            }}>
              Welcome back, {user.email || user.username || 'User'}!
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setShowUserModal(true)} style={{
            backgroundColor: '#17a2b8', color: 'white',
            border: 'none', padding: '0.5rem 1rem',
            borderRadius: '4px', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: 'bold'
          }}>👤 Account</button>
          <button onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            if (onLogout) onLogout();
            navigate('/login');
          }} style={{
            backgroundColor: '#dc3545', color: 'white',
            border: 'none', padding: '0.5rem 1rem',
            borderRadius: '4px', cursor: 'pointer',
            fontSize: '0.875rem', fontWeight: 'bold'
          }}>Logout</button>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: '0.75rem', marginBottom: '1.5rem',
        justifyContent: 'center', flexWrap: 'wrap'
      }}>
        <button onClick={() => navigate('/budgets')} style={{
          backgroundColor: '#28a745', color: 'white',
          border: 'none', padding: '0.75rem 1.5rem',
          borderRadius: '4px', cursor: 'pointer',
          fontSize: '1rem', fontWeight: 'bold'
        }}>📊 Manage Budgets</button>
        <button onClick={() => navigate('/insights')} style={{
          backgroundColor: '#007bff', color: 'white',
          border: 'none', padding: '0.75rem 1.5rem',
          borderRadius: '4px', cursor: 'pointer',
          fontSize: '1rem', fontWeight: 'bold'
        }}>📈 Budget Insights</button>
      </div>

      {/* Export */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
        justifyContent: 'center', flexWrap: 'wrap',
        padding: '1rem', backgroundColor: '#f8f9fa',
        borderRadius: '8px', border: '1px solid #dee2e6'
      }}>
        <h3 style={{
          width: '100%', textAlign: 'center',
          margin: '0 0 1rem', fontSize: '1.1rem'
        }}>📥 Export Data</h3>
        <button
          onClick={handleExportExpenses}
          disabled={!expenses.length}
          style={{
            backgroundColor: expenses.length ? '#6f42c1' : '#6c757d',
            cursor: expenses.length ? 'pointer' : 'not-allowed',
            color: 'white', border: 'none',
            padding: '0.5rem 1rem', borderRadius: '4px',
            fontSize: '0.875rem', fontWeight: 'bold'
          }}
        >📊 Export Expenses</button>
        <button
          onClick={handleExportBudgets}
          style={{
            backgroundColor: budgetStatus.length ? '#fd7e14' : '#6c757d',
            cursor: 'pointer',
            color: 'white', border: 'none',
            padding: '0.5rem 1rem', borderRadius: '4px',
            fontSize: '0.875rem', fontWeight: 'bold'
          }}
        >💰 Export Budgets</button>
        <button
          onClick={handleExportAll}
          disabled={!expenses.length && !budgetStatus.length}
          style={{
            backgroundColor: (expenses.length || budgetStatus.length) ? '#20c997' : '#6c757d',
            color: 'white', border: 'none',
            padding: '0.5rem 1rem', borderRadius: '4px',
            cursor: (expenses.length || budgetStatus.length) ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem', fontWeight: 'bold'
          }}
        >📋 Export All Data</button>
      </div>

      {/* Global error/success banner */}
      {error && (
        <div style={{
          color: error.includes('successfully') ? '#155724' : '#721c24',
          backgroundColor: error.includes('successfully') ? '#d4edda' : '#f8d7da',
          border: error.includes('successfully') ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
          padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem'
        }}>{error}</div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
          Loading data...
        </div>
      ) : (
        <>
          {renderBudgetAlerts()}

          <div style={{ marginBottom: '2rem' }}>
            <ExpenseForm onSubmit={handleAdd} disabled={adding} />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <SummaryChart data={summary} />
          </div>

          {/* Search Bar */}
          <div style={{ margin: '0 auto 1rem', maxWidth: 400, textAlign: 'center' }}>
            <input
              type="text"
              placeholder="Search expenses…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '0.5rem',
                border: '1px solid #ddd', borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <h3 style={{
              borderBottom: '2px solid #007bff',
              paddingBottom: '0.5rem', marginBottom: '1rem'
            }}>Recent Expenses</h3>
            {filteredExpenses.length ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {filteredExpenses.map(e => (
                  <div key={e.id} style={getExpenseStyle(e)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                        {e.description}
                      </div>
                      <div style={{
                        display: 'flex', gap: '1rem',
                        fontSize: '0.875rem', color: '#777'
                      }}>
                        <span>${e.amount}</span>
                        {e.category && <span>({e.category})</span>}
                        {e.date && <span>{new Date(e.date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={deletingId === e.id}
                      style={{
                        backgroundColor: '#dc3545', color: 'white',
                        border: 'none', padding: '0.375rem 0.75rem',
                        borderRadius: '4px',
                        cursor: deletingId === e.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        opacity: deletingId === e.id ? 0.6 : 1
                      }}
                    >
                      {deletingId === e.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center', padding: '2rem', color: '#777',
                backgroundColor: '#f8f9fa', borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <p style={{ margin: 0, fontSize: '1.125rem' }}>No expenses yet</p>
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
                  Add your first expense using the form above!
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {renderUserModal()}
    </div>
  );
}
