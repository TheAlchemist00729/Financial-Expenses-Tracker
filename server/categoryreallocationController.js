const dataStore = require('../data/dataStore');

class ReallocationService {
  async getUserBudgetData(userId) {
    try {
      const allBudgets = dataStore.getBudgets();
      const budgets = allBudgets.filter(budget => 
        budget.user_id === userId && budget.active !== false
      );

      const currentMonth = new Date().toISOString().slice(0, 7);
      const allExpenses = dataStore.getExpenses();
      const expenses = allExpenses.filter(expense => 
        expense.user_id === userId && expense.date.startsWith(currentMonth)
      ).sort((a, b) => new Date(b.date) - new Date(a.date));

      const historicalData = await this.getHistoricalSpendingData(userId);

      return {
        budgets,
        expenses,
        historical_data: historicalData
      };
    } catch (error) {
      throw new Error(`Failed to fetch budget data: ${error.message}`);
    }
  }

  async getHistoricalSpendingData(userId) {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const allExpenses = dataStore.getExpenses();
      const userExpenses = allExpenses.filter(expense => 
        expense.user_id === userId && 
        new Date(expense.date) >= threeMonthsAgo
      );

      const monthlyExpenses = {};
      userExpenses.forEach(expense => {
        const month = expense.date.slice(0, 7);
        const category = expense.category;
        if (!monthlyExpenses[category]) {
          monthlyExpenses[category] = {};
        }
        if (!monthlyExpenses[category][month]) {
          monthlyExpenses[category][month] = 0;
        }
        monthlyExpenses[category][month] += expense.amount;
      });

      const historicalData = {};
      Object.keys(monthlyExpenses).forEach(category => {
        const monthlyTotals = Object.values(monthlyExpenses[category]);
        const avgSpent = monthlyTotals.reduce((sum, total) => sum + total, 0) / monthlyTotals.length;
        const variance = monthlyTotals.reduce((sum, total) => 
          sum + Math.pow(total - avgSpent, 2), 0
        ) / monthlyTotals.length;
        const stdDev = Math.sqrt(variance);
        const trend = this.calculateSpendingTrend(userId, category);
        historicalData[category] = {
          avg_spent: Math.round(avgSpent || 0),
          trend: trend,
          volatility: stdDev > (avgSpent * 0.3) ? 'high' : 'low'
        };
      });

      return historicalData;
    } catch (error) {
      throw new Error(`Failed to fetch historical data: ${error.message}`);
    }
  }

  calculateSpendingTrend(userId, category) {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      const allExpenses = dataStore.getExpenses();
      const recentExpenses = allExpenses.filter(expense => 
        expense.user_id === userId && 
        expense.category === category &&
        new Date(expense.date) >= oneMonthAgo
      );
      const recentSpending = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      const previousExpenses = allExpenses.filter(expense => 
        expense.user_id === userId && 
        expense.category === category &&
        new Date(expense.date) >= twoMonthsAgo &&
        new Date(expense.date) < oneMonthAgo
      );
      const previousSpending = previousExpenses.reduce((sum, exp) => sum + exp.amount, 0);

      if (previousSpending === 0) return 'stable';
      const changePercent = ((recentSpending - previousSpending) / previousSpending) * 100;
      if (changePercent > 15) return 'increasing';
      if (changePercent < -15) return 'decreasing';
      return 'stable';
    } catch {
      return 'stable';
    }
  }

  async analyzeSpendingPatterns(budgetData) {
    const { budgets, expenses, historical_data } = budgetData;
    const analysis = budgets.map(budget => {
      const spentPercentage = (budget.spent_amount / budget.amount) * 100;
      const historical = historical_data[budget.category] || { avg_spent: 0, trend: 'stable' };
      const surplusDeficit = budget.amount - budget.spent_amount;
      return {
        category: budget.category,
        current_budget: budget.amount,
        spent_amount: budget.spent_amount,
        spent_percentage: Math.round(spentPercentage),
        surplus_deficit: surplusDeficit,
        historical_avg: historical.avg_spent,
        trend: historical.trend,
        status: spentPercentage >= 100 ? 'over_budget' : 
                spentPercentage >= 80 ? 'near_limit' : 'under_budget',
        variance_from_historical: budget.spent_amount - historical.avg_spent,
        volatility: historical.volatility || 'low'
      };
    });
    return analysis;
  }

  async generateReallocationRecommendations(analysis) {
    const overBudgetCategories = analysis.filter(a => a.status === 'over_budget');
    const underBudgetCategories = analysis.filter(a => 
      a.status === 'under_budget' && a.surplus_deficit > 50
    );
    
    const recommendations = [];
    const totalSurplus = underBudgetCategories.reduce((sum, cat) => sum + cat.surplus_deficit, 0);
    const totalDeficit = overBudgetCategories.reduce((sum, cat) => sum + Math.abs(cat.surplus_deficit), 0);
    
    if (overBudgetCategories.length > 0 && underBudgetCategories.length > 0) {
      overBudgetCategories.sort((a, b) => {
        const aScore = Math.abs(a.surplus_deficit) + (a.trend === 'increasing' ? 50 : 0);
        const bScore = Math.abs(b.surplus_deficit) + (b.trend === 'increasing' ? 50 : 0);
        return bScore - aScore;
      });
      
      underBudgetCategories.sort((a, b) => {
        const aScore = a.surplus_deficit + (a.volatility === 'low' ? 50 : 0);
        const bScore = b.surplus_deficit + (b.volatility === 'low' ? 50 : 0);
        return bScore - aScore;
      });
      
      for (const overCategory of overBudgetCategories) {
        const neededAmount = Math.abs(overCategory.surplus_deficit);
        const adjustedNeed = Math.min(neededAmount, totalSurplus * 0.8);
        
        if (adjustedNeed > 20) {
          const sourceCategories = underBudgetCategories
            .filter(cat => cat.surplus_deficit >= 30)
            .slice(0, 2);
          
          const reallocationSources = sourceCategories.map(source => {
            const maxContribution = source.surplus_deficit * 0.7;
            const evenSplit = adjustedNeed / sourceCategories.length;
            const suggestedAmount = Math.min(maxContribution, evenSplit);
            return {
              from_category: source.category,
              available_surplus: source.surplus_deficit,
              suggested_amount: Math.round(suggestedAmount)
            };
          });
          
          if (reallocationSources.length > 0) {
            recommendations.push({
              target_category: overCategory.category,
              deficit_amount: Math.abs(overCategory.surplus_deficit),
              recommended_increase: Math.round(adjustedNeed),
              confidence_score: this.calculateConfidenceScore(overCategory, reallocationSources),
              sources: reallocationSources,
              reasoning: this.generateReasoning(overCategory, reallocationSources)
            });
          }
        }
      }
    }
    const optimizations = this.generateOptimizationSuggestions(analysis);
    return {
      reallocations: recommendations,
      optimizations: optimizations,
      summary: {
        total_surplus: Math.round(totalSurplus),
        total_deficit: Math.round(totalDeficit),
        reallocation_potential: Math.round(Math.min(totalSurplus, totalDeficit)),
        categories_over_budget: overBudgetCategories.length,
        categories_under_budget: underBudgetCategories.length
      }
    };
  }

  calculateConfidenceScore(targetCategory, sources) {
    let score = 0.5;
    if (targetCategory.variance_from_historical > 0) score += 0.2;
    if (targetCategory.trend === 'increasing') score += 0.2;
    if (targetCategory.spent_percentage > 110) score += 0.1;
    const stableSources = sources.filter(s => s.available_surplus > 100);
    score += (stableSources.length / sources.length) * 0.2;
    return Math.min(Math.round(score * 100) / 100, 1.0);
  }

  generateReasoning(targetCategory, sources) {
    const reasons = [];
    if (targetCategory.spent_percentage > 100) {
      reasons.push(`${targetCategory.category} is ${targetCategory.spent_percentage - 100}% over budget`);
    }
    if (targetCategory.trend === 'increasing') {
      reasons.push(`${targetCategory.category} spending has been trending upward`);
    }
    const mainSource = sources[0];
    if (mainSource) {
      reasons.push(`${mainSource.from_category} has $${mainSource.available_surplus} unused budget`);
    }
    return reasons.join('. ') + '.';
  }

  generateOptimizationSuggestions(analysis) {
    const suggestions = [];
    const largeSurplus = analysis.filter(a => a.surplus_deficit > 100);
    largeSurplus.forEach(cat => {
      suggestions.push({
        type: 'reduce_budget',
        category: cat.category,
        suggestion: `Consider reducing ${cat.category} budget by $${Math.round(cat.surplus_deficit * 0.5)}`,
        potential_savings: Math.round(cat.surplus_deficit * 0.5)
      });
    });
    const volatileCategories = analysis.filter(a => 
      Math.abs(a.variance_from_historical) > a.current_budget * 0.3
    );
    volatileCategories.forEach(cat => {
      suggestions.push({
        type: 'adjust_budget',
        category: cat.category,
        suggestion: `${cat.category} shows high variance - consider adjusting budget to $${cat.historical_avg}`,
        recommended_amount: Math.round(cat.historical_avg)
      });
    });
    return suggestions;
  }
}

module.exports = ReallocationService;
