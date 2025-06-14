import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const createBudget = async (budgetData) => {
  try {
    const response = await api.post('/api/budgets', budgetData);
    return response.data;
  } catch (error) {
    console.error('Error creating budget:', error);
    throw error;
  }
};

export const fetchBudgets = async () => {
  try {
    const response = await api.get('/api/budgets');
    return response.data.budgets; // Access the budgets property
  } catch (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }
};

export const fetchBudgetById = async (id) => {
  try {
    const response = await api.get(`/api/budgets/${id}`);
    return response.data.budget; // Access the budget property
  } catch (error) {
    console.error('Error fetching budget:', error);
    throw error;
  }
};

export const updateBudget = async (id, budgetData) => {
  try {
    const response = await api.put(`/api/budgets/${id}`, budgetData);
    return response.data.budget; // Access the budget property
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
};

export const deleteBudget = async (id) => {
  try {
    const response = await api.delete(`/api/budgets/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
};

export const fetchBudgetStatus = async () => {
  try {
    const response = await api.get('/api/budgets/status');
    return response.data.budgetStatus; // Access the budgetStatus property
  } catch (error) {
    console.error('Error fetching budget status:', error);
    throw error;
  }
};

export const fetchBudgetExpenses = async (budgetId) => {
  try {
    const response = await api.get(`/api/budgets/${budgetId}/expenses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching budget expenses:', error);
    throw error;
  }
};

