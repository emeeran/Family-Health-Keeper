import React, { useState } from 'react';
import { useResponsive } from '../../utils/responsive';

interface NavItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  onClick?: () => void;
  badge?: number;
  children?: NavItem[];
}

interface ResponsiveNavigationProps {
  items: NavItem[];
  activeItemId?: string;
  className?: string;
  variant?: 'sidebar' | 'topbar' | 'mobile-bottom';
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  items,
  activeItemId,
  className = '',
  variant = 'sidebar',
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = activeItemId === item.id;

    if (variant === 'mobile-bottom' && isMobile) {
      return (
        <button
          key={item.id}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              item.onClick?.();
              setIsMobileMenuOpen(false);
            }
          }}
          className={`
            flex flex-col items-center justify-center p-2
            ${isActive ? 'text-blue-600' : 'text-gray-600'}
            hover:text-blue-600 transition-colors
            relative
          `}
        >
          {item.icon && (
            <span className="material-symbols-outlined text-xl mb-1">
              {item.icon}
            </span>
          )}
          <span className="text-xs font-medium">{item.label}</span>
          {item.badge && (
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {item.badge}
            </span>
          )}
        </button>
      );
    }

    return (
      <div key={item.id} className="w-full">
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              item.onClick?.();
            }
          }}
          className={`
            w-full flex items-center gap-3 px-3 py-2 rounded-lg
            transition-colors text-left
            ${isActive
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }
            ${depth > 0 ? 'ml-4' : ''}
          `}
        >
          {item.icon && (
            <span className="material-symbols-outlined">
              {item.icon}
            </span>
          )}
          <span className="flex-1 font-medium">{item.label}</span>
          {item.badge && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <span
              className={`
                material-symbols-outlined transition-transform
                ${isExpanded ? 'rotate-90' : ''}
              `}
            >
              chevron_right
            </span>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {item.children?.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Mobile overlay navigation
  if (isMobile && variant !== 'mobile-bottom') {
    return (
      <>
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
        >
          <span className="material-symbols-outlined">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Navigation
                </h2>
                <div className="space-y-1">
                  {items.map(renderNavItem)}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Sidebar navigation (desktop/tablet)
  if (variant === 'sidebar' && (isDesktop || isTablet)) {
    return (
      <nav className={className}>
        <div className="space-y-1">
          {items.map(renderNavItem)}
        </div>
      </nav>
    );
  }

  // Topbar navigation
  if (variant === 'topbar') {
    return (
      <nav className={className}>
        <div className="flex items-center space-x-1">
          {items.map(item => (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg
                transition-colors font-medium
                ${activeItemId === item.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              {item.icon && (
                <span className="material-symbols-outlined">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    );
  }

  // Mobile bottom navigation
  if (variant === 'mobile-bottom' && isMobile) {
    return (
      <div className={`
        fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700
        z-40 ${className}
      `}>
        <div className="flex justify-around items-center py-2">
          {items.slice(0, 5).map(renderNavItem)} {/* Limit to 5 items for mobile */}
        </div>
      </div>
    );
  }

  return null;
};

interface ResponsiveBreadcrumbsProps {
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  className?: string;
  maxItems?: number;
}

export const ResponsiveBreadcrumbs: React.FC<ResponsiveBreadcrumbsProps> = ({
  items,
  className = '',
  maxItems = 3,
}) => {
  const { isMobile } = useResponsive();

  // On mobile, show only current item and maybe parent
  const getDisplayItems = () => {
    if (!isMobile || items.length <= maxItems) {
      return items;
    }

    // Show first item, ..., and last 2 items
    const firstItem = items[0];
    const lastItems = items.slice(-2);

    return [
      firstItem,
      { label: '...', onClick: undefined },
      ...lastItems
    ];
  };

  const displayItems = getDisplayItems();

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      {displayItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-gray-400 mx-1">/</span>
          )}
          {item.onClick || item.href ? (
            <button
              onClick={item.onClick}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};