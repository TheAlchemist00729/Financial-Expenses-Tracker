import api from './api.js';

export const createBudget = async (budgetData) => {
  try {
    const response = await api.post('/budgets', budgetData);
    return response.data;
  } catch (error) {
    console.error('Error creating budget:', error);
    throw error;
  }
};

export const fetchBudgets = async () => {
  try {
    console.log('🔍 Attempting to fetch budgets...');
    console.log('🌐 Making request to: /budgets');
    
    const response = await api.get('/budgets');
    console.log('✅ Budgets response received:', response);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching budgets:', error);
    
    if (error.response) {
      console.error('🔴 Response status:', error.response.status);
      console.error('🔴 Response data:', error.response.data);
      console.error('🔴 Full URL that failed:', error.config?.url);
    } else if (error.request) {
      console.error('🔴 No response received:', error.request);
    } else {
      console.error('🔴 Error message:', error.message);
    }
    
    throw error;
  }
};

export const fetchBudgetById = async (id) => {
  try {
    const response = await api.get(`/budgets/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching budget:', error);
    throw error;
  }
};

export const updateBudget = async (id, budgetData) => {
  try {
    const response = await api.put(`/budgets/${id}`, budgetData);
    return response.data;
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
};

export const deleteBudget = async (id) => {
  try {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
};

export const fetchBudgetStatus = async () => {
  try {
    console.log('🔍 Attempting to fetch budget status...');
    
    const response = await api.get('/budgets/status');
    console.log('✅ Response received:', response);
    console.log('📊 Response status:', response.status);
    console.log('📋 Response data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching budget status:', error);
    
    if (error.response) {
      console.error('🔴 Response status:', error.response.status);
      console.error('🔴 Response data:', error.response.data);
      console.error('🔴 Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('🔴 No response received:', error.request);
      console.error('🔴 Network error or server not responding');
    } else {
      console.error('🔴 Error message:', error.message);
    }
    
    throw error;
  }
};

export const fetchBudgetExpenses = async (budgetId) => {
  try {
    const response = await api.get(`/budgets/${budgetId}/expenses`);
    return response.data;
  } catch (error) {
    console.error('Error fetching budget expenses:', error);
    throw error;
  }
};