import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login onLoginSuccess={user => setUser(user)} />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}
