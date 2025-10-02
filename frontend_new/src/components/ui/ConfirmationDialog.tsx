import React from 'react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      bg: 'bg-red-600 hover:bg-red-700',
      icon: 'error',
      iconColor: 'text-red-600'
    },
    warning: {
      bg: 'bg-yellow-600 hover:bg-yellow-700',
      icon: 'warning',
      iconColor: 'text-yellow-600'
    },
    info: {
      bg: 'bg-blue-600 hover:bg-blue-700',
      icon: 'info',
      iconColor: 'text-blue-600'
    }
  };

  const currentStyle = typeStyles[type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full animate-scale-in">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`material-symbols-outlined text-2xl ${currentStyle.iconColor}`}>
              {currentStyle.icon}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {message}
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${currentStyle.bg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;