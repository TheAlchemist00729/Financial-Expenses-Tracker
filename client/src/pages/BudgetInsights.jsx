import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import axios from 'axios';

// Use the same API configuration as your working services
const API = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  console.log('=== VISUALIZATION REQUEST DEBUG ===');
  console.log('Full URL:', `${config.baseURL}${config.url}`);
  console.log('Method:', config.method);
  console.log('Token exists:', !!token);
  
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  response => {
    console.log('=== VISUALIZATION RESPONSE SUCCESS ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    return response;
  },
  error => {
    console.log('=== VISUALIZATION RESPONSE ERROR ===');
    console.log('Error type:', error.code);
    console.log('Error message:', error.message);
    console.log('Response status:', error.response?.status);
    console.log('Response data:', error.response?.data);
    console.log('Full error:', error);
    return Promise.reject(error);
  }
);

const BudgetInsights = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visualizationData, setVisualizationData] = useState(null);
  const [budgetPerformance, setBudgetPerformance] = useState(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  useEffect(() => {
    fetchVisualizationData();
  }, []);

  const fetchVisualizationData = async () => {
    try {
      setLoading(true);
      
      // Debug token
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      
      console.log('📡 Making API calls to:');
      console.log('  - /api/visualization/data');
      console.log('  - /api/visualization/budget-performance');
      
      const [visualResponse, performanceResponse] = await Promise.all([
        API.get('/api/visualization/data'),
        API.get('/api/visualization/budget-performance')
      ]);

      console.log('✅ Visualization response:', visualResponse.data);
      console.log('✅ Performance response:', performanceResponse.data);

      setVisualizationData(visualResponse.data);
      setBudgetPerformance(performanceResponse.data);
      setError(null);
    } catch (err) {
      console.error('❌ Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      setError('Failed to load visualization data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportData = () => {
    const dataToExport = {
      visualizationData,
      budgetPerformance,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-insights-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your budget insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={fetchVisualizationData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
          >
            Retry
          </button>
          <button
            onClick={handleBackToDashboard}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { budgetData, expenseTrends, dailySpending, categoryBreakdown, budgetUtilization } = visualizationData || {};

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Budget Insights & Analytics</h1>
              <p className="text-sm text-gray-600">Comprehensive analysis of your financial data</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleBackToDashboard}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handlePrint}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Print Report
              </button>
              <button
                onClick={handleExportData}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Export Data
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Budget</h3>
            <p className="text-2xl font-bold text-blue-600">
              ${budgetData?.reduce((sum, item) => sum + parseFloat(item.budget_amount || 0), 0).toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Spent</h3>
            <p className="text-2xl font-bold text-red-600">
              ${budgetData?.reduce((sum, item) => sum + parseFloat(item.spent_amount || 0), 0).toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remaining Budget</h3>
            <p className="text-2xl font-bold text-green-600">
              ${budgetData?.reduce((sum, item) => sum + (parseFloat(item.remaining_amount || 0)), 0).toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Categories</h3>
            <p className="text-2xl font-bold text-purple-600">
              {budgetData?.length || 0}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Budget vs Spending Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Budget vs Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, '']} />
                <Legend />
                <Bar dataKey="budget_amount" fill="#0088FE" name="Budget" />
                <Bar dataKey="spent_amount" fill="#FF8042" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Expense Trends */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Spending Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={expenseTrends || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Amount']} />
                <Line type="monotone" dataKey="total_amount" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_amount"
                >
                  {(categoryBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Spending Area Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Daily Spending Pattern</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailySpending || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${parseFloat(value).toFixed(2)}`, 'Amount']} />
                <Area type="monotone" dataKey="daily_total" stroke="#FFBB28" fill="#FFBB28" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Utilization Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold">Budget Utilization Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilization %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(budgetUtilization || []).map((item, index) => {
                  const utilizationPercent = parseFloat(item.utilization_percentage || 0);
                  const getStatusColor = (percent) => {
                    if (percent >= 100) return 'text-red-600 bg-red-100';
                    if (percent >= 80) return 'text-yellow-600 bg-yellow-100';
                    return 'text-green-600 bg-green-100';
                  };
                  const getStatusText = (percent) => {
                    if (percent >= 100) return 'Over Budget';
                    if (percent >= 80) return 'Near Limit';
                    return 'On Track';
                  };

                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(item.budget_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(item.spent_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${parseFloat(item.remaining_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {utilizationPercent.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(utilizationPercent)}`}>
                          {getStatusText(utilizationPercent)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Budget Performance Insights */}
        {budgetPerformance && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold">Performance Insights</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Overall Budget Health</h4>
                  <p className={`text-2xl font-bold ${
                    budgetPerformance.overall_health === 'Good' ? 'text-green-600' :
                    budgetPerformance.overall_health === 'Warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {budgetPerformance.overall_health || 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Categories Over Budget</h4>
                  <p className="text-2xl font-bold text-red-600">
                    {budgetPerformance.categories_over_budget || 0}
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Average Utilization</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {parseFloat(budgetPerformance.avg_utilization || 0).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print:hidden {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
          .shadow {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BudgetInsights;