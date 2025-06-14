import axios from 'axios';

console.log('=== DEBUG INFO ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('window.location.origin:', window.location.origin);

const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL
});

console.log('Final API baseURL:', API.defaults.baseURL);

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log('=== REQUEST DEBUG ===');
  console.log('Full URL:', `${config.baseURL}${config.url}`);
  console.log('Method:', config.method);
  console.log('Headers:', config.headers);
  console.log('Token exists:', !!token);
  
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  response => {
    console.log('=== RESPONSE SUCCESS ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    return response;
  },
  error => {
    console.log('=== RESPONSE ERROR ===');
    console.log('Error type:', error.code);
    console.log('Error message:', error.message);
    console.log('Response status:', error.response?.status);
    console.log('Response data:', error.response?.data);
    console.log('Full error:', error);
    return Promise.reject(error);
  }
);

export const createExpense = data => API.post('/expenses', data);
export const deleteExpense = id => API.delete(`/expenses/${id}`);
export const fetchExpenses = () => API.get('/expenses');
export const fetchSummary = () => API.get('/expenses/summary');

