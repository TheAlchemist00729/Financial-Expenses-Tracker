import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

export const signup = async (data) => {
  console.log('→ Frontend sending signup to:', process.env.REACT_APP_API_URL + '/users/signup');
  console.log('→ Payload:', data);
  return API.post('/users/signup', data);
};
export const login = (data) => API.post('/users/login', data);
