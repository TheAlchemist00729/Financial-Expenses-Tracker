import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const API = axios.create({
  baseURL: `${API_URL}/api/users`,
  headers: { 'Content-Type': 'application/json' },
});

export const signup = async (data) => {
  console.log('→ Frontend sending signup to:', `${API.baseURL}/signup`);
  console.log('→ Payload:', data);
  return API.post('/signup', data);
};

export const login = async (data) => {
  console.log('→ Frontend sending login to:', `${API.baseURL}/login`);
  console.log('→ Payload:', data);
  return API.post('/login', data);
};
