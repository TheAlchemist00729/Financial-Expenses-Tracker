// Add to your routes file
const { convertToCSV, generateExpenseReport, generateBudgetReport } = require('./controllers/reportsController');

// Expenses CSV export
app.get('/api/reports/expenses/csv', authenticateToken, async (req, res) => {
  try {
    const expenses = await fetchUserExpenses(req.user.id); // Your existing function
    const csvContent = convertToCSV(expenses, 'expenses');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expenses_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate expenses CSV' });
  }
});

// Budgets CSV export
app.get('/api/reports/budgets/csv', authenticateToken, async (req, res) => {
  try {
    const budgets = await fetchUserBudgets(req.user.id); // Your existing function
    const csvContent = convertToCSV(budgets, 'budgets');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=budgets_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate budgets CSV' });
  }
});

// Comprehensive report
app.get('/api/reports/comprehensive', authenticateToken, async (req, res) => {
  try {
    const expenses = await fetchUserExpenses(req.user.id);
    const budgets = await fetchUserBudgets(req.user.id);
    
    let report = 'FINANCIAL SUMMARY REPORT\n';
    report += `Generated on: ${new Date().toLocaleString()}\n`;
    report += `User: ${req.user.email}\n\n`;
    
    if (budgets.length > 0) {
      report += 'BUDGET SUMMARY\n';
      report += convertToCSV(budgets, 'budgets') + '\n\n';
    }
    
    if (expenses.length > 0) {
      report += 'EXPENSES DETAIL\n';
      report += convertToCSV(expenses, 'expenses');
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate comprehensive report' });
  }
});