const express = require('express');
const cors = require('cors');
require('dotenv').config();

const expenseRoutes = require('./routes/expenses');
const userRoutes = require('./routes/users');

const app = express();
app.use(cors(), express.json());

app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));