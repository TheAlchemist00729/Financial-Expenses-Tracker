const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const dateObj = new Date(dateInput);
  if (isNaN(dateObj)) return '';
  return dateObj.toISOString().split('T')[0];
};

const formatAmount = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '';
  const num = Number(amount);
  if (isNaN(num)) return '';
  return num.toFixed(2);
};

const escapeField = (field) => {
  if (field == null) return '';
  const str = String(field);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const convertToCSV = (data, type = 'expenses') => {
  const expenseHeaders = 'Date,Category,Description,Amount';
  const budgetHeaders = 'Category,Budget Amount,Spent Amount,Remaining';

  if (!Array.isArray(data) || data.length === 0) {
    return (type === 'budgets' ? budgetHeaders : expenseHeaders) + '\n';
  }

  if (type === 'budgets') {
    const rows = data.map(({ category, amount, spent }) => {
      const cat = escapeField(category);
      const budgetAmt = formatAmount(amount);
      const spentAmt = formatAmount(spent);
      const remaining = (Number(amount) - Number(spent)).toFixed(2);
      return [cat, budgetAmt, spentAmt, remaining].join(',');
    });
    return budgetHeaders + '\n' + rows.join('\n');
  }

  // expenses CSV
  const rows = data.map(({ date, category, description, amount }) => {
    const d = formatDate(date);
    const cat = escapeField(category);
    const desc = escapeField(description);
    const amt = formatAmount(amount);
    // Build fields, omitting description if empty
    const fields = [d, cat];
    if (desc !== '') fields.push(desc);
    fields.push(amt);
    return fields.join(',');
  });

  return expenseHeaders + '\n' + rows.join('\n');
};

const generateExpenseReport = (expenses, options = {}) => {
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return {
      totalExpenses: 0,
      expenseCount: 0,
      categories: []
    };
  }
  const totalExpenses = expenses.reduce((sum, { amount }) => sum + (Number(amount) || 0), 0);
  const expenseCount = expenses.length;
  const categories = [...new Set(expenses.map(e => e.category).filter(Boolean))];
  const report = { totalExpenses, expenseCount, categories };
  if (options.groupByCategory) {
    report.categoryTotals = expenses.reduce((totals, { category, amount }) => {
      if (category && amount != null) {
        const num = Number(amount) || 0;
        totals[category] = (totals[category] || 0) + num;
      }
      return totals;
    }, {});
  }
  return report;
};

const generateBudgetReport = (budgets, options = {}) => {
  if (!Array.isArray(budgets) || budgets.length === 0) {
    return {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      budgetCount: 0,
      categories: []
    };
  }
  const totalBudget = budgets.reduce((sum, { amount }) => sum + (Number(amount) || 0), 0);
  const totalSpent = budgets.reduce((sum, { spent }) => sum + (Number(spent) || 0), 0);
  const totalRemaining = totalBudget - totalSpent;
  const report = {
    totalBudget,
    totalSpent,
    totalRemaining,
    budgetCount: budgets.length,
    categories: budgets.map(b => b.category).filter(Boolean)
  };
  if (options.groupByCategory) {
    report.categoryBreakdown = budgets.reduce((bd, { category, amount, spent }) => {
      if (category) {
        const bud = Number(amount) || 0;
        const sp = Number(spent) || 0;
        bd[category] = { budgeted: bud, spent: sp, remaining: (bud - sp).toFixed(2) };
      }
      return bd;
    }, {});
  }
  return report;
};

module.exports = {
  convertToCSV,
  generateExpenseReport,
  generateBudgetReport
};
