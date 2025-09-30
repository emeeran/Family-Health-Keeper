import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { Patient, Doctor, MedicalRecord } from '../types';

// Lazy load heavy components
const PatientFormModal = lazy(() => import('../components/PatientFormModal'));
const RecordFormModal = lazy(() => import('../components/RecordFormModal'));
const DoctorEditModal = lazy(() => import('../components/DoctorEditModal'));
const AIAssistant = lazy(() => import('../components/AIAssistant'));

// Type definitions for modal props
interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PatientFormModalProps extends BaseModalProps {
  onSave: (patientData: Omit<Patient, 'id'>) => void;
  editData?: Patient | null;
  doctors: Doctor[];
}

interface RecordFormModalProps extends BaseModalProps {
  onSave: (recordData: Omit<MedicalRecord, 'id' | 'documents'>, files?: File[]) => void;
  editData?: MedicalRecord | null;
  doctors: Doctor[];
}

interface DoctorEditModalProps extends BaseModalProps {
  onSave: (doctorData: Omit<Doctor, 'id'>) => void;
  editData?: Doctor | null;
  doctors: Doctor[];
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: Patient | null;
}

// Loading fallback for lazy components
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <LoadingSpinner size="lg" message="Loading..." />
  </div>
);

// Lazy loaded modal components with loading states
export const LazyPatientFormModal = (props: PatientFormModalProps) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <PatientFormModal {...props} />
  </Suspense>
);

export const LazyRecordFormModal = (props: RecordFormModalProps) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <RecordFormModal {...props} />
  </Suspense>
);

export const LazyDoctorEditModal = (props: DoctorEditModalProps) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <DoctorEditModal {...props} />
  </Suspense>
);

export const LazyAIAssistant = (props: AIAssistantProps) => (
  <Suspense fallback={<div className="animate-pulse">Loading AI Assistant...</div>}>
    <AIAssistant {...props} />
  </Suspense>
);