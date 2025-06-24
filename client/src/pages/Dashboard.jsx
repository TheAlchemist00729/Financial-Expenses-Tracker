import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExpense, deleteExpense, fetchExpenses, fetchSummary } from '../services/expenses';
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
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [userModalView, setUserModalView] = useState('menu'); // 'menu', 'password', 'username'
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const [newUsername, setNewUsername] = useState('');
  const [passwordForUsername, setPasswordForUsername] = useState('');
  const [updatingUsername, setUpdatingUsername] = useState(false);
  
  const [userError, setUserError] = useState('');
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

  const convertToCSV = (data, type = 'expenses') => {
    if (!data || data.length === 0) {
      if (type === 'budgets') {
        return 'Category,Budget Amount,Spent Amount,Remaining\n';
      }
      return 'Date,Category,Description,Amount\n';
    }
    
    if (type === 'budgets') {
      const headers = 'Category,Budget Amount,Spent Amount,Remaining\n';
      const rows = data.map(budget => {
        const category = budget.category || '';
        const budgetAmount = budget.amount || 0;
        const spentAmount = budget.spent_amount || budget.spent || 0;
        const remaining = budgetAmount - spentAmount;
        return `${category},${budgetAmount},${spentAmount},${remaining}`;
      }).join('\n');
      return headers + rows;
    }
    
    const headers = 'Date,Category,Description,Amount\n';
    const rows = data.map(expense => {
      const date = expense.date || '';
      const category = expense.category || '';
      let description = expense.description || '';
      
      if (description && (description.includes(',') || description.includes('"') || description.includes('\n'))) {
        description = `"${description.replace(/"/g, '""')}"`;
      }
      
      const amount = expense.amount || '';
      return `${date},${category},${description},${amount}`;
    }).join('\n');
    
    return headers + rows;
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExpenses = async () => {
    if (!expenses.length) {
      setError('No expenses to export');
      return;
    }

    try {
      const response = await fetch('/api/reports/expenses/csv', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const csvContent = await response.text();
        const filename = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csvContent, filename);
        return;
      }
    } catch (err) {
      console.warn('Backend CSV endpoint not available, using frontend generation');
    }

    const csvContent = convertToCSV(expenses, 'expenses');
    const filename = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleExportBudgets = async () => {
    if (!budgetStatus.length) {
      setError('No budgets to export');
      return;
    }

    try {
      const response = await fetch('/api/reports/budgets/csv', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const csvContent = await response.text();
        const filename = `budgets_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csvContent, filename);
        return;
      }
    } catch (err) {
      console.warn('Backend CSV endpoint not available, using frontend generation');
    }

    const csvContent = convertToCSV(budgetStatus, 'budgets');
    const filename = `budgets_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleExportAll = async () => {
    try {
      const response = await fetch('/api/reports/comprehensive', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const csvContent = await response.text();
        const filename = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csvContent, filename);
        return;
      }
    } catch (err) {
      console.warn('Backend comprehensive report not available, using frontend generation');
    }

    const reportData = [];
    
    reportData.push('FINANCIAL SUMMARY REPORT');
    reportData.push(`Generated on: ${new Date().toLocaleString()}`);
    reportData.push(`User: ${user?.email || user?.username || 'Unknown'}`);
    reportData.push('');
    
    if (budgetStatus.length > 0) {
      reportData.push('BUDGET SUMMARY');
      reportData.push('Category,Budget Amount,Spent Amount,Remaining');
      budgetStatus.forEach(budget => {
        const category = budget.category || '';
        const budgetAmount = budget.amount || 0;
        const spentAmount = budget.spent_amount || budget.spent || 0;
        const remaining = budgetAmount - spentAmount;
        reportData.push(`${category},${budgetAmount},${spentAmount},${remaining}`);
      });
      reportData.push('');
    }
    
    if (expenses.length > 0) {
      reportData.push('EXPENSES DETAIL');
      reportData.push('Date,Category,Description,Amount');
      expenses.forEach(expense => {
        const date = expense.date || '';
        const category = expense.category || '';
        let description = expense.description || '';
        
        if (description && (description.includes(',') || description.includes('"') || description.includes('\n'))) {
          description = `"${description.replace(/"/g, '""')}"`;
        }
        
        const amount = expense.amount || '';
        reportData.push(`${date},${category},${description},${amount}`);
      });
    }
    
    const csvContent = reportData.join('\n');
    const filename = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  };

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

  const handlePasswordChange = async (e) => {
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
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Password change failed');
      }
      
      // Reset form and show success
      resetUserModal();
      setError('Password updated successfully!');
      
    } catch (err) {
      console.error('Password change error:', err);
      setUserError(err.message || 'Password change failed');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setUserError('');
    
    if (!newUsername.trim()) {
      setUserError('Username cannot be empty');
      return;
    }
    
    if (newUsername.length < 3) {
      setUserError('Username must be at least 3 characters long');
      return;
    }
    
    setUpdatingUsername(true);
    try {
      const response = await fetch('/api/auth/change-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          newUsername: newUsername.trim(),
          password: passwordForUsername
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Username change failed');
      }
      
      // Reset form and show success
      resetUserModal();
      setError('Username updated successfully!');
      
      // Optionally update the user object if you have a callback
      // This would depend on how your user state is managed
      
    } catch (err) {
      console.error('Username change error:', err);
      setUserError(err.message || 'Username change failed');
    } finally {
      setUpdatingUsername(false);
    }
  };

  const handleCreateBudgets = () => {
    navigate('/budgets');
  };

  const handleViewInsights = () => {
    navigate('/insights');
  };

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    
    // Call the logout callback if provided
    if (onLogout) {
      onLogout();
    }
    
    // Navigate to login page
    navigate('/login');
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

  const renderUserModal = () => {
    if (!showUserModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>
              {userModalView === 'menu' && 'Account Management'}
              {userModalView === 'password' && 'Change Password'}
              {userModalView === 'username' && 'Change Username'}
            </h2>
            <button
              onClick={resetUserModal}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          {userModalView === 'menu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '6px',
                marginBottom: '1rem'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Current Account:</div>
                <div style={{ color: '#666' }}>
                  {user?.username && <div>Username: {user.username}</div>}
                  {user?.email && <div>Email: {user.email}</div>}
                </div>
              </div>
              
              <button
                onClick={() => setUserModalView('password')}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                🔒 Change Password
              </button>
              
              <button
                onClick={() => setUserModalView('username')}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                👤 Change Username
              </button>
            </div>
          )}

          {userModalView === 'password' && (
            <form onSubmit={handlePasswordChange}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Current Password:
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  New Password:
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Confirm New Password:
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {userError && (
                <div style={{
                  color: '#721c24',
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}>
                  {userError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setUserModalView('menu')}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={updatingPassword}
                  style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: updatingPassword ? 'not-allowed' : 'pointer',
                    opacity: updatingPassword ? 0.6 : 1
                  }}
                >
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {userModalView === 'username' && (
            <form onSubmit={handleUsernameChange}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  New Username:
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  minLength={3}
                  placeholder={user?.username || 'Enter new username'}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Confirm Password:
                </label>
                <input
                  type="password"
                  value={passwordForUsername}
                  onChange={(e) => setPasswordForUsername(e.target.value)}
                  required
                  placeholder="Enter your current password"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                  Password required for security verification
                </div>
              </div>

              {userError && (
                <div style={{
                  color: '#721c24',
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}>
                  {userError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setUserModalView('menu')}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={updatingUsername}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    cursor: updatingUsername ? 'not-allowed' : 'pointer',
                    opacity: updatingUsername ? 0.6 : 1
                  }}
                >
                  {updatingUsername ? 'Updating...' : 'Update Username'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '1rem' }}>
      {/* Header with user info and controls */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1rem',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Dashboard</h1>
          {user && (
            <p style={{ margin: '0.25rem 0 0 0', color: '#777', fontSize: '0.875rem' }}>
              Welcome back, {user.email || user.username || 'User'}!
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowUserModal(true)}
            style={{
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}
          >
            👤 Account
          </button>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '0.75rem', 
        marginBottom: '1.5rem',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
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
          📊 Manage Budgets
        </button>
        
        <button
          onClick={handleViewInsights}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          📈 Budget Insights
        </button>
      </div>

      {/* Export buttons */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius:'8px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ width: '100%', textAlign: 'center', margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
          📥 Export Data
        </h3>
        <button
          onClick={handleExportExpenses}
          disabled={!expenses.length}
          style={{
            backgroundColor: expenses.length ? '#6f42c1' : '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: expenses.length ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}
        >
          📊 Export Expenses
        </button>
        
        <button
          onClick={handleExportBudgets}
          disabled={!budgetStatus.length}
          style={{
            backgroundColor: budgetStatus.length ? '#fd7e14' : '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: budgetStatus.length ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}
        >
          💰 Export Budgets
        </button>
        
        <button
          onClick={handleExportAll}
          disabled={!expenses.length && !budgetStatus.length}
          style={{
            backgroundColor: (expenses.length || budgetStatus.length) ? '#20c997' : '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: (expenses.length || budgetStatus.length) ? 'pointer' : 'not-allowed',
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}
        >
          📋 Export All Data
        </button>
      </div>

      {error && (
        <div style={{ 
          color: error.includes('successfully') ? '#155724' : '#721c24',
          backgroundColor: error.includes('successfully') ? '#d4edda' : '#f8d7da',
          border: error.includes('successfully') ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
          padding: '0.75rem',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem',
          color: '#777'
        }}>
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

          <div>
            <h3 style={{ 
              borderBottom: '2px solid #007bff', 
              paddingBottom: '0.5rem',
              marginBottom: '1rem'
            }}>
              Recent Expenses
            </h3>
            {expenses.length ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {expenses.map((e) => (
                  <div key={e.id} style={getExpenseStyle(e)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                        {e.description}
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#777' }}>
                        <span>${e.amount}</span>
                        {e.category && <span>({e.category})</span>}
                        {e.date && <span>{new Date(e.date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(e.id)}
                      disabled={deletingId === e.id}
                      style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '0.375rem 0.75rem',
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
                textAlign: 'center', 
                padding: '2rem',
                color: '#777',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <p style={{ margin: 0, fontSize: '1.125rem' }}>No expenses yet</p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
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