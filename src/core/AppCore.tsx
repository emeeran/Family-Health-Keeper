// Consolidated Core App Component
import React, { memo, useMemo, useCallback } from 'react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { OfflineStatusIndicator } from '../components/OfflineStatusIndicator';
import { useAppStore } from '../stores/useAppStore';
import { useResponsive } from '../utils/responsive';
import { AppRouter } from './AppRouter';
import { AppLayout } from './AppLayout';

// Optimized main app component with consolidated logic
const AppCore: React.FC = memo(() => {
  const {
    theme,
    patients,
    selectedPatientId,
    selectedRecordId,
    initializeData
  } = useAppStore();

  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Memoize expensive computations
  const selectedPatient = useMemo(() =>
    patients.find(p => p.id === selectedPatientId),
    [patients, selectedPatientId]
  );

  const selectedRecord = useMemo(() =>
    selectedPatient?.records.find(r => r.id === selectedRecordId),
    [selectedPatient, selectedRecordId]
  );

  // Optimized initialization
  const handleInitialize = useCallback(async () => {
    try {
      await initializeData();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  }, [initializeData]);

  // Initialize once on mount
  React.useEffect(() => {
    handleInitialize();
  }, [handleInitialize]);

  const contextValue = useMemo(() => ({
    isMobile,
    isTablet,
    isDesktop,
    selectedPatient,
    selectedRecord,
    theme
  }), [isMobile, isTablet, isDesktop, selectedPatient, selectedRecord, theme]);

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col text-text-light dark:text-text-dark bg-background-light dark:bg-background-dark">
        <AppLayout context={contextValue}>
          <AppRouter />
        </AppLayout>
        <OfflineStatusIndicator />
      </div>
    </ErrorBoundary>
  );
});

AppCore.displayName = 'AppCore';

export default AppCore;