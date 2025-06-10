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

app.use(cors({
  origin: ['http://localhost:3000', 'http://10.0.3.29:3000'],
  credentials: true
}));

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);

module.exports = app;
