const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');

dotenv.config();

const app = express();

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.originalUrl}`);
  next();
});

// Updated CORS configuration for GitHub Codespaces
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://silver-carnival-446w5g5x94jf75wq-3000.app.github.dev',
    /https:\/\/.*\.app\.github\.dev$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With'],
  credentials: true
}));

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);

module.exports = app;