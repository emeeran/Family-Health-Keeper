import React, { useState, useCallback } from 'react';
import { useStableCallback } from '../../../hooks/usePerformance';
import type { Patient, Medication } from '../../../types';

interface CurrentMedicationsProps {
  patient: Patient;
  onAddMedication: (patientId: string, medication: Omit<Medication, 'id'>) => void;
  onUpdateMedication: (patientId: string, medication: Medication) => void;
  onDeleteMedication: (patientId: string, medicationId: string) => void;
  onRequestReminder: (medication: Omit<Medication, 'id'>) => void;
}

const CurrentMedications: React.FC<CurrentMedicationsProps> = ({
  patient,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
  onRequestReminder,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Medication, 'id'>>({
    name: '',
    strength: '',
    dosage: '',
    frequency: '',
    timeSlots: ['', '', '', ''],
    prescribedBy: '',
    rxBy: '',
    startDate: '',
    endDate: '',
    notes: '',
  });

  const handleAddMedication = useStableCallback(() => {
    if (formData.name && formData.dosage) {
      onAddMedication(patient.id, formData);
      setFormData({
        name: '',
        strength: '',
        dosage: '',
        frequency: '',
        timeSlots: ['', '', '', ''],
        prescribedBy: '',
        rxBy: '',
        startDate: '',
        endDate: '',
        notes: '',
      });
      setIsAdding(false);
    }
  });

  const handleEditMedication = useStableCallback((med: Medication) => {
    setEditingMedId(med.id);
    setFormData({
      name: med.name,
      strength: med.strength,
      dosage: med.dosage,
      frequency: med.frequency,
      timeSlots: med.timeSlots || ['', '', '', ''],
      prescribedBy: med.prescribedBy,
      rxBy: med.rxBy,
      startDate: med.startDate,
      endDate: med.endDate,
      notes: med.notes,
    });
  });

  const handleUpdateMedication = useStableCallback(() => {
    if (editingMedId && formData.name && formData.dosage) {
      onUpdateMedication(patient.id, { ...formData, id: editingMedId });
      setEditingMedId(null);
      setFormData({
        name: '',
        strength: '',
        dosage: '',
        frequency: '',
        timeSlots: ['', '', '', ''],
        prescribedBy: '',
        rxBy: '',
        startDate: '',
        endDate: '',
        notes: '',
      });
    }
  });

  const handleDeleteMedication = useStableCallback((medId: string) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      onDeleteMedication(patient.id, medId);
    }
  });

  const handleCancel = useCallback(() => {
    setIsAdding(false);
    setEditingMedId(null);
    setFormData({
      name: '',
      strength: '',
      dosage: '',
      frequency: '',
      timeSlots: ['', '', '', ''],
      prescribedBy: '',
      rxBy: '',
      startDate: '',
      endDate: '',
      notes: '',
    });
  }, []);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const handleTimeSlotChange = useCallback((index: number, value: string) => {
    setFormData(prev => {
      const newTimeSlots = [...prev.timeSlots];
      newTimeSlots[index] = value;
      return { ...prev, timeSlots: newTimeSlots };
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-text-light dark:text-text-dark">Current Medications</h4>
        {!isAdding && !editingMedId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Medication
          </button>
        )}
      </div>

      {(isAdding || editingMedId) && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Medication Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g., Ibuprofen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Strength *
              </label>
              <input
                type="text"
                value={formData.strength}
                onChange={(e) => setFormData(prev => ({ ...prev, strength: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g., 500mg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dosage *
              </label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g., 1 tablet"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequency (Optional)
              </label>
              <input
                type="text"
                value={formData.frequency}
                onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g., Twice daily"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rx by / Prescribed by
              </label>
              <input
                type="text"
                value={formData.rxBy || formData.prescribedBy || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, rxBy: e.target.value, prescribedBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="e.g., Dr. Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Slots
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {formData.timeSlots.map((time, index) => (
                <div key={index}>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Time {index + 1}
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeSlotChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              rows={2}
              placeholder="Special instructions or notes"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={editingMedId ? handleUpdateMedication : handleAddMedication}
              disabled={!formData.name || !formData.dosage || !formData.strength}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingMedId ? 'Update' : 'Add'} Medication
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!patient.currentMedications || patient.currentMedications.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-600 mb-2">
            medication
          </span>
          <p className="text-gray-600 dark:text-gray-400">No current medications recorded.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patient.currentMedications.map((med) => (
            <div
              key={med.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header with Medicine + Strength */}
                  <div className="flex items-center gap-2 mb-3">
                    <h5 className="font-semibold text-gray-900 dark:text-gray-100">{med.name}</h5>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                      {med.strength}
                    </span>
                  </div>

                  {/* Dosage and Time Slots Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Dosage</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{med.dosage}</p>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Time Schedule</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {med.timeSlots && med.timeSlots.filter(t => t).length > 0 ? (
                          med.timeSlots.filter(t => t).map((time, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-md">
                              {time}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">No times set</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prescribing Doctor and Notes Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {(med.rxBy || med.prescribedBy) && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rx by</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{med.rxBy || med.prescribedBy}</p>
                      </div>
                    )}

                    {med.notes && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notes</span>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{med.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                    {med.startDate && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        <span>Start: {formatDate(med.startDate)}</span>
                      </div>
                    )}
                    {med.endDate && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">event_end</span>
                        <span>End: {formatDate(med.endDate)}</span>
                      </div>
                    )}
                    {med.frequency && (
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        <span>{med.frequency}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => onRequestReminder(med)}
                    className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Set refill reminder"
                  >
                    <span className="material-symbols-outlined text-sm">notifications</span>
                  </button>
                  <button
                    onClick={() => handleEditMedication(med)}
                    className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                    title="Edit medication"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteMedication(med.id)}
                    className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Delete medication"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(CurrentMedications);