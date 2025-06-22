const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div data-testid="mock-browser-router">{children}</div>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from './pages/Dashboard';

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

jest.mock('./services/expenses', () => ({
  fetchExpenses: jest.fn(() => Promise.resolve({ data: { expenses: [] } })),
  fetchSummary: jest.fn(() => Promise.resolve({ data: { summary: [] } })),
  createExpense: jest.fn(() => Promise.resolve()),
  deleteExpense: jest.fn(() => Promise.resolve())
}));

jest.mock('./services/budgets', () => ({
  fetchBudgetStatus: jest.fn(() => Promise.resolve({ data: { budgetStatus: [] } }))
}));

describe('Logout System Tests', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser'
  };

  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
    localStorageMock.removeItem.mockClear();
    mockNavigate.mockClear();
    mockOnLogout.mockClear();
  });

  test('removes token and redirects on Logout button click', async () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Logout'));

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
    expect(mockOnLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('logout button is visible and accessible', async () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />);

    await waitFor(() => {
      const logoutButton = screen.getByText('Logout');
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).toBeEnabled();
      expect(logoutButton).toHaveStyle('cursor: pointer');
    });
  });

  test('complete logout flow clears all session data', async () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />);

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Logout'));

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userId');
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});