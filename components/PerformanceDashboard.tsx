import React, { useState, useEffect } from 'react';
import performanceMonitor, { PerformanceReport, PerformanceMetric } from '../utils/performanceMonitor';
import { ResponsiveContainer, ResponsiveFlex, ResponsiveSpacing, ResponsiveText } from './ui/ResponsiveContainer';
import { useResponsive } from '../utils/responsive';

interface PerformanceDashboardProps {
  onClose?: () => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, trend, status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      case 'stable': return 'trending_flat';
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        {trend && (
          <span className={`material-symbols-outlined text-sm ${getStatusColor()}`}>
            {getTrendIcon()}
          </span>
        )}
      </div>
      <div className={`text-2xl font-bold ${getStatusColor()}`}>
        {typeof value === 'number' ? value.toFixed(2) : value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>
    </div>
  );
};

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ onClose }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isRealTime, setIsRealTime] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = performanceMonitor.getMetrics();
      setMetrics(currentMetrics);
      setReport(performanceMonitor.generateReport());
    };

    updateMetrics();

    if (isRealTime) {
      const interval = setInterval(updateMetrics, 1000);
      return () => clearInterval(interval);
    }
  }, [isRealTime]);

  const filteredMetrics = selectedCategory === 'all'
    ? metrics
    : metrics.filter(m => m.category === selectedCategory);

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getMetricStatus = (value: number, category: string) => {
    const thresholds = performanceMonitor['config'].thresholds;
    const threshold = thresholds[`${category}Time` as keyof typeof thresholds];

    if (!threshold) return 'good';
    if (value > threshold * 2) return 'critical';
    if (value > threshold) return 'warning';
    return 'good';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      render: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      api: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      storage: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ui: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      memory: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      network: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const categories = ['all', 'render', 'api', 'storage', 'ui', 'memory', 'network'];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <ResponsiveFlex direction="row" justify="between" align="center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Dashboard</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time application performance monitoring
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsRealTime(!isRealTime)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                isRealTime
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {isRealTime ? 'Live' : 'Paused'}
            </button>
            <button
              onClick={() => performanceMonitor.clearMetrics()}
              className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
          </div>
        </ResponsiveFlex>
      </div>

      {/* Category Filter */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <ResponsiveFlex direction="row" wrap="wrap" gap="sm">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </ResponsiveFlex>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <ResponsiveContainer maxWidth="7xl">
          <ResponsiveFlex direction="col" gap="lg">
            {/* Summary Cards */}
            {report && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Avg Render Time"
                  value={report.summary.averageRenderTime}
                  unit="ms"
                  status={getMetricStatus(report.summary.averageRenderTime, 'render')}
                />
                <MetricCard
                  title="Avg API Time"
                  value={report.summary.averageApiTime}
                  unit="ms"
                  status={getMetricStatus(report.summary.averageApiTime, 'api')}
                />
                <MetricCard
                  title="Memory Usage"
                  value={formatBytes(report.summary.memoryUsage)}
                  status={getMetricStatus(report.summary.memoryUsage, 'memory')}
                />
                <MetricCard
                  title="Total Metrics"
                  value={report.summary.totalMetrics}
                  unit="ops"
                />
              </div>
            )}

            {/* Performance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>Performance chart would be rendered here</p>
                <p className="text-sm ml-2">(Chart implementation would use a library like Chart.js or Recharts)</p>
              </div>
            </div>

            {/* Slowest Operations */}
            {report && report.summary.slowestOperations.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Slowest Operations</h3>
                <div className="space-y-3">
                  {report.summary.slowestOperations.slice(0, 5).map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(metric.category)}`}>
                          {metric.category}
                        </span>
                        <span className="font-medium">{metric.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${getMetricStatus(metric.value, metric.category) === 'critical' ? 'text-red-600' : getMetricStatus(metric.value, metric.category) === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {metric.value.toFixed(2)}ms
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Metrics Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detailed Metrics</h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredMetrics.length} metrics
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">Name</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">Category</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">Value</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-gray-600 dark:text-gray-400">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMetrics.slice(-50).reverse().map((metric, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-2 px-3 text-sm">{metric.name}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(metric.category)}`}>
                            {metric.category}
                          </span>
                        </td>
                        <td className={`py-2 px-3 text-sm font-medium ${
                          getMetricStatus(metric.value, metric.category) === 'critical' ? 'text-red-600' :
                          getMetricStatus(metric.value, metric.category) === 'warning' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {metric.value.toFixed(2)}ms
                        </td>
                        <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ResponsiveFlex>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceDashboard;