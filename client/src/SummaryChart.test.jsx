import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SummaryChart from './components/SummaryChart';

jest.mock('recharts', () => ({
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }) => <div data-testid="pie" data-count={data?.length || 0} />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ dataKey }) => <div data-testid="bar" data-key={dataKey} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  Cell: () => <div data-testid="cell" />
}));

describe('SummaryChart Component', () => {
  const mockData = [
    { category: 'Food', amount: 150.50 },
    { category: 'Rent', amount: 800.00 },
    { category: 'Utilities', amount: 120.25 },
    { category: 'Entertainment', amount: 75.00 }
  ];

  test('renders pie chart with correct data categories', () => {
    render(<SummaryChart data={mockData} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    
    const pieElement = screen.getByTestId('pie');
    expect(pieElement).toHaveAttribute('data-count', '4');
  });

  test('renders bar chart with matching category amounts', () => {
    render(<SummaryChart data={mockData} chartType="bar" />);
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  test('handles empty data gracefully', () => {
    render(<SummaryChart data={[]} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    const pieElement = screen.getByTestId('pie');
    expect(pieElement).toHaveAttribute('data-count', '0');
  });

  test('displays correct total amount calculation', () => {
    render(<SummaryChart data={mockData} showTotal={true} />);
    
    const expectedTotal = mockData.reduce((sum, item) => sum + item.amount, 0);
    expect(screen.getByText(`Total: $${expectedTotal.toFixed(2)}`)).toBeInTheDocument();
  });

  test('renders legend component when enabled', () => {
    render(<SummaryChart data={mockData} showLegend={true} />);
    
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  test('handles invalid data types without crashing', () => {
    const invalidData = [
      { category: 'Food', amount: 'invalid' },
      { category: null, amount: 100 },
      { category: 'Valid', amount: 50 }
    ];
    
    expect(() => {
      render(<SummaryChart data={invalidData} />);
    }).not.toThrow();
  });
});
