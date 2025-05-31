import React, { useState } from 'react';

export default function ExpenseForm({ onSubmit }) {
  const [form, setForm] = useState({ amount:'', description:'', date:'', category:'' });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();

    if (!form.amount || !form.description || !form.date || !form.category) {
      return alert('All fields are required');
    }
    onSubmit(form);
    setForm({ amount:'', description:'', date:'', category:'' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-4">
      <input name="amount" type="number" placeholder="Amount" value={form.amount} onChange={handleChange} />
      <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
      <input name="date" type="date" value={form.date} onChange={handleChange} />
      <input name="category" placeholder="Category" value={form.category} onChange={handleChange} />
      <button type="submit">Add Expense</button>
    </form>
  );
}

