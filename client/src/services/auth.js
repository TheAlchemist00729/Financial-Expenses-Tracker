import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

export const signup = (data) => API.post('/users/signup', data);
export const login = (data) => API.post('/users/login', data);

