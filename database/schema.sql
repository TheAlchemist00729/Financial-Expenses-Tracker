DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  category TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

INSERT INTO users (username, password)
VALUES
  ('testuser', 'hashed_password_here');

INSERT INTO expenses (user_id, amount, description, date, category)
VALUES
  (1, 50.00, 'Groceries', '2025-06-01', 'Food'),
  (1, 15.00, 'Taxi',      '2025-06-02', 'Transport');



