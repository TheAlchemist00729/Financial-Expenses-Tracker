INSERT INTO expenses (user_id, amount, description, date, category)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC;

DELETE FROM expenses WHERE id = $1 AND user_id = $2;

