jest.mock('axios');

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

import { logout, clearAuthData, isLoggedIn } from './services/auth';

const mockNavigate = jest.fn();

describe('Logout Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  test('clears authentication token from localStorage on logout', async () => {
    localStorageMock.getItem.mockReturnValue('abc123token');
    
    await logout();
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userEmail');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  test('redirects to login page after successful logout', async () => {
    await logout(mockNavigate);
    
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('clearAuthData removes all authentication-related data', () => {
    clearAuthData();
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userEmail');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  test('logout handles missing token gracefully', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    await expect(logout(mockNavigate)).resolves.not.toThrow();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('logout clears user session state', async () => {
    localStorageMock.getItem.mockImplementation((key) => {
      const data = {
        'token': 'test-token',
        'userId': '123',
        'userEmail': 'test@example.com'
      };
      return data[key] || null;
    });
    
    await logout();
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userEmail');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  test('isLoggedIn returns false after logout', async () => {
    localStorageMock.getItem.mockReturnValue('valid-token');
    expect(isLoggedIn()).toBe(true);
    
    await logout();
    
    localStorageMock.getItem.mockReturnValue(null);
    
    expect(isLoggedIn()).toBe(false);
  });
});