const { convertToCSV, generateExpenseReport } = require('./controllers/reportsController');

describe('CSV Export Unit Tests', () => {
  describe('convertToCSV', () => {
    test('converts expenses array to proper CSV format', () => {
      const expenses = [
        { id: 1, amount: 20.50, category: 'Food', description: 'Lunch', date: '2024-01-15' },
        { id: 2, amount: 100.00, category: 'Utilities', description: 'Electric bill', date: '2024-01-16' }
      ];

      const csv = convertToCSV(expenses);
      
      expect(csv).toContain('Date,Category,Description,Amount');
      expect(csv).toContain('2024-01-15,Food,Lunch,20.50');
      expect(csv).toContain('2024-01-16,Utilities,Electric bill,100.00');
      
      const lines = csv.split('\n');
      expect(lines.length).toBe(3);
    });

    test('handles expenses with special characters in CSV', () => {
      const expenses = [
        { id: 1, amount: 15.75, category: 'Food', description: 'Café, "great coffee"', date: '2024-01-15' }
      ];

      const csv = convertToCSV(expenses);
      
      expect(csv).toContain('"Café, ""great coffee"""');
    });

    test('returns empty CSV with headers when no expenses provided', () => {
      const csv = convertToCSV([]);
      
      expect(csv).toBe('Date,Category,Description,Amount\n');
    });

    test('handles null or undefined values gracefully', () => {
      const expenses = [
        { id: 1, amount: 25.00, category: null, description: undefined, date: '2024-01-15' }
      ];

      const csv = convertToCSV(expenses);
      
      expect(csv).toContain('2024-01-15,,25.00');
    });
  });

  describe('generateExpenseReport', () => {
    test('formats expense data for CSV export', () => {
      const mockExpenses = [
        { id: 1, amount: 50.25, category: 'Transport', description: 'Gas', date: '2024-01-10' },
        { id: 2, amount: 125.00, category: 'Food', description: 'Groceries', date: '2024-01-11' }
      ];

      const report = generateExpenseReport(mockExpenses);
      
      expect(report).toHaveProperty('totalExpenses', 175.25);
      expect(report).toHaveProperty('expenseCount', 2);
      expect(report).toHaveProperty('categories');
      expect(report.categories).toEqual(['Transport', 'Food']);
    });

    test('calculates correct totals by category', () => {
      const mockExpenses = [
        { amount: 30, category: 'Food' },
        { amount: 20, category: 'Food' },
        { amount: 100, category: 'Rent' }
      ];

      const report = generateExpenseReport(mockExpenses, { groupByCategory: true });
      
      expect(report.categoryTotals).toEqual({
        'Food': 50,
        'Rent': 100
      });
    });

    test('handles empty expense array', () => {
      const report = generateExpenseReport([]);
      
      expect(report.totalExpenses).toBe(0);
      expect(report.expenseCount).toBe(0);
      expect(report.categories).toEqual([]);
    });
  });

  describe('CSV date formatting', () => {
    test('formats dates consistently for CSV export', () => {
      const expenses = [
        { amount: 10, category: 'Test', description: 'Test', date: new Date('2024-01-15T10:30:00Z') }
      ];

      const csv = convertToCSV(expenses);
      
      expect(csv).toMatch(/2024-01-15/);
    });

    test('handles various date input formats', () => {
      const expenses = [
        { amount: 10, category: 'Test', description: 'Test1', date: '2024-01-15' },
        { amount: 20, category: 'Test', description: 'Test2', date: new Date('2024-01-16') },
        { amount: 30, category: 'Test', description: 'Test3', date: 1642204800000 }
      ];

      const csv = convertToCSV(expenses);
      
      expect(csv).toContain('2024-01-15');
      expect(csv).toContain('2024-01-16');
    });
  });
});
