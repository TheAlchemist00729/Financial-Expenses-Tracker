const { updateUsername, updatePassword, validatePassword } = require('./controllers/usersController');
const db = require('./db');

jest.mock('./db');

describe('User Management Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(result.username).toBe('newUsername');
      expect(result.id).toBe(1);
    });

    test('throws error when username already exists', async () => {
      const mockError = new Error('Username already exists');
      mockError.code = '23505';
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

      expect(db.query).toHaveBeenCalledWith(
        'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email',
        [expect.any(String), 1]
      );
      expect(result.id).toBe(1);
    });

    test('validates password before updating', async () => {
      await expect(updatePassword(1, 'weak')).rejects.toThrow('Password must be at least 6 characters long');
    });
  });

  describe('getUserProfile', () => {
    test('returns user profile without sensitive data', async () => {
      const mockResult = {
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          created_at: '2024-01-01',
          password_hash: 'shouldnotbeincluded'
        }]
      };
      db.query.mockResolvedValue(mockResult);

      const { getUserProfile } = require('../controllers/usersController');
      const result = await getUserProfile(1);

      expect(result).not.toHaveProperty('password_hash');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('email');
      expect(result.id).toBe(1);
    });

    test('throws error when user not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const { getUserProfile } = require('../controllers/usersController');
      await expect(getUserProfile(999)).rejects.toThrow('User not found');
    });
  });
});
