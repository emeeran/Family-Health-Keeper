// Optimized Layout Component with Responsive Design
import React, { memo, useMemo } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { MobileNavigation } from '../components/ui/ResponsiveNavigation';
import { ResponsiveContainer, ResponsiveFlex } from '../components/ui/ResponsiveContainer';

interface AppLayoutProps {
  context: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    selectedPatient?: any;
    selectedRecord?: any;
    theme: string;
  };
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = memo(({ context, children }) => {
  const { isMobile, isTablet, isDesktop } = context;

  // Memoize layout configuration
  const layoutConfig = useMemo(() => ({
    showSidebar: !isMobile,
    sidebarWidth: isTablet ? 'w-64' : 'w-80',
    mainPadding: isMobile ? 'p-4' : 'p-6'
  }), [isMobile, isTablet]);

  return (
    <ResponsiveFlex direction="row" className="flex-1 overflow-hidden">
      {/* Sidebar - Hidden on mobile */}
      {layoutConfig.showSidebar && (
        <div className={`${layoutConfig.sidebarWidth} border-r border-gray-200 dark:border-gray-700 overflow-y-auto`}>
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <ResponsiveContainer maxWidth="7xl">
            <Header />
          </ResponsiveContainer>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <ResponsiveContainer maxWidth="7xl" className={layoutConfig.mainPadding}>
            {children}
          </ResponsiveContainer>
        </main>
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNavigation
          items={[
            { id: 'patients', label: 'Family Members', icon: 'people' },
            { id: 'add-patient', label: 'Add Member', icon: 'person_add' },
            { id: 'search', label: 'Search', icon: 'search' }
          ]}
          variant="mobile-bottom"
        />
      )}
    </ResponsiveFlex>
  );
});

AppLayout.displayName = 'AppLayout';

export { AppLayout };