import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export default function SummaryChart({ data }) {
     if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', margin: '1rem 0' }}>
        <p>No summary data to display.</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" name="Total Spent" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

