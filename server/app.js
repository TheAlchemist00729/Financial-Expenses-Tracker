const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');

dotenv.config({ path: '../.env' });

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);

module.exports = app;

