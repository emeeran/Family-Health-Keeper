import React, { useState, useEffect } from 'react';
import performanceMonitor, { PerformanceConfig } from '../utils/performanceMonitor';
import { ResponsiveContainer, ResponsiveFlex, ResponsiveSpacing, ResponsiveText } from './ui/ResponsiveContainer';
import { useResponsive } from '../utils/responsive';

interface PerformanceSettingsProps {
  onClose?: () => void;
}

const PerformanceSettings: React.FC<PerformanceSettingsProps> = ({ onClose }) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [config, setConfig] = useState<PerformanceConfig>(performanceMonitor['config']);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [isRealTime, setIsRealTime] = useState(true);

  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = performanceMonitor.getMetrics();
      setMetrics(currentMetrics.slice(-20)); // Show last 20 metrics
    };

    updateMetrics();

    if (isRealTime) {
      const interval = setInterval(updateMetrics, 1000);
      return () => clearInterval(interval);
    }
  }, [isRealTime]);

  const handleConfigChange = (key: keyof PerformanceConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    performanceMonitor.updateConfig(newConfig);
  };

  const handleThresholdChange = (key: string, value: number) => {
    const newConfig = {
      ...config,
      thresholds: {
        ...config.thresholds,
        [key]: value,
      },
    };
    setConfig(newConfig);
    performanceMonitor.updateConfig(newConfig);
  };

  const exportMetrics = () => {
    const metrics = performanceMonitor.getMetrics();
    const report = performanceMonitor.generateReport();
    const data = {
      config,
      metrics,
      report,
      exportTime: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllMetrics = () => {
    performanceMonitor.clearMetrics();
    setMetrics([]);
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${ms.toFixed(2)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      render: 'speed',
      api: 'api',
      storage: 'storage',
      ui: 'touch_app',
      memory: 'memory',
      network: 'wifi',
    };
    return icons[category as keyof typeof icons] || 'analytics';
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

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <ResponsiveFlex direction="row" justify="between" align="center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure performance monitoring and metrics collection
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportMetrics}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Export
            </button>
            <button
              onClick={clearAllMetrics}
              className="px-3 py-1 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
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

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <ResponsiveContainer maxWidth="4xl">
          <ResponsiveFlex direction="col" gap="lg">
            {/* General Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">General Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Performance Monitoring</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Collect and track performance metrics</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => handleConfigChange('enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sample Rate</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Percentage of operations to monitor</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.sampleRate}
                      onChange={(e) => handleConfigChange('sampleRate', parseFloat(e.target.value))}
                      className="w-24"
                      disabled={!config.enabled}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                      {(config.sampleRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Max Metrics</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Maximum number of metrics to store</p>
                  </div>
                  <input
                    type="number"
                    min="100"
                    max="10000"
                    value={config.maxMetrics}
                    onChange={(e) => handleConfigChange('maxMetrics', parseInt(e.target.value))}
                    className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                    disabled={!config.enabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Report Interval</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Time between performance reports</p>
                  </div>
                  <select
                    value={config.reportInterval / 1000}
                    onChange={(e) => handleConfigChange('reportInterval', parseInt(e.target.value) * 1000)}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                    disabled={!config.enabled}
                  >
                    <option value="10">10 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                    <option value="300">5 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Threshold Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Performance Thresholds</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Render Time</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Maximum acceptable render time</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.thresholds.renderTime}
                      onChange={(e) => handleThresholdChange('renderTime', parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      disabled={!config.enabled}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">ms</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">API Time</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Maximum acceptable API response time</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="100"
                      max="10000"
                      value={config.thresholds.apiTime}
                      onChange={(e) => handleThresholdChange('apiTime', parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      disabled={!config.enabled}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">ms</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage Time</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Maximum acceptable storage operation time</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={config.thresholds.storageTime}
                      onChange={(e) => handleThresholdChange('storageTime', parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      disabled={!config.enabled}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">ms</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory Usage</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Maximum acceptable memory usage</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={config.thresholds.memoryUsage / (1024 * 1024)}
                      onChange={(e) => handleThresholdChange('memoryUsage', parseInt(e.target.value) * 1024 * 1024)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                      disabled={!config.enabled}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Real-time Metrics</h3>
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
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {metrics.length > 0 ? (
                  metrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex items-center space-x-2">
                        <span className={`material-symbols-outlined text-sm ${getCategoryColor(metric.category)}`}>
                          {getCategoryIcon(metric.category)}
                        </span>
                        <span className="text-sm font-medium">{metric.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {formatDuration(metric.value)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <span className="material-symbols-outlined text-4xl">analytics</span>
                    <p className="mt-2">No metrics collected yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Monitoring Status:</span>
                  <span className={`font-medium ${config.enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {config.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Metrics:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {metrics.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sample Rate:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {(config.sampleRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Next Report:</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {config.enabled ? `${config.reportInterval / 1000}s` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </ResponsiveFlex>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceSettings;