import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import BudgetInsights from './pages/BudgetInsights'; // Add this import

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Login onLoginSuccess={setUser} />}
        />
        <Route
          path="/login"
          element={<Login onLoginSuccess={setUser} />}
        />
        <Route
          path="/signup"
          element={<Signup />}
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/budgets"
          element={
            user ? (
              <Budget user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        {/* ADD THIS NEW ROUTE */}
        <Route
          path="/insights"
          element={
            user ? (
              <BudgetInsights user={user} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </Router>
  );
}