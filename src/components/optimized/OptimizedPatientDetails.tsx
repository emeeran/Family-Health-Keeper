// Highly Optimized Patient Details Component
import React, { memo, useMemo, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { usePerformanceMonitor, useDebouncedCallback } from '../../hooks/usePerformanceOptimization';
import { LazyAIAssistant, LazyInsightsPanel } from '../../utils/lazyComponents';

interface OptimizedPatientDetailsProps {
  patientId: string;
  recordId: string;
}

// Split component into smaller, memoized parts
const PatientHeader = memo(({ patient }: { patient: any }) => (
  <div className="flex items-center gap-4 pb-4 border-b">
    <img alt={patient.name} className="w-16 h-16 rounded-full" src={patient.avatarUrl} />
    <div>
      <h3 className="text-2xl font-bold">{patient.name}</h3>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {patient.hospitalIds?.map((hid: any) => (
          <div key={hid.id}>
            <span className="font-semibold">{hid.hospitalName}:</span> {hid.patientId}
          </div>
        ))}
      </div>
    </div>
  </div>
));

PatientHeader.displayName = 'PatientHeader';

const MedicationsSection = memo(({ patientId }: { patientId: string }) => {
  const { currentMedications, onAddMedication } = useAppStore();

  return (
    <div className="mb-6">
      <h4 className="text-lg font-semibold mb-4">Current Medications</h4>
      {/* Medications content */}
    </div>
  );
});

MedicationsSection.displayName = 'MedicationsSection';

const EyeCareSection = memo(({ patientId }: { patientId: string }) => {
  const LazyEyeCareModule = React.lazy(() =>
    import('../../components/EyeCareModule').then(module => ({
      default: module.EyeCareModule
    }))
  );

  return (
    <React.Suspense fallback={<div>Loading Eye Care...</div>}>
      <LazyEyeCareModule patientId={patientId} />
    </React.Suspense>
  );
});

EyeCareSection.displayName = 'EyeCareSection';

const OptimizedPatientDetails: React.FC<OptimizedPatientDetailsProps> = memo(({ patientId, recordId }) => {
  const { measureRender } = usePerformanceMonitor('OptimizedPatientDetails');
  const endMeasure = measureRender('render');

  const {
    patients,
    doctors,
    onFormChange,
    onAddMedication,
    onAddReminder
  } = useAppStore();

  // Memoize expensive computations
  const patient = useMemo(() =>
    patients.find(p => p.id === patientId),
    [patients, patientId]
  );

  const record = useMemo(() =>
    patient?.records.find(r => r.id === recordId),
    [patient?.records, recordId]
  );

  // Debounced form changes
  const debouncedFormChange = useDebouncedCallback(onFormChange, 300);

  // Memoized handlers
  const handleMedicationAdd = useCallback((medication: any) => {
    onAddMedication(patientId, medication);
  }, [patientId, onAddMedication]);

  const handleReminderAdd = useCallback((reminder: any) => {
    onAddReminder(patientId, reminder);
  }, [patientId, onAddReminder]);

  useEffect(() => {
    endMeasure();
  });

  if (!patient || !record) {
    return <div>Patient or record not found</div>;
  }

  return (
    <div className="space-y-6">
      <PatientHeader patient={patient} />

      <LazyInsightsPanel patient={patient} />

      <MedicationsSection patientId={patientId} />

      <EyeCareSection patientId={patientId} />

      <LazyAIAssistant record={record} patient={patient} />

      {/* Other sections can be added here */}
    </div>
  );
});

OptimizedPatientDetails.displayName = 'OptimizedPatientDetails';

export default OptimizedPatientDetails;