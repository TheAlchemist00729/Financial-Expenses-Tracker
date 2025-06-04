import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../services/auth';

export default function Login({ onLoginSuccess }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!form.username.trim() || !form.password) {
      return setError('Username and password are required');
    }

    try {
      const res = await login({
        username: form.username.trim(),
        password: form.password,
      });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      onLoginSuccess(user);
    } catch (err) {
      setError(
        err.response?.data?.error || 'Login failed. Check credentials.'
      );
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl mb-4">Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full p-2 border"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white">
          Login
        </button>
      </form>
      <p className="mt-4">
        Don’t have an account?{' '}
        <Link to="/signup" className="text-blue-600">Sign up here</Link>
      </p>
    </div>
  );
}
