import React, { useState } from 'react';
import { signup } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password) {
      return setError('All fields are required');
    }

    try {
      await signup({
        username: form.username.trim(),
        password: form.password,
      });
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl mb-4">Sign Up</h2>
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
        <button type="submit" className="px-4 py-2 bg-green-600 text-white">
          Sign Up
        </button>
      </form>
    </div>
  );
}

