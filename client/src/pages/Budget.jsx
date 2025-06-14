import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBudget, fetchBudgets, deleteBudget } from '../services/budgets';

export default function Budget({ user }) {
  const [budgets, setBudgets] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    period_type: 'weekly'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const loadBudgets = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Starting to fetch budgets...');
      const response = await fetchBudgets();
      
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Type of response:', typeof response);
      console.log('Type of response.data:', typeof response.data);
      console.log('Is response.data an array?', Array.isArray(response.data));
      console.log('Response.data keys:', response.data ? Object.keys(response.data) : 'No data');
      
      let budgetsData = [];
      if (Array.isArray(response)) {
        // Response is directly the budgets array
        budgetsData = response;
      } else if (response && response.budgets && Array.isArray(response.budgets)) {
        // Response is an object with budgets property
        budgetsData = response.budgets;
      } else if (response && Array.isArray(response.data)) {
        // Response has data property with array
        budgetsData = response.data;
      } else {
        console.warn('Unexpected response structure:', response);
      }
      
      console.log('Processed budgets data:', budgetsData);
      setBudgets(budgetsData);
      
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      
      let errorMessage = 'Failed to load budgets';
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage = 'Access denied. You may not have permission to view budgets.';
        } else if (err.response.status === 404) {
          errorMessage = 'Budgets endpoint not found. Check your API configuration.';
        } else if (err.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data?.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculatePeriodDates = (periodType) => {
    const now = new Date();
    let startDate, endDate;

    switch (periodType) {
      case 'weekly':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = startOfWeek.toISOString().split('T')[0];
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endDate = endOfWeek.toISOString().split('T')[0];
        break;
        
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
        
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
        
      default:
        startDate = now.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
    }

    return { startDate, endDate };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { startDate, endDate } = calculatePeriodDates(formData.period_type);
      
      const budgetData = {
        ...formData,
        amount: parseFloat(formData.amount),
        start_date: startDate,
        end_date: endDate
      };

      console.log('Creating budget with data:', budgetData);
      await createBudget(budgetData);
      setFormData({
        name: '',
        amount: '',
        category: '',
        period_type: 'weekly'
      });
      await loadBudgets();
    } catch (err) {
      console.error('Error creating budget:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to create budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (budgetId) => {
    try {
      console.log('Deleting budget with ID:', budgetId);
      await deleteBudget(budgetId);
      setBudgets(budgets.filter(b => b.id !== budgetId));
    } catch (err) {
      console.error('Error deleting budget:', err);
      setError('Failed to delete budget');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Budget Management</h1>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
      
      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffebee', 
          padding: '0.5rem', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '1rem', 
        borderRadius: '4px',
        marginBottom: '1rem',
        fontSize: '0.9rem'
      }}>
        <strong>Debug Info:</strong>
        <div>Budgets count: {budgets.length}</div>
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Error: {error || 'None'}</div>
        <button 
          onClick={loadBudgets}
          style={{ 
            backgroundColor: '#2196f3', 
            color: 'white', 
            border: 'none', 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px',
            marginTop: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Retry Load Budgets
        </button>
      </div>

      {}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '1.5rem', 
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2>Create New Budget</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Budget Name:
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Weekly Lunch Budget"
              required
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Budget Amount ($):
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="50.00"
              step="0.01"
              min="0"
              required
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Category (optional):
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="e.g., lunch, groceries, transport"
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Budget Period:
            </label>
            <select
              name="period_type"
              value={formData.period_type}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '0.5rem', 
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: submitting ? '#ccc' : '#007bff',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '4px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '1rem'
            }}
          >
            {submitting ? 'Creating...' : 'Create Budget'}
          </button>
        </form>
      </div>

      {}
      <div>
        <h2>Your Budgets</h2>
        {loading ? (
          <p>Loading budgets...</p>
        ) : budgets.length === 0 ? (
          <p>No budgets created yet. Create your first budget above!</p>
        ) : (
          <div>
            {budgets.map((budget) => (
              <div
                key={budget.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  backgroundColor: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                      {budget.name}
                    </h3>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      <strong>Amount:</strong> ${parseFloat(budget.amount).toFixed(2)}
                    </p>
                    {budget.category && (
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        <strong>Category:</strong> {budget.category}
                      </p>
                    )}
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      <strong>Period:</strong> {budget.period_type} 
                      ({formatDate(budget.start_date)} - {formatDate(budget.end_date)})
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}