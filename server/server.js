require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

console.log('[DB] Using DATABASE_URL:', process.env.DATABASE_URL);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


