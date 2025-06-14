CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budget_alerts (
  id SERIAL PRIMARY KEY,
  budget_id INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warning', 'exceeded')),
  percentage NUMERIC(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO expenses (user_id, amount, description, date, category)
VALUES
  (1, 10.00, 'Hotdog and fries', '2025-06-10', 'lunch');

INSERT INTO budgets (user_id, name, amount, category, period_type, start_date, end_date)
VALUES
  (1, 'Weekly Lunch Budget', 50.00, 'lunch', 'weekly', '2025-06-09', '2025-06-15');

INSERT INTO budget_alerts (budget_id, alert_type, percentage)
VALUES
  (1, 'warning', 80.00),
  (1, 'exceeded', 100.00);

  