import React, { useState } from 'react';

export default function ExpenseForm({ onSubmit }) {
  const [form, setForm] = useState({
    amount: '',
    description: '',
    date: '',
    category: '',
  });
  const [error, setError] = useState('');

  const handleChange = e =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  const handleSubmit = e => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(form.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return setError('Amount must be a positive number');
    }

    if (
      !form.description.trim() ||
      !form.date ||
      !form.category.trim()
    ) {
      return setError('All fields are required');
    }

    const payload = {
      amount: parsedAmount,
      description: form.description.trim(),
      date: form.date,
      category: form.category.trim(),
    };

    onSubmit(payload);
    setForm({ amount: '', description: '', date: '', category: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-4">
      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <input
        name="amount"
        type="number"
        placeholder="Amount"
        step="0.01"
        value={form.amount}
        onChange={handleChange}
      />

      <input
        name="description"
        type="text"
        placeholder="Description"
        value={form.description}
        onChange={handleChange}
      />

      <input
        name="date"
        type="date"
        value={form.date}
        onChange={handleChange}
      />

      <input
        name="category"
        type="text"
        placeholder="Category"
        value={form.category}
        onChange={handleChange}
      />

      <button type="submit">Add Expense</button>
    </form>
  );
}



