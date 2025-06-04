import axios from 'axios';
const API = axios.create({ baseURL: process.env.REACT_APP_API_URL });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const createExpense = data => API.post('/expenses', data);
export const deleteExpense = id => API.delete(`/expenses/${id}`);
export const fetchExpenses = () => API.get('/expenses');
export const fetchSummary = () => API.get('/expenses/summary');

