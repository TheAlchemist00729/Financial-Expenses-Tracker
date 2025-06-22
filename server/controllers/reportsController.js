const convertToCSV = (data, type = 'expenses') => {
  if (!data || data.length === 0) {
    if (type === 'budgets') {
      return 'Category,Budget Amount,Spent Amount,Remaining\n';
    }
    return 'Date,Category,Description,Amount\n';
  }
  
  if (type === 'budgets') {
    const headers = 'Category,Budget Amount,Spent Amount,Remaining\n';
    const rows = data.map(budget => {
      const category = budget.category || '';
      const budgetAmount = budget.amount || 0;
      const spentAmount = budget.spent || 0;
      const remaining = budgetAmount - spentAmount;
      return `${category},${budgetAmount},${spentAmount},${remaining}`;
    }).join('\n');
    return headers + rows;
  }
  
  const headers = 'Date,Category,Description,Amount\n';
  const rows = data.map(expense => {
    const date = expense.date || '';
    const category = expense.category || '';
    let description = expense.description || '';
    
    if (description && (description.includes(',') || description.includes('"') || description.includes('\n'))) {
      description = `"${description.replace(/"/g, '""')}"`;
    }
    
    const amount = expense.amount || '';
    return `${date},${category},${description},${amount}`;
  }).join('\n');
  
  return headers + rows;
};

const generateExpenseReport = (expenses, options = {}) => {
  if (!expenses || expenses.length === 0) {
    return {
      totalExpenses: 0,
      expenseCount: 0,
      categories: []
    };
  }
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const expenseCount = expenses.length;
  const categories = [...new Set(expenses.map(expense => expense.category).filter(Boolean))];
  
  const report = {
    totalExpenses,
    expenseCount,
    categories
  };
  
  if (options.groupByCategory) {
    report.categoryTotals = expenses.reduce((totals, expense) => {
      const category = expense.category;
      if (category && expense.amount) {
        totals[category] = (totals[category] || 0) + expense.amount;
      }
      return totals;
    }, {});
  }
  
  return report;
};

const generateBudgetReport = (budgets, options = {}) => {
  if (!budgets || budgets.length === 0) {
    return {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      budgetCount: 0,
      categories: []
    };
  }
  
  const totalBudget = budgets.reduce((sum, budget) => sum + (budget.amount || 0), 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  
  const report = {
    totalBudget,
    totalSpent,
    totalRemaining,
    budgetCount: budgets.length,
    categories: budgets.map(b => b.category).filter(Boolean)
  };
  
  if (options.groupByCategory) {
    report.categoryBreakdown = budgets.reduce((breakdown, budget) => {
      if (budget.category) {
        breakdown[budget.category] = {
          budgeted: budget.amount || 0,
          spent: budget.spent || 0,
          remaining: (budget.amount || 0) - (budget.spent || 0)
        };
      }
      return breakdown;
    }, {});
  }
  
  return report;
};

module.exports = {
  convertToCSV,
  generateExpenseReport,
  generateBudgetReport
};