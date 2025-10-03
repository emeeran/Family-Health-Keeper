// Optimized Router with Lazy Loading
import React, { Suspense, memo } from 'react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { WelcomeScreen } from '../components/WelcomeScreen';

// Lazy loaded components for code splitting
const PatientDetails = React.lazy(() =>
  import('../features/patients/components/PatientDetails').then(module => ({
    default: module.PatientDetails
  }))
);

const BackupManager = React.lazy(() =>
  import('../components/BackupManager').then(module => ({
    default: module.BackupManagerComponent
  }))
);

const SecuritySettings = React.lazy(() =>
  import('../components/SecuritySettings').then(module => ({
    default: module.default
  }))
);

const PerformanceDashboard = React.lazy(() =>
  import('../components/PerformanceDashboard').then(module => ({
    default: module.default
  }))
);

interface AppRouterProps {
  // Props will be passed through context
}

const AppRouter: React.FC<AppRouterProps> = memo(() => {
  // This is a simplified router - in production, you'd use react-router
  // For now, we'll manage routing through state

  return (
    <Suspense fallback={<LoadingSpinner size="lg" message="Loading..." />}>
      <Routes />
    </Suspense>
  );
});

// Internal routing component
const Routes: React.FC = memo(() => {
  const { selectedPatient, selectedRecord } = useAppRouterContext();

  if (!selectedPatient || !selectedRecord) {
    return <WelcomeScreen />;
  }

  return <PatientDetails patient={selectedPatient} selectedRecord={selectedRecord} />;
});

// Hook to get router context (simplified)
const useAppRouterContext = () => {
  // This would normally come from a router context
  // For now, return mock data
  return {
    selectedPatient: null,
    selectedRecord: null
  };
};

AppRouter.displayName = 'AppRouter';
Routes.displayName = 'Routes';

export { AppRouter, useAppRouterContext };