jest.mock('axios');

import { logout, clearAuthData } from './services/auth';

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

const mockNavigate = jest.fn();

describe('Logout Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('clears authentication token from localStorage on logout', () => {
    localStorageMock.getItem.mockReturnValue('abc123token');
    logout();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
  });

  test('redirects to login page after successful logout', () => {
    logout(mockNavigate);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('clearAuthData removes all authentication-related data', () => {
    clearAuthData();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userEmail');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  test('logout handles missing token gracefully', () => {
    localStorageMock.getItem.mockReturnValue(null);
    expect(() => logout(mockNavigate)).not.toThrow();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('logout clears user session state', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      const data = {
        'token': 'test-token',
        'userId': '123',
        'userEmail': 'test@example.com'
      };
      return data[key] || null;
    });
    logout();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
  });

  test('isLoggedIn returns false after logout', () => {
    const { isLoggedIn } = require('./services/auth');
    localStorageMock.getItem.mockReturnValue('valid-token');
    expect(isLoggedIn()).toBe(true);
    logout();
    localStorageMock.getItem.mockReturnValue(null);
    expect(isLoggedIn()).toBe(false);
  });
});
