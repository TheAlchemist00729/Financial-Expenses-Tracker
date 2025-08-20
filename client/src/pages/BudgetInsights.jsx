import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import axios from 'axios';

// Alert Modal Component
const AlertModal = ({ alerts, isOpen, onClose, onAcknowledge }) => {
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());

  useEffect(() => {
    if (isOpen) {
      setCurrentAlertIndex(0);
      setAcknowledgedAlerts(new Set());
    }
  }, [isOpen]);

  if (!isOpen || !alerts || alerts.length === 0) {
    return null;
  }

  const currentAlert = alerts[currentAlertIndex];
  const isLastAlert = currentAlertIndex === alerts.length - 1;

  const handleAcknowledgeAlert = () => {
    const newAcknowledged = new Set(acknowledgedAlerts);
    newAcknowledged.add(currentAlert.id);
    setAcknowledgedAlerts(newAcknowledged);

    if (isLastAlert) {
      onAcknowledge(Array.from(newAcknowledged));
      onClose();
    } else {
      setCurrentAlertIndex(currentAlertIndex + 1);
    }
  };

  const handleNext = () => {
    if (!isLastAlert) {
      setCurrentAlertIndex(currentAlertIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentAlertIndex > 0) {
      setCurrentAlertIndex(currentAlertIndex - 1);
    }
  };

  const getAlertStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return {
          backgroundColor: '#fee2e2',
          borderColor: '#ef4444',
          textColor: '#7f1d1d',
          buttonColor: '#dc2626',
          buttonHoverColor: '#b91c1c',
        };
      case 'high':
        return {
          backgroundColor: '#fed7aa',
          borderColor: '#f97316',
          textColor: '#9a3412',
          buttonColor: '#ea580c',
          buttonHoverColor: '#c2410c',
        };
      case 'medium':
        return {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          textColor: '#92400e',
          buttonColor: '#d97706',
          buttonHoverColor: '#b45309',
        };
      default:
        return {
          backgroundColor: '#dbeafe',
          borderColor: '#3b82f6',
          textColor: '#1e40af',
          buttonColor: '#2563eb',
          buttonHoverColor: '#1d4ed8',
        };
    }
  };

  const styles = getAlertStyles(currentAlert.severity);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{currentAlert.icon}</span>
            <div>
              <h2
                style={{
                  margin: 0,
                  color: styles.textColor,
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                }}
              >
                {currentAlert.severity.toUpperCase()} ALERT
              </h2>
              <p
                style={{
                  margin: 0,
                  color: styles.textColor,
                  fontSize: '0.875rem',
                  opacity: 0.8,
                }}
              >
                {currentAlert.title}
              </p>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '0.25rem',
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#777',
              }}
            >
              ×
            </button>
            <span style={{ fontSize: '0.75rem', color: styles.textColor, opacity: 0.6 }}>
              {currentAlertIndex + 1} of {alerts.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: styles.backgroundColor,
              borderRadius: '6px',
              border: `2px solid ${styles.borderColor}`,
              marginBottom: '1rem',
            }}
          >
            <h4
              style={{
                margin: '0 0 0.5rem 0',
                color: styles.textColor,
                fontWeight: 'bold',
              }}
            >
              Category: {currentAlert.category}
            </h4>
            <p style={{ margin: '0 0 0.75rem 0', color: styles.textColor }}>
              {currentAlert.message}
            </p>
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '4px',
                border: `1px solid ${styles.borderColor}`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  color: styles.textColor,
                }}
              >
                📋 Recommended Action: {currentAlert.action}
              </p>
            </div>
            
            {/* Reallocation Suggestions */}
            {currentAlert.reallocationSuggestions && currentAlert.reallocationSuggestions.length > 0 && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '4px',
                  border: '1px solid #22c55e',
                }}
              >
                <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#15803d' }}>
                  💡 Budget Reallocation Suggestions:
                </h5>
                {currentAlert.reallocationSuggestions.map((suggestion, index) => (
                  <div key={index} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    <strong>Transfer ${suggestion.amount.toFixed(2)}</strong> from{' '}
                    <em>{suggestion.fromCategory}</em> to cover the deficit
                    <br />
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      ({suggestion.fromCategory} has ${suggestion.available.toFixed(2)} available, 
                      {suggestion.utilizationPercent.toFixed(1)}% utilized)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '1rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#777',
                marginBottom: '0.25rem',
              }}
            >
              <span>Alert Progress</span>
              <span>
                {currentAlertIndex + 1} / {alerts.length}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                backgroundColor: '#e5e7eb',
                borderRadius: '9999px',
                height: '8px',
              }}
            >
              <div
                style={{
                  height: '8px',
                  borderRadius: '9999px',
                  backgroundColor: styles.buttonColor,
                  transition: 'width 0.3s ease',
                  width: `${((currentAlertIndex + 1) / alerts.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Alert Summary */}
          <div
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#1f2937' }}>
              Alert Summary:
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {alerts.map((alert, index) => (
                <div
                  key={alert.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  <span style={{ color: index <= currentAlertIndex ? '#16a34a' : '#9ca3af' }}>
                    {index <= currentAlertIndex ? '✅' : '⏳'}
                  </span>
                  <span
                    style={{
                      fontWeight: index === currentAlertIndex ? 'bold' : 'normal',
                      color: index <= currentAlertIndex ? '#1f2937' : '#6b7280',
                    }}
                  >
                    {alert.category} - {alert.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrevious}
              disabled={currentAlertIndex === 0}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: currentAlertIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentAlertIndex === 0 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={isLastAlert}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: isLastAlert ? 'not-allowed' : 'pointer',
                opacity: isLastAlert ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                onAcknowledge([]);
                onClose();
              }}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Skip All
            </button>
            <button
              onClick={handleAcknowledgeAlert}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: styles.buttonColor,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {isLastAlert ? 'Acknowledge & Close' : 'Acknowledge'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Budget Reallocation Suggestions Component
const BudgetReallocationSuggestions = ({ suggestions, onAcceptSuggestion, budgetUtilization }) => {
  const [expandedSuggestions, setExpandedSuggestions] = useState(new Set());
  
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  const toggleSuggestionDetails = (index) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSuggestions(newExpanded);
  };

  const getSeverityColor = (overrunPercent) => {
    if (overrunPercent > 50) return 'text-red-800 bg-red-100 border-red-300';
    if (overrunPercent > 25) return 'text-orange-800 bg-orange-100 border-orange-300';
    if (overrunPercent > 10) return 'text-yellow-800 bg-yellow-100 border-yellow-300';
    return 'text-blue-800 bg-blue-100 border-blue-300';
  };

  const getPriorityLabel = (overrunPercent) => {
    if (overrunPercent > 50) return { label: 'URGENT', icon: '🚨' };
    if (overrunPercent > 25) return { label: 'HIGH', icon: '⚠️' };
    if (overrunPercent > 10) return { label: 'MEDIUM', icon: '⚡' };
    return { label: 'LOW', icon: '💡' };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg mb-8 border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-3 text-2xl">🎯</span>
              Smart Budget Reallocation Suggestions
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered recommendations to optimize your budget allocation and resolve overspending
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{suggestions.length}</div>
            <div className="text-xs text-gray-500">Suggestions Available</div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-6">
          {suggestions.map((suggestion, index) => {
            const priority = getPriorityLabel(suggestion.overrunPercent);
            const isExpanded = expandedSuggestions.has(index);
            
            return (
              <div 
                key={index} 
                className={`border-2 rounded-lg overflow-hidden transition-all duration-300 ${getSeverityColor(suggestion.overrunPercent)}`}
              >
                {/* Header */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">{priority.icon}</span>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-800 text-white">
                          {priority.label} PRIORITY
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                          {suggestion.overrunPercent.toFixed(1)}% Over Budget
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        📊 {suggestion.overbudgetCategory}
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Budget:</span>
                          <div className="font-semibold">${suggestion.budget.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Spent:</span>
                          <div className="font-semibold text-red-600">${suggestion.currentSpending.toFixed(2)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Deficit:</span>
                          <div className="font-bold text-red-700">${suggestion.deficit.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleSuggestionDetails(index)}
                      className="ml-4 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {isExpanded ? '▼ Hide Details' : '▶ Show Details'}
                    </button>
                  </div>

                  {/* Quick Action Button */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">
                      <strong>Quick Fix:</strong> Transfer funds from {suggestion.sources.length} 
                      underutilized {suggestion.sources.length === 1 ? 'category' : 'categories'}
                    </div>
                    <button
                      onClick={() => onAcceptSuggestion && onAcceptSuggestion(suggestion, suggestion.sources[0])}
                      className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                    >
                      Apply All Transfers
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t bg-white">
                    <div className="p-4">
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <span className="mr-2">💰</span>
                        Detailed Reallocation Plan
                      </h5>
                      
                      <div className="space-y-3">
                        {suggestion.sources.map((source, sourceIndex) => (
                          <div key={sourceIndex} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h6 className="font-medium text-gray-900 mb-1">
                                  📂 {source.category}
                                </h6>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                  <div>
                                    <span className="text-gray-600">Available:</span>
                                    <div className="font-semibold text-green-600">
                                      ${source.available.toFixed(2)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Utilization:</span>
                                    <div className="font-semibold">
                                      {source.utilizationPercent.toFixed(1)}%
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Transfer Amount:</span>
                                    <div className="font-bold text-blue-600">
                                      ${source.amount.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Progress bar for utilization */}
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Current Utilization</span>
                                    <span>{source.utilizationPercent.toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${Math.min(source.utilizationPercent, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => onAcceptSuggestion && onAcceptSuggestion(suggestion, source)}
                                className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                              >
                                Transfer ${source.amount.toFixed(0)}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Impact Analysis */}
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <h6 className="font-semibold text-blue-900 mb-2 flex items-center">
                          <span className="mr-2">📈</span>
                          Impact Analysis
                        </h6>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700">Coverage:</span>
                            <div className="font-semibold">
                              {suggestion.coverage ? suggestion.coverage.toFixed(1) : '100'}% of deficit
                            </div>
                          </div>
                          <div>
                            <span className="text-blue-700">Risk Level:</span>
                            <div className="font-semibold">
                              {suggestion.overrunPercent > 50 ? 'High' : 
                               suggestion.overrunPercent > 25 ? 'Medium' : 'Low'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-blue-700">
                          This reallocation will bring {suggestion.overbudgetCategory} back within budget 
                          while maintaining healthy utilization rates in donor categories.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Summary Footer */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-gray-900">Summary</h4>
              <p className="text-sm text-gray-600">
                Total potential savings: ${suggestions.reduce((sum, s) => sum + s.deficit, 0).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => suggestions.forEach(s => onAcceptSuggestion && onAcceptSuggestion(s, s.sources[0]))}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-md hover:from-green-700 hover:to-blue-700 transition-all duration-300"
            >
              Apply All Suggestions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sound notification function
const playAlertSound = (severity) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const frequencies = {
      critical: 800,
      high: 600,
      medium: 400,
    };

    oscillator.frequency.setValueAtTime(
      frequencies[severity] || 500,
      audioContext.currentTime
    );
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('Audio playback not available:', error);
  }
};

// Main component
const BudgetInsights = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visualizationData, setVisualizationData] = useState(null);
  const [budgetPerformance, setBudgetPerformance] = useState(null);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [criticalInsights, setCriticalInsights] = useState([]);
  const [reallocationSuggestions, setReallocationSuggestions] = useState([]);

  const [showAlertModal, setShowAlertModal] = useState(false);
  const [unacknowledgedAlerts, setUnacknowledgedAlerts] = useState([]);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState(new Set());

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
  });

  API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    fetchVisualizationData();
  }, []);

  useEffect(() => {
    if (budgetAlerts.length > 0) {
      const newAlerts = budgetAlerts.filter(
        (alert) => !acknowledgedAlertIds.has(alert.id)
      );
      if (newAlerts.length > 0) {
        setUnacknowledgedAlerts(newAlerts);
        setShowAlertModal(true);

        const highestSeverity = newAlerts.reduce((prev, current) => {
          const severityOrder = { critical: 3, high: 2, medium: 1 };
          return severityOrder[current.severity] > severityOrder[prev.severity]
            ? current
            : prev;
        });

        playAlertSound(highestSeverity.severity);
      }
    }
  }, [budgetAlerts, acknowledgedAlertIds]);

  const fetchVisualizationData = async () => {
    try {
      setLoading(true);

      const [visualResponse, performanceResponse] = await Promise.all([
        API.get('/visualization/data'),
        API.get('/visualization/budget-performance'),
      ]);

      setVisualizationData(visualResponse.data);
      setBudgetPerformance(performanceResponse.data);

      // Generate reallocation suggestions first, then use them in alerts
      const suggestions = generateReallocationSuggestions(visualResponse.data);
      setReallocationSuggestions(suggestions);
      
      generateBudgetAlerts(visualResponse.data, suggestions);
      generateCriticalInsights(visualResponse.data, performanceResponse.data, suggestions);

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load visualization data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateReallocationSuggestions = (data) => {
    if (!data || !data.budgetUtilization) return [];

    const suggestions = [];
    const budgetData = data.budgetUtilization;

    // Find overbudget categories
    const overbudgetCategories = budgetData.filter(item => 
      parseFloat(item.utilization_percentage || 0) > 100
    );

    // Find underutilized categories (less than 70% utilized)
    const underutilizedCategories = budgetData.filter(item => {
      const utilization = parseFloat(item.utilization_percentage || 0);
      const remaining = parseFloat(item.remaining_amount || 0);
      return utilization < 70 && remaining > 10; // At least $10 available
    }).sort((a, b) => parseFloat(b.remaining_amount) - parseFloat(a.remaining_amount));

    overbudgetCategories.forEach(overbudget => {
      const deficit = parseFloat(overbudget.spent_amount) - parseFloat(overbudget.budget_amount);
      const overrunPercent = ((parseFloat(overbudget.spent_amount) / parseFloat(overbudget.budget_amount)) - 1) * 100;
      
      if (deficit > 0) {
        const sources = [];
        let remainingDeficit = deficit;

        // Try to find sources to cover the deficit
        for (const source of underutilizedCategories) {
          if (remainingDeficit <= 0) break;
          
          const available = parseFloat(source.remaining_amount);
          const transferAmount = Math.min(available * 0.8, remainingDeficit); // Use max 80% of available
          
          if (transferAmount >= 5) { // Minimum $5 transfer
            sources.push({
              category: source.category,
              amount: transferAmount,
              available: available,
              utilizationPercent: parseFloat(source.utilization_percentage || 0)
            });
            remainingDeficit -= transferAmount;
          }
        }

        if (sources.length > 0) {
          suggestions.push({
            overbudgetCategory: overbudget.category,
            deficit: deficit,
            currentSpending: parseFloat(overbudget.spent_amount),
            budget: parseFloat(overbudget.budget_amount),
            overrunPercent: overrunPercent,
            sources: sources,
            coverage: ((deficit - remainingDeficit) / deficit) * 100
          });
        }
      }
    });

    return suggestions;
  };

  const generateBudgetAlerts = (data, suggestions = []) => {
    if (!data || !data.budgetUtilization) return;

    const alerts = [];

    data.budgetUtilization.forEach((item) => {
      const utilizationPercent = parseFloat(item.utilization_percentage || 0);
      const category = item.category;
      const budgetAmount = parseFloat(item.budget_amount || 0);
      const spentAmount = parseFloat(item.spent_amount || 0);
      const remainingAmount = parseFloat(item.remaining_amount || 0);

      // Find reallocation suggestions for this category
      const categoryReallocation = suggestions.find(
        suggestion => suggestion.overbudgetCategory === category
      );

      let reallocationSuggestions_alert = [];
      if (categoryReallocation) {
        reallocationSuggestions_alert = categoryReallocation.sources.map(source => ({
          fromCategory: source.category,
          amount: source.amount,
          available: source.available,
          utilizationPercent: source.utilizationPercent
        }));
      }

      if (utilizationPercent >= 100) {
        alerts.push({
          id: `critical-${category}-${Date.now()}`,
          type: 'critical',
          category,
          title: `Budget Exceeded: ${category}`,
          message: `You've spent ${spentAmount.toFixed(2)} of your ${budgetAmount.toFixed(
            2
          )} budget (${utilizationPercent.toFixed(1)}%)`,
          severity: 'critical',
          icon: '🚨',
          action: 'Immediate action required - Stop spending in this category or reallocate funds',
          reallocationSuggestions: reallocationSuggestions_alert,
          timestamp: new Date().toISOString(),
        });
      } else if (utilizationPercent >= 90) {
        alerts.push({
          id: `high-${category}-${Date.now()}`,
          type: 'high',
          category,
          title: `Budget Alert: ${category}`,
          message: `You've used ${utilizationPercent.toFixed(
            1
          )}% of your budget. Only ${remainingAmount.toFixed(2)} remaining.`,
          severity: 'high',
          icon: '⚠️',
          action: 'Monitor spending closely - Consider alternative options or reallocate funds',
          reallocationSuggestions: reallocationSuggestions_alert,
          timestamp: new Date().toISOString(),
        });
      } else if (utilizationPercent >= 80) {
        alerts.push({
          id: `medium-${category}-${Date.now()}`,
          type: 'medium',
          category,
          title: `Budget Warning: ${category}`,
          message: `You've used ${utilizationPercent.toFixed(
            1
          )}% of your budget. ${remainingAmount.toFixed(2)} remaining.`,
          severity: 'medium',
          icon: '⚡',
          action: 'Consider reducing spending in this category',
          reallocationSuggestions: reallocationSuggestions_alert,
          timestamp: new Date().toISOString(),
        });
      }
    });

    alerts.sort((a, b) => {
      const severityOrder = { critical: 3, high: 2, medium: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    setBudgetAlerts(alerts);
  };

  const generateCriticalInsights = (visualData, performanceData, suggestions = []) => {
    if (!visualData || !performanceData) return;

    const insights = [];
    const { budgetUtilization, expenseTrends } = visualData;

    if (budgetUtilization) {
      const highUtilization = budgetUtilization.filter(
        (item) => parseFloat(item.utilization_percentage || 0) >= 80
      );
      if (highUtilization.length > 0) {
        insights.push({
          id: 'high-utilization',
          title: 'High Budget Utilization',
          message: `${highUtilization.length} categories are approaching or exceeding budget limits`,
          trend: 'negative',
          priority: 'high',
        });
      }

      // Add reallocation insight
      if (suggestions.length > 0) {
        const totalDeficit = suggestions.reduce((sum, suggestion) => sum + suggestion.deficit, 0);
        insights.push({
          id: 'reallocation-opportunity',
          title: 'Budget Reallocation Opportunity',
          message: `${totalDeficit.toFixed(2)} in overbudget spending could be covered by reallocating from underutilized categories`,
          trend: 'positive',
          priority: 'medium',
        });
      }
    }

    if (expenseTrends && expenseTrends.length > 1) {
      const recent = expenseTrends.slice(-2);
      const currentSpending = parseFloat(recent[1]?.total_amount || 0);
      const previousSpending = parseFloat(recent[0]?.total_amount || 0);

      if (currentSpending > previousSpending * 1.2) {
        insights.push({
          id: 'spending-increase',
          title: 'Spending Increase Detected',
          message: `Your spending has increased by ${(
            ((currentSpending - previousSpending) / previousSpending) *
            100
          ).toFixed(1)}%`,
          trend: 'negative',
          priority: 'medium',
        });
      }
    }

    setCriticalInsights(insights);
  };

  const handleAcceptSuggestion = async (suggestion, source) => {
    // This would typically make an API call to update the budget allocations
    try {
      console.log('Accepting reallocation suggestion:', {
        from: source.category,
        to: suggestion.overbudgetCategory,
        amount: source.amount
      });
      
      // Show success message
      alert(`Budget reallocation accepted: ${source.amount.toFixed(2)} transferred from ${source.category} to ${suggestion.overbudgetCategory}`);
      
      // Refresh data after reallocation
      await fetchVisualizationData();
    } catch (error) {
      console.error('Error accepting reallocation suggestion:', error);
      alert('Failed to apply budget reallocation. Please try again.');
    }
  };

  const handleAcknowledgeAlerts = (acknowledgedIds) => {
    setAcknowledgedAlertIds((prev) => new Set([...prev, ...acknowledgedIds]));
    setShowAlertModal(false);
  };

  const handleCloseAlertModal = () => {
    setShowAlertModal(false);
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
      budgetAlerts,
      criticalInsights,
      reallocationSuggestions,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
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

  const {
    budgetData,
    expenseTrends,
    dailySpending,
    categoryBreakdown,
    budgetUtilization,
  } = visualizationData || {};

  return (
    <div className="min-h-screen bg-gray-100">
      <AlertModal
        alerts={unacknowledgedAlerts}
        isOpen={showAlertModal}
        onClose={handleCloseAlertModal}
        onAcknowledge={handleAcknowledgeAlerts}
      />

      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Budget Insights & Analytics
              </h1>
              <p className="text-sm text-gray-600">
                Comprehensive analysis of your financial data with smart reallocation suggestions
              </p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {budgetPerformance && (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Total Budget
                </h3>
                <p className="text-3xl font-bold text-blue-600">
                  ${budgetPerformance.totalBudget?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Total Spent
                </h3>
                <p className="text-3xl font-bold text-green-600">
                  ${budgetPerformance.totalSpent?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Remaining
                </h3>
                <p className="text-3xl font-bold text-yellow-600">
                  ${budgetPerformance.totalRemaining?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Utilization
                </h3>
                <p className="text-3xl font-bold text-purple-600">
                  {budgetPerformance.averageUtilization?.toFixed(1) || '0.0'}%
                </p>
              </div>
            </>
          )}
        </div>

        {/* Budget Reallocation Suggestions */}
        <BudgetReallocationSuggestions 
          suggestions={reallocationSuggestions}
          onAcceptSuggestion={handleAcceptSuggestion}
          budgetUtilization={budgetUtilization}
        />

        {/* Critical Insights */}
        {criticalInsights.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Critical Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criticalInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`border rounded-lg p-4 ${
                    insight.trend === 'positive'
                      ? 'bg-green-50 border-green-200'
                      : insight.trend === 'negative'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-gray-700">{insight.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold mb-4">Budget vs Spending</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={budgetUtilization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="budget_amount" 
                name="Budget Amount" 
                fill="#0088FE"
              />
              <Bar 
                dataKey="spent_amount" 
                name="Spent Amount" 
                fill="#FF0000"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {expenseTrends && expenseTrends.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Expense Trends
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={expenseTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total_amount" name="Total Amount" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

       <div className="bg-white p-6 rounded-lg shadow mb-8">
  <h3 className="text-xl font-semibold mb-4">Spending by Category</h3>
  {categoryBreakdown && categoryBreakdown.length > 0 ? (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={categoryBreakdown}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={120}
          innerRadius={0}
          dataKey="total_amount"
          nameKey="category"
        >
          {categoryBreakdown.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name) => [`${parseFloat(value).toFixed(2)}`, name]} 
          labelFormatter={(label) => `Category: ${label}`}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex items-center justify-center h-96 text-gray-500">
      <div className="text-center">
        <p className="text-lg mb-2">📊</p>
        <p>No category breakdown data available</p>
        <p className="text-sm mt-2">Debug: categoryBreakdown = {JSON.stringify(categoryBreakdown)}</p>
      </div>
    </div>
  )}
</div>


        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h3 className="text-xl font-semibold mb-4">Daily Spending Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailySpending || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`${parseFloat(value).toFixed(2)}`, 'Amount']} />
              <Area type="monotone" dataKey="daily_total" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tables */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alert Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reallocation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(budgetUtilization || []).map((item, index) => {
                  const utilizationPercent = parseFloat(item.utilization_percentage || 0);
                  const getStatusColor = (percent) => {
                    if (percent >= 100) return 'text-red-600 bg-red-100';
                    if (percent >= 90) return 'text-orange-600 bg-orange-100';
                    if (percent >= 80) return 'text-yellow-600 bg-yellow-100';
                    return 'text-green-600 bg-green-100';
                  };
                  const getStatusText = (percent) => {
                    if (percent >= 100) return 'Over Budget';
                    if (percent >= 90) return 'Critical';
                    if (percent >= 80) return 'Near Limit';
                    return 'On Track';
                  };
                  const getAlertLevel = (percent) => {
                    if (percent >= 100) return { text: 'Critical', color: 'text-red-600 bg-red-100' };
                    if (percent >= 90) return { text: 'High', color: 'text-orange-600 bg-orange-100' };
                    if (percent >= 80) return { text: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
                    return { text: 'Low', color: 'text-green-600 bg-green-100' };
                  };

                  const alertLevel = getAlertLevel(utilizationPercent);
                  
                  // Check if this category has reallocation suggestions
                  const hasReallocationSuggestion = reallocationSuggestions.some(
                    suggestion => suggestion.overbudgetCategory === item.category
                  );
                  
                  // Check if this category can be a donor
                  const canBeDonor = utilizationPercent < 70 && parseFloat(item.remaining_amount || 0) > 10;

                  return (
                    <tr
                      key={index}
                      className={
                        utilizationPercent >= 90
                          ? 'bg-red-50'
                          : utilizationPercent >= 80
                          ? 'bg-yellow-50'
                          : canBeDonor
                          ? 'bg-blue-50'
                          : ''
                      }
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-bold">{item.category}</span>
                          {canBeDonor && (
                            <span className="mt-1 text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded self-start">
                              💰 Reallocation Available
                            </span>
                          )}
                        </div>
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
                        <div className="flex items-center">
                          <span className={utilizationPercent >= 90 ? 'font-bold text-red-600' : ''}>
                            {utilizationPercent.toFixed(1)}%
                          </span>
                          {utilizationPercent >= 90 && <span className="ml-2 text-red-500">⚠️</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(utilizationPercent)}`}>
                          {getStatusText(utilizationPercent)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${alertLevel.color}`}>
                          {alertLevel.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {hasReallocationSuggestion ? (
                          <span className="text-green-600 font-medium">✓ Suggestions Available</span>
                        ) : canBeDonor ? (
                          <span className="text-blue-600 font-medium">💰 Can Reallocate</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance Insights */}
        {budgetPerformance && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold">Performance Insights</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Overall Budget Health
                  </h4>
                  <p
                    className={`text-2xl font-bold ${
                      budgetPerformance.overall_health === 'Good'
                        ? 'text-green-600'
                        : budgetPerformance.overall_health === 'Warning'
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}
                  >
                    {budgetPerformance.overall_health || 'N/A'}
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Categories Over Budget
                  </h4>
                  <p className="text-2xl font-bold text-red-600">
                    {budgetPerformance.categories_over_budget || 0}
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Average Utilization
                  </h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {parseFloat(budgetPerformance.avg_utilization || 0).toFixed(1)}%
                  </p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Risk Level</h4>
                  <p
                    className={`text-2xl font-bold ${
                      budgetAlerts.some((a) => a.severity === 'critical')
                        ? 'text-red-600'
                        : budgetAlerts.some((a) => a.severity === 'high')
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}
                  >
                    {budgetAlerts.some((a) => a.severity === 'critical')
                      ? 'High'
                      : budgetAlerts.some((a) => a.severity === 'high')
                      ? 'Medium'
                      : 'Low'}
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
          .print:\\hidden {
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