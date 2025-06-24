// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BudgetInsights from './BudgetInsights';

// Mock the API module
jest.mock('../services/api', () => ({
  get: jest.fn(),
}));


// Mock window.print
Object.defineProperty(window, 'print', {
  value: jest.fn(),
  writable: true,
});

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-url'),
  writable: true,
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: jest.fn(),
  writable: true,
});

// Mock document.createElement for download functionality
const mockClick = jest.fn();
const mockRemove = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: mockClick,
        remove: mockRemove,
      };
    }
    return {};
  }),
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true,
});

// Import the mocked API
import API from '../services/api';

// Test data
const mockVisualizationData = {
  categories: [
    { category: 'Food', budget: 500, spent: 450 },
    { category: 'Transport', budget: 300, spent: 280 },
    { category: 'Entertainment', budget: 200, spent: 180 },
  ],
  monthlyTrends: [
    { month: 'Jan', budget: 1000, spent: 900 },
    { month: 'Feb', budget: 1000, spent: 950 },
    { month: 'Mar', budget: 1000, spent: 910 },
  ],
  totalBudget: 1000,
  totalSpent: 910,
  totalRemaining: 90,
};

const mockBudgetPerformance = {
  overBudgetCategories: ['Transport'],
  underBudgetCategories: ['Food', 'Entertainment'],
  savingsRate: 9,
  averageMonthlySpend: 920,
  projectedYearEndSpend: 11040,
  budgetAdherence: 91,
};

// Wrapper component for Router context
const TestWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('BudgetInsights Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-token');
    
    // Reset all mocks
    mockNavigate.mockClear();
    mockClick.mockClear();
    mockRemove.mockClear();
    mockAppendChild.mockClear();
    mockRemoveChild.mockClear();
    window.print.mockClear();
    URL.createObjectURL.mockClear();
    URL.revokeObjectURL.mockClear();
    
    // Default successful API responses
    API.get
      .mockResolvedValueOnce({ data: mockVisualizationData })
      .mockResolvedValueOnce({ data: mockBudgetPerformance });
  });

  describe('Loading State', () => {
    test('displays loading spinner and message', () => {
      // Mock API to return pending promise to keep loading state
      API.get.mockImplementation(() => new Promise(() => {}));

      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      expect(screen.getByText('Loading your budget insights...')).toBeInTheDocument();
    });
  });

  describe('Successful Data Loading', () => {
    test('renders header with correct title and navigation buttons', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Budget Insights & Analytics')).toBeInTheDocument();
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Print Report')).toBeInTheDocument();
        expect(screen.getByText('Export Data')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
    });

    test('renders summary cards with correct calculations', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Total Budget')).toBeInTheDocument();
        expect(screen.getByText('$1,000.00')).toBeInTheDocument();
        expect(screen.getByText('Total Spent')).toBeInTheDocument();
        expect(screen.getByText('$910.00')).toBeInTheDocument();
        expect(screen.getByText('Remaining Budget')).toBeInTheDocument();
        expect(screen.getByText('$90.00')).toBeInTheDocument();
      });
    });

    test('renders all chart containers', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Budget vs Spending by Category')).toBeInTheDocument();
        expect(screen.getByText('Monthly Budget Trends')).toBeInTheDocument();
        expect(screen.getByText('Spending Distribution')).toBeInTheDocument();
      });
    });

    test('renders budget utilization table with correct data and status indicators', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Budget Utilization Analysis')).toBeInTheDocument();
        expect(screen.getByText('Food')).toBeInTheDocument();
        expect(screen.getByText('Transport')).toBeInTheDocument();
        expect(screen.getByText('Entertainment')).toBeInTheDocument();
        
        // Check for status indicators
        expect(screen.getByText('Under Budget')).toBeInTheDocument();
        expect(screen.getByText('Over Budget')).toBeInTheDocument();
      });
    });

    test('renders performance insights section', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Performance Insights')).toBeInTheDocument();
        expect(screen.getByText('Budget Adherence: 91%')).toBeInTheDocument();
        expect(screen.getByText('Savings Rate: 9%')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when API calls fail', async () => {
      API.get.mockRejectedValue(new Error('Network Error'));

      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load budget insights/)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    test('retry button refetches data', async () => {
      API.get
        .mockRejectedValueOnce(new Error('Network Error'))
        .mockResolvedValueOnce({ data: mockVisualizationData })
        .mockResolvedValueOnce({ data: mockBudgetPerformance });

      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Retry'));

      await waitFor(() => {
        expect(screen.getByText('Budget Insights & Analytics')).toBeInTheDocument();
      });

      expect(API.get).toHaveBeenCalledTimes(4); // 2 failed + 2 successful
    });
  });

  describe('Navigation Functions', () => {
    test('logout button clears storage and navigates to login', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Logout'));

      expect(localStorage.getItem('token')).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('back to dashboard button navigates correctly', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Back to Dashboard'));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    test('print button calls window.print', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Print Report')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Print Report'));

      expect(window.print).toHaveBeenCalled();
    });

    test('export data button creates download link', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Export Data')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Export Data'));

      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty data gracefully', async () => {
      API.get
        .mockResolvedValueOnce({ data: null })
        .mockResolvedValueOnce({ data: null });

      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('$0.00')).toBeInTheDocument(); // Total Budget
      });
    });

    test('handles missing token', async () => {
      localStorage.removeItem('token');

      // Don't set token in localStorage
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Budget Insights & Analytics')).toBeInTheDocument();
      });
    });

    test('handles partial data responses', async () => {
      API.get
        .mockResolvedValueOnce({ data: { ...mockVisualizationData, categories: [] } })
        .mockResolvedValueOnce({ data: mockBudgetPerformance });

      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Budget Insights & Analytics')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper heading structure', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        const headings = screen.getAllByRole('heading');
        expect(headings.length).toBeGreaterThan(0);
        expect(screen.getByRole('heading', { name: 'Budget Insights & Analytics' })).toBeInTheDocument();
      });
    });

    test('buttons have proper labels', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Back to Dashboard' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Print Report' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Export Data' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
      });
    });

    test('table has proper structure', async () => {
      render(
        <TestWrapper>
          <BudgetInsights />
        </TestWrapper>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        
        const columnHeaders = screen.getAllByRole('columnheader');
        expect(columnHeaders.length).toBeGreaterThan(0);
      });
    });
  });
});