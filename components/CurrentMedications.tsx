import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { AlertCircle, Clock, CheckCircle, Plus, Pill } from 'lucide-react';
import type { Patient, Medication, Doctor } from '../types';
import { MedicationReconciliationService } from '../services/medicationReconciliation';
import BulkMedicationModal from './BulkMedicationModal';

interface MedicationModalProps {
  isOpen: boolean;
  medication: Medication | null; // null for adding new
  onSave: (medicationData: Omit<Medication, 'id'> | Medication) => void;
  onClose: () => void;
}

const MedicationModal: React.FC<MedicationModalProps> = ({
  isOpen,
  medication,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    strength: '',
    dosage: '',
    frequency: 'Once daily',
    timings: [] as string[],
    prescribedBy: '',
    startDate: '',
    notes: '',
  });

  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name || '',
        strength: medication.strength || '',
        dosage: medication.dosage || '',
        frequency: medication.frequency || 'Once daily',
        timings: medication.timings || [],
        prescribedBy: medication.prescribedBy || '',
        startDate: medication.startDate || '',
        notes: medication.notes || '',
      });
    } else {
      setFormData({
        name: '',
        strength: '',
        dosage: '',
        frequency: 'Once daily',
        timings: [],
        prescribedBy: '',
        startDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
  }, [medication, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleTimingChange = (index: number, value: string) => {
    const newTimings = [...formData.timings];
    newTimings[index] = value;
    setFormData(prev => ({ ...prev, timings: newTimings }));
  };

  const handleAddTiming = () => {
    setFormData(prev => ({ ...prev, timings: [...prev.timings, '09:00'] }));
  };

  const handleRemoveTiming = (index: number) => {
    setFormData(prev => ({ ...prev, timings: prev.timings.filter((_, i) => i !== index) }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.dosage.trim()) {
      alert('Medication name and dosage are required.');
      return;
    }
    if (medication) {
      onSave({ ...medication, ...formData });
    } else {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  const frequencyOptions = [
    'Once daily',
    'Twice daily',
    'Three times daily',
    'As needed',
    'Weekly',
    'Other',
  ];

  return (
    <div
      className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'
      aria-modal='true'
      role='dialog'
    >
      <div className='bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col'>
        <div className='p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center'>
          <h3 className='text-lg font-semibold'>
            {medication ? 'Edit Medication' : 'Add New Medication'}
          </h3>
          <button
            onClick={onClose}
            aria-label='Close medication form'
            className='p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700'
          >
            <span className='material-symbols-outlined'>close</span>
          </button>
        </div>
        <form onSubmit={handleSave} className='p-6 space-y-4 overflow-y-auto'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='name'
                className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1'
              >
                Medication Name
              </label>
              <input
                id='name'
                type='text'
                value={formData.name}
                onChange={handleChange}
                className='w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm'
                required
              />
            </div>
            <div>
              <label
                htmlFor='strength'
                className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1'
              >
                Strength (e.g., 500mg)
              </label>
              <input
                id='strength'
                type='text'
                value={formData.strength}
                onChange={handleChange}
                className='w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm'
              />
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='dosage'
                className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1'
              >
                Dosage (e.g., 1 tablet)
              </label>
              <input
                id='dosage'
                type='text'
                value={formData.dosage}
                onChange={handleChange}
                className='w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm'
                required
              />
            </div>
            <div>
              <label
                htmlFor='frequency'
                className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1'
              >
                Frequency
              </label>
              <select
                id='frequency'
                value={formData.frequency}
                onChange={handleChange}
                className='w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm'
              >
                {frequencyOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1'>
              Specific Times
            </label>
            <div className='space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-border-light dark:border-border-dark'>
              {formData.timings.length > 0 ? (
                formData.timings.map((time, index) => (
                  <div key={index} className='flex items-center gap-2'>
                    <input
                      type='time'
                      value={time}
                      onChange={e => handleTimingChange(index, e.target.value)}
                      className='w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm'
                    />
                    <button
                      type='button'
                      onClick={() => handleRemoveTiming(index)}
                      className='p-2 text-subtle-light dark:text-subtle-dark hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700'
                      title='Remove Time'
                      aria-label={`Remove time slot ${index + 1}`}
                    >
                      <span className='material-symbols-outlined text-base'>delete</span>
                    </button>
                  </div>
                ))
              ) : (
                <p className='text-xs text-subtle-light dark:text-subtle-dark italic text-center py-1'>
                  No specific times set.
                </p>
              )}
              <button
                type='button'
                onClick={handleAddTiming}
                className='flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-subtle-light dark:text-subtle-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors w-full justify-center'
              >
                <span className='material-symbols-outlined text-sm'>add</span>
                Add Time
              </button>
            </div>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='prescribedBy'
                className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1'
              >
                Prescribed By (Optional)
              </label>
              <input
                id='prescribedBy'
                type='text'
                value={formData.prescribedBy}
                onChange={handleChange}
                className='w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm'
              />
            </div>
            <div>
              <label
                htmlFor='startDate'
                className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1'
              >
                Start Date (Optional)
              </label>
              <input
                id='startDate'
                type='date'
                value={formData.startDate}
                onChange={handleChange}
                className='w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm'
              />
            </div>
          </div>
          <div>
            <label
              htmlFor='notes'
              className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1'
            >
              Notes (Optional)
            </label>
            <textarea
              id='notes'
              value={formData.notes}
              placeholder='e.g., Take with food'
              onChange={handleChange}
              className='w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm'
              rows={2}
            ></textarea>
          </div>
        </form>
        <div className='p-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 text-sm font-medium text-subtle-light dark:text-subtle-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleSave}
            className='px-4 py-2 text-sm font-medium text-white bg-primary-DEFAULT rounded-md hover:bg-primary-hover transition-colors'
          >
            Save Medication
          </button>
        </div>
      </div>
    </div>
  );
};

interface CurrentMedicationsProps {
  patient: Patient;
  doctors?: Doctor[];
  onAddMedication: (patientId: string, medication: Omit<Medication, 'id'>) => void;
  onAddBulkMedications: (patientId: string, medications: Omit<Medication, 'id'>[]) => void;
  onUpdateMedication: (patientId: string, medication: Medication) => void;
  onDeleteMedication: (patientId: string, medicationId: string) => void;
  onRequestReminder: (medicationData: Omit<Medication, 'id'>) => void;
}

const CurrentMedications: React.FC<CurrentMedicationsProps> = memo(
  ({ patient, doctors = [], onAddMedication, onAddBulkMedications, onUpdateMedication, onDeleteMedication, onRequestReminder }) => {
    const [modalState, setModalState] = useState<{
      isOpen: boolean;
      medication: Medication | null;
    }>({ isOpen: false, medication: null });
    const [showReconciliationAlert, setShowReconciliationAlert] = useState(false);
    const [bulkModalState, setBulkModalState] = useState<{
      isOpen: boolean;
      editingMedications: Medication[];
    }>({ isOpen: false, editingMedications: [] });

    // Keyboard shortcuts for quick access
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Only trigger shortcuts when not in input fields
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
          return;
        }

        // Ctrl+B or Cmd+B for bulk add
        if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
          event.preventDefault();
          if (!bulkModalState.isOpen && !modalState.isOpen) {
            setBulkModalState({ isOpen: true, editingMedications: [] });
          }
        }

        // Ctrl+M or Cmd+M for single add
        if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
          event.preventDefault();
          if (!modalState.isOpen && !bulkModalState.isOpen) {
            setModalState({ isOpen: true, medication: null });
          }
        }

        // Escape to close any open modal
        if (event.key === 'Escape') {
          if (bulkModalState.isOpen) {
            setBulkModalState({ isOpen: false, editingMedications: [] });
          } else if (modalState.isOpen) {
            setModalState({ isOpen: false, medication: null });
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [bulkModalState.isOpen, modalState.isOpen]);

    // Check for medication reconciliation whenever records or medications change
    const reconciliationResult = useMemo(() => {
      if (!patient.records || patient.records.length === 0) return null;

      const recentRecords = patient.records.slice(-5); // Check last 5 records
      const result = MedicationReconciliationService.reconcileMedications(
        patient.currentMedications || [],
        recentRecords,
      );

      // Show alert if there are changes that require attention
      if (result.changes.length > 0) {
        setShowReconciliationAlert(true);
      }

      return result;
    }, [patient.records, patient.currentMedications]);

    // Auto-apply medication changes from recent prescriptions
    const applyReconciliationChanges = () => {
      if (!reconciliationResult) return;

      reconciliationResult.changes.forEach(change => {
        if (change.changeType === 'added') {
          onAddMedication(patient.id, change.medication);
        } else if (change.changeType === 'modified' && change.previousMedication) {
          onUpdateMedication(patient.id, { ...change.previousMedication, ...change.medication });
        }
      });

      setShowReconciliationAlert(false);
    };

    const compactFrequency = (freq: string): string => {
      if (!freq) return '';
      const lowerFreq = freq.toLowerCase();
      if (lowerFreq.includes('once daily')) return '1x/day';
      if (lowerFreq.includes('twice daily')) return '2x/day';
      if (lowerFreq.includes('three times daily')) return '3x/day';
      if (lowerFreq.includes('as needed')) return 'PRN';
      if (lowerFreq.includes('weekly')) return '1x/wk';
      return freq;
    };

    const handleSave = (medicationData: Omit<Medication, 'id'> | Medication) => {
      if ('id' in medicationData) {
        onUpdateMedication(patient.id, medicationData);
      } else {
        onAddMedication(patient.id, medicationData);
        if (window.confirm(`Would you like to add a refill reminder for ${medicationData.name}?`)) {
          onRequestReminder(medicationData);
        }
      }
      setModalState({ isOpen: false, medication: null });
    };

    const handleDelete = (medicationId: string) => {
      onDeleteMedication(patient.id, medicationId);
    };

    const meds = patient.currentMedications || [];

    return (
      <div className='py-6 border-b border-border-light dark:border-border-dark'>
        <div className='flex justify-between items-center mb-4'>
          <div className='flex items-center gap-2'>
            <span className='material-symbols-outlined text-primary-DEFAULT'>pill</span>
            <h4 className='text-lg font-semibold text-text-light dark:text-text-dark'>
              Current Medications
            </h4>
          </div>
          <div className='flex items-center gap-2'>
            <div className="relative group">
              <button
                onClick={() => setBulkModalState({ isOpen: true, editingMedications: [] })}
                disabled={bulkModalState.isOpen || modalState.isOpen}
                className='flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md'
                title="Add Multiple Medications (Ctrl+B)"
                aria-label="Add Multiple Medications with smart templates and quick entry (Ctrl+B)"
              >
                <Plus className='w-4 h-4' />
                <span className='hidden sm:inline'>Bulk Add</span>
                <span className="hidden lg:inline ml-1 text-xs bg-blue-700 px-1.5 py-0.5 rounded">⌘B</span>
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                  <div className="font-semibold mb-1">Streamlined Bulk Entry</div>
                  <div className="text-gray-300">• Smart templates</div>
                  <div className="text-gray-300">• Auto-completion</div>
                  <div className="text-gray-300">• Quick combinations</div>
                  <div className="text-blue-300 mt-1 pt-1 border-t border-gray-700">Press ⌘B or Ctrl+B</div>
                  <div className="absolute top-full right-2 -mt-1">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setModalState({ isOpen: true, medication: null })}
              disabled={modalState.isOpen || bulkModalState.isOpen}
              className='flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-secondary rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              title="Add Single Medication (Ctrl+M)"
              aria-label="Add Single Medication (Ctrl+M)"
            >
              <span className='material-symbols-outlined text-base'>medication</span>
              <span className='hidden sm:inline ml-1'>Add</span>
            </button>
          </div>
        </div>

        {/* Medication Reconciliation Alert */}
        {showReconciliationAlert && reconciliationResult && (
          <div className='mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0' />
              <div className='flex-1'>
                <h4 className='text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2'>
                  New Prescriptions Detected
                </h4>
                <p className='text-xs text-blue-800 dark:text-blue-200 mb-3'>
                  {reconciliationResult.summary.added > 0 && (
                    <>
                      Found {reconciliationResult.summary.added} new medication
                      {reconciliationResult.summary.added > 1 ? 's' : ''} from recent visits.{' '}
                    </>
                  )}
                  {reconciliationResult.summary.modified > 0 && (
                    <>
                      Found {reconciliationResult.summary.modified} updated medication
                      {reconciliationResult.summary.modified > 1 ? 's' : ''}.{' '}
                    </>
                  )}
                  Would you like to automatically update your current medications list?
                </p>
                <div className='flex gap-2'>
                  <button
                    onClick={applyReconciliationChanges}
                    className='flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors'
                  >
                    <CheckCircle className='h-3 w-3' />
                    Update Medications
                  </button>
                  <button
                    onClick={() => setShowReconciliationAlert(false)}
                    className='px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 transition-colors'
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='space-y-1'>
          {meds.length > 0 ? (
            meds.map(med => (
              <div
                key={med.id}
                className='flex items-center justify-between gap-4 py-1 px-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark/50'
              >
                <div className='flex-1 flex flex-wrap items-center gap-x-2 text-sm'>
                  <span className='font-bold text-base text-text-light dark:text-text-dark whitespace-nowrap'>
                    {med.name}
                  </span>

                  {med.strength && (
                    <>
                      <span className='text-gray-300 dark:text-gray-600'>|</span>
                      <span className='font-medium text-subtle-light dark:text-subtle-dark whitespace-nowrap'>
                        {med.strength}
                      </span>
                    </>
                  )}

                  {med.dosage && (
                    <>
                      <span className='text-gray-300 dark:text-gray-600'>|</span>
                      <span className='text-subtle-light dark:text-subtle-dark whitespace-nowrap'>
                        {med.dosage}, {compactFrequency(med.frequency)}
                      </span>
                    </>
                  )}

                  {med.timings && med.timings.length > 0 && (
                    <>
                      <span className='text-gray-300 dark:text-gray-600'>|</span>
                      <span className='font-mono text-xs text-subtle-light dark:text-subtle-dark whitespace-nowrap'>
                        {med.timings.sort().join('-')}
                      </span>
                    </>
                  )}

                  {med.notes && (
                    <>
                      <span className='text-gray-300 dark:text-gray-600'>|</span>
                      <span className='italic text-subtle-light dark:text-subtle-dark whitespace-nowrap'>
                        {med.notes}
                      </span>
                    </>
                  )}
                </div>
                <div className='flex items-center gap-1 flex-shrink-0'>
                  <button
                    onClick={() => setModalState({ isOpen: true, medication: med })}
                    aria-label={`Edit medication: ${med.name}`}
                    className='p-1.5 text-subtle-light dark:text-subtle-dark hover:text-primary-DEFAULT rounded-full hover:bg-gray-200 dark:hover:bg-gray-700'
                    title='Edit Medication'
                  >
                    <span className='material-symbols-outlined text-base'>edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(med.id)}
                    aria-label={`Delete medication: ${med.name}`}
                    className='p-1.5 text-subtle-light dark:text-subtle-dark hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700'
                    title='Delete Medication'
                  >
                    <span className='material-symbols-outlined text-base'>delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className='text-center text-sm text-subtle-light dark:text-subtle-dark py-6 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg'>
              No current medications listed.
            </div>
          )}
        </div>

        <MedicationModal
          isOpen={modalState.isOpen}
          medication={modalState.medication}
          onSave={handleSave}
          onClose={() => setModalState({ isOpen: false, medication: null })}
        />
        <BulkMedicationModal
          isOpen={bulkModalState.isOpen}
          editingMedications={bulkModalState.editingMedications}
          doctors={doctors}
          onSave={(medications) => {
            onAddBulkMedications(patient.id, medications);
            setBulkModalState({ isOpen: false, editingMedications: [] });
          }}
          onClose={() => setBulkModalState({ isOpen: false, editingMedications: [] })}
        />
      </div>
    );
  },
);

CurrentMedications.displayName = 'CurrentMedications';

export default CurrentMedications;
