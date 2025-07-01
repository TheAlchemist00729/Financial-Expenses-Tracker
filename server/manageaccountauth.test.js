const db = require('./db');
const bcrypt = require('bcrypt');

jest.mock('./db');

jest.mock('bcrypt');

const updateUsername = async (userId, newUsername) => {
  if (!newUsername || newUsername.trim() === '') {
    throw new Error('Username cannot be empty');
  }
  if (newUsername.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }
  if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
    throw new Error('Username contains invalid characters');
  }

  try {
    const result = await db.query(
      'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email',
      [newUsername, userId]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new Error('Username already exists');
    }
    throw error;
  }
};

const validatePassword = (password) => {
  const commonPasswords = ['password123', '123456789', 'qwerty123'];
  
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  if (!/\d/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (commonPasswords.includes(password)) {
    throw new Error('Password is too common');
  }
  return true;
};

const updatePassword = async (userId, newPassword) => {
  validatePassword(newPassword);
  
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
  
  const result = await db.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email',
    [hashedPassword, userId]
  );
  return result.rows[0];
};

const getUserProfile = async (userId) => {
  const result = await db.query(
    'SELECT id, username, email, created_at FROM users WHERE id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0];
};

describe('User Management Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue('$2b$10$hashedpassword');
  });

  describe('updateUsername', () => {
    test('updates username in database successfully', async () => {
      const mockResult = {
        rows: [{ id: 1, username: 'newUsername', email: 'test@example.com' }]
      };
      db.query.mockResolvedValue(mockResult);

      const result = await updateUsername(1, 'newUsername');

      expect(db.query).toHaveBeenCalledWith(
        'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, email',
        ['newUsername', 1]
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    test('throws error when username already exists', async () => {
      const mockError = { code: '23505' };
      db.query.mockRejectedValue(mockError);

      await expect(updateUsername(1, 'existingUser')).rejects.toThrow('Username already exists');
    });

    test('validates username format before update', async () => {
      await expect(updateUsername(1, '')).rejects.toThrow('Username cannot be empty');
      await expect(updateUsername(1, 'a')).rejects.toThrow('Username must be at least 3 characters');
      await expect(updateUsername(1, 'user@name')).rejects.toThrow('Username contains invalid characters');
    });
  });

  describe('validatePassword', () => {
    test('accepts strong password', () => {
      expect(() => validatePassword('StrongP@ssw0rd')).not.toThrow();
      expect(() => validatePassword('MySecure123!')).not.toThrow();
    });

    test('rejects weak passwords', () => {
      expect(() => validatePassword('123')).toThrow('Password must be at least 6 characters long');
      expect(() => validatePassword('password')).toThrow('Password must contain at least one number');
      expect(() => validatePassword('password123')).toThrow('Password must contain at least one uppercase letter');
      expect(() => validatePassword('PASSWORD123')).toThrow('Password must contain at least one lowercase letter');
    });

    test('rejects common passwords', () => {
      const commonPasswords = ['password123', '123456789', 'qwerty123'];
      commonPasswords.forEach(pwd => {
        expect(() => validatePassword(pwd)).toThrow('Password is too common');
      });
    });
  });

  describe('updatePassword', () => {
    test('updates password with proper hashing', async () => {
      const mockResult = {
        rows: [{ id: 1, email: 'test@example.com' }]
      };
      db.query.mockResolvedValue(mockResult);

      const result = await updatePassword(1, 'NewP@ssw0rd');

      expect(bcrypt.hash).toHaveBeenCalledWith('NewP@ssw0rd', 10);
      expect(db.query).toHaveBeenCalledWith(
        'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email',
        ['$2b$10$hashedpassword', 1]
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    test('validates password before updating', async () => {
      await expect(updatePassword(1, 'weak')).rejects.toThrow('Password must be at least 6 characters long');
    });
  });

  describe('getUserProfile', () => {
    test('returns user profile without sensitive data', async () => {
      const mockResult = {
        rows: [{ id: 1, username: 'testuser', email: 'test@example.com', created_at: '2023-01-01' }]
      };
      db.query.mockResolvedValue(mockResult);

      const result = await getUserProfile(1);

      expect(result).not.toHaveProperty('password_hash');
      expect(result).toEqual(mockResult.rows[0]);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT id, username, email, created_at FROM users WHERE id = $1',
        [1]
      );
    });

    test('throws error when user not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(getUserProfile(999)).rejects.toThrow('User not found');
    });
  });
});