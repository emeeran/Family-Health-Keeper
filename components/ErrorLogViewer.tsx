import React, { useState, useEffect } from 'react';
import { errorLogger, ErrorLogEntry } from '../services/errorLogger';

export const ErrorLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [stats, setStats] = useState(errorLogger.getErrorStats());
  const [selectedLog, setSelectedLog] = useState<ErrorLogEntry | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
    }
  }, [isOpen, filter]);

  const refreshLogs = () => {
    const allLogs = errorLogger.getErrorLogs(50);
    const filteredLogs = filter === 'all'
      ? allLogs
      : allLogs.filter(log => log.error.severity === filter);

    setLogs(filteredLogs);
    setStats(errorLogger.getErrorStats());
  };

  const handleClearLogs = () => {
    errorLogger.clearLogs();
    refreshLogs();
    setSelectedLog(null);
  };

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `error-logs-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg transition-colors duration-200"
        title="Error Log Viewer"
      >
        <span className="material-symbols-outlined">bug_report</span>
        {stats.total > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {stats.total}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Error Logs
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Total: {stats.total}</span>
                <span>Critical: {stats.bySeverity.critical}</span>
                <span>High: {stats.bySeverity.high}</span>
                <span>Medium: {stats.bySeverity.medium}</span>
                <span>Low: {stats.bySeverity.low}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshLogs}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                title="Refresh"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
              <button
                onClick={handleExportLogs}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                title="Export Logs"
              >
                <span className="material-symbols-outlined">download</span>
              </button>
              <button
                onClick={handleClearLogs}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                title="Clear Logs"
              >
                <span className="material-symbols-outlined">clear_all</span>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                title="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map(severity => (
              <button
                key={severity}
                onClick={() => setFilter(severity)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  filter === severity
                    ? getSeverityColor(severity)
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                }`}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          {/* Log List */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-400">check_circle</span>
                <p className="text-gray-600 dark:text-gray-400 mt-2">No error logs found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedLog?.id === log.id ? 'bg-gray-50 dark:bg-gray-700' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${getSeverityColor(log.error.severity)}`}>
                            {log.error.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {log.error.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {log.error.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {formatTimestamp(log.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Log Details */}
          <div className="w-1/2 overflow-y-auto">
            {selectedLog ? (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Error Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ID:</span>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{selectedLog.id}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Timestamp:</span>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                        {formatTimestamp(selectedLog.timestamp)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Error Type:</span>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{selectedLog.error.name}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Code:</span>
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{selectedLog.error.code}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Severity:</span>
                      <span className={`ml-2 px-2 py-1 text-xs rounded font-medium ${getSeverityColor(selectedLog.error.severity)}`}>
                        {selectedLog.error.severity.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Message:</span>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {selectedLog.error.message}
                      </p>
                    </div>
                    {selectedLog.context && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Context:</span>
                        <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                          {JSON.stringify(selectedLog.context, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.stack && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stack Trace:</span>
                        <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
                          {selectedLog.stack}
                        </pre>
                      </div>
                    )}
                    {selectedLog.userAgent && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User Agent:</span>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 break-all">
                          {selectedLog.userAgent}
                        </p>
                      </div>
                    )}
                    {selectedLog.url && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">URL:</span>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 break-all">
                          {selectedLog.url}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-400">info</span>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Select an error log to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorLogViewer;