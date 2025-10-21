import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import type { Patient, Medication, Doctor } from '../types';
import BulkMedicationModal from './BulkMedicationModal';

interface CurrentMedicationsProps {
  patient: Patient;
  onUpdateMedication: (patientId: string, medicationId: string, medication: Partial<Medication>) => void;
  onDeleteMedication: (patientId: string, medicationId: string) => void;
  onAddMedication: () => void;
  onAddBulkMedications: (patientId: string, medications: Omit<Medication, 'id'>[]) => void;
  doctors: Doctor[];
  isAdding?: boolean;
}

const CurrentMedications: React.FC<CurrentMedicationsProps> = ({
  patient,
  onUpdateMedication,
  onDeleteMedication,
  onAddMedication,
  onAddBulkMedications,
  doctors,
  isAdding = false,
}) => {
  const [bulkModalState, setBulkModalState] = useState<{
    isOpen: boolean;
    editingMedications: Medication[];
  }>({
    isOpen: false,
    editingMedications: [],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'time' | 'frequency'>('name');

  const meds = patient.currentMedications || [];

  // Enhanced filtering and sorting logic
  const filteredAndSortedMeds = useMemo(() => {
    let filtered = meds.filter(med =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.strength?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.dosage?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort medications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'time':
          const aTime = a.timings && a.timings.length > 0 ? a.timings[0] : '99:99';
          const bTime = b.timings && b.timings.length > 0 ? b.timings[0] : '99:99';
          return aTime.localeCompare(bTime);
        case 'frequency':
          return a.frequency.localeCompare(b.frequency);
        default:
          return 0;
      }
    });

    return filtered;
  }, [meds, searchQuery, sortBy]);

  const getTimeOfDay = (timings?: string[]): string => {
    if (!timings || timings.length === 0) return 'all-day';

    const hasMorning = timings.some(t => {
      const hour = parseInt(t.split(':')[0]);
      return hour >= 5 && hour < 12;
    });
    const hasAfternoon = timings.some(t => {
      const hour = parseInt(t.split(':')[0]);
      return hour >= 12 && hour < 17;
    });
    const hasEvening = timings.some(t => {
      const hour = parseInt(t.split(':')[0]);
      return hour >= 17 && hour < 21;
    });
    const hasNight = timings.some(t => {
      const hour = parseInt(t.split(':')[0]);
      return hour >= 21 || hour < 5;
    });

    if (hasMorning && !hasAfternoon && !hasEvening && !hasNight) return 'morning';
    if (!hasMorning && hasAfternoon && !hasEvening && !hasNight) return 'afternoon';
    if (!hasMorning && !hasAfternoon && hasEvening && !hasNight) return 'evening';
    if (!hasMorning && !hasAfternoon && !hasEvening && hasNight) return 'night';
    return 'all-day';
  };

  const getRefillStatus = (medication: Medication) => {
    if (!medication.refillDate) {
      return { color: 'gray', text: 'No refill date' };
    }

    const today = new Date();
    const refillDate = new Date(medication.refillDate);
    const daysUntilRefill = Math.ceil((refillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilRefill > 30) {
      return { color: 'green', text: 'Well stocked' };
    } else if (daysUntilRefill > 14) {
      return { color: 'yellow', text: `${daysUntilRefill} days left` };
    } else if (daysUntilRefill > 0) {
      return { color: 'orange', text: `${daysUntilRefill} days left` };
    } else {
      return { color: 'red', text: 'Refill needed' };
    }
  };

  const compactFrequency = (frequency: string): string => {
    const freq = frequency.toLowerCase();
    if (freq.includes('once daily')) return '1x/day';
    if (freq.includes('twice daily') || freq.includes('two times')) return '2x/day';
    if (freq.includes('three times daily')) return '3x/day';
    if (freq.includes('as needed')) return 'PRN';
    if (freq.includes('weekly')) return '1x/wk';
    return freq;
  };

  
  const handleDelete = (medicationId: string) => {
    onDeleteMedication(patient.id, medicationId);
  };

  return (
    <div className='py-6 border-b border-border-light dark:border-border-dark'>
      {/* Enhanced Header with Stats and Search */}
      <div className='mb-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center'>
              <span className='material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl'>medication</span>
            </div>
            <div>
              <h4 className='text-xl font-bold text-text-light dark:text-text-dark'>
                Current Medications
              </h4>
              <p className='text-sm text-subtle-light dark:text-subtle-dark'>
                {meds.length} active medication{meds.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search medications..."
                className="pl-10 pr-4 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 text-text-light dark:text-text-dark placeholder-subtle-light dark:placeholder-subtle-dark focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-subtle-light dark:text-subtle-dark text-lg">
                search
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'time' | 'frequency')}
                className="px-3 py-1.5 text-sm font-medium bg-transparent border-none focus:outline-none text-text-light dark:text-text-dark"
              >
                <option value="name">Sort by Name</option>
                <option value="time">Sort by Time</option>
                <option value="frequency">Sort by Frequency</option>
              </select>
            </div>

            {/* Bulk Add Button */}
            <div className="relative group">
              <button
                onClick={() => setBulkModalState({ isOpen: true, editingMedications: [] })}
                disabled={bulkModalState.isOpen}
                className='flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md'
                title="Add Multiple Medications"
                aria-label="Add Multiple Medications"
              >
                <Plus className='w-4 h-4' />
                <span className='hidden sm:inline'>Bulk Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-subtle-light dark:text-subtle-dark">
              {filteredAndSortedMeds.length} of {meds.length} medications
            </div>
          </div>
        )}
      </div>

      {/* Table View */}
      {filteredAndSortedMeds.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-gray-800 border border-border-light dark:border-border-dark rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-border-light dark:border-border-dark">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">
                  Medication
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">
                  Strength
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">
                  Dosage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">
                  Times
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {filteredAndSortedMeds.map(med => {
                const refillStatus = getRefillStatus(med);
                const timeOfDay = getTimeOfDay(med.timings);

                return (
                  <tr key={med.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {/* Medication Name */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          refillStatus.color === 'green' ? 'bg-green-500' :
                          refillStatus.color === 'yellow' ? 'bg-yellow-500' :
                          refillStatus.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="text-sm font-medium text-text-light dark:text-text-dark">
                            {med.name}
                          </div>
                          {med.notes && (
                            <div className="text-xs text-subtle-light dark:text-subtle-dark italic mt-1">
                              "{med.notes}"
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Strength */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {med.strength || '-'}
                      </span>
                    </td>

                    {/* Dosage */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-text-light dark:text-text-dark">
                        {med.dosage}
                      </span>
                    </td>

                    {/* Frequency */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-light dark:text-text-dark">
                          {compactFrequency(med.frequency)}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          timeOfDay === 'morning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                          timeOfDay === 'afternoon' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                          timeOfDay === 'evening' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                          timeOfDay === 'night' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
                        }`}>
                          {timeOfDay}
                        </span>
                      </div>
                    </td>

                    {/* Times */}
                    <td className="px-4 py-4">
                      {med.timings && med.timings.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {med.timings.sort().map((time, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-600 text-text-light dark:text-text-dark rounded font-mono">
                              {time}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-subtle-light dark:text-subtle-dark">-</span>
                      )}
                    </td>

                    {/* Doctor */}
                    <td className="px-4 py-4">
                      <span className="text-sm text-text-light dark:text-text-dark">
                        {med.doctor || '-'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          refillStatus.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                          refillStatus.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                          refillStatus.color === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {refillStatus.text}
                        </span>
                        {med.startDate && (
                          <span className="text-xs text-subtle-light dark:text-subtle-dark">
                            Since {new Date(med.startDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
          if (confirm(`Are you sure you want to delete ${med.name}?`)) {
            handleDelete(med.id);
          }
        }}
                          className="p-1.5 text-subtle-light dark:text-subtle-dark hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete medication"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredAndSortedMeds.length === 0 && (
        <div className="text-center py-12">
          {searchQuery ? (
            <div>
              <span className="material-symbols-outlined text-4xl text-subtle-light dark:text-subtle-dark mb-4">search_off</span>
              <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">
                No medications found
              </h3>
              <p className="text-subtle-light dark:text-subtle-dark mb-4">
                Try adjusting your search terms
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div>
              <span className="material-symbols-outlined text-4xl text-subtle-light dark:text-subtle-dark mb-4">medication</span>
              <h3 className="text-lg font-medium text-text-light dark:text-text-dark mb-2">
                No current medications
              </h3>
              <p className="text-subtle-light dark:text-subtle-dark mb-4">
                Start by adding your first medication using the Bulk Add button
              </p>
              <button
                onClick={() => setBulkModalState({ isOpen: true, editingMedications: [] })}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add First Medication
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Medication Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={onAddMedication}
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Medication
        </button>
      </div>

            <BulkMedicationModal
        isOpen={bulkModalState.isOpen}
        editingMedications={bulkModalState.editingMedications}
        doctors={doctors}
        onSave={(medications) => {
          // Add new medications
          onAddBulkMedications(patient.id, medications);
          setBulkModalState({ isOpen: false, editingMedications: [] });
        }}
        onClose={() => setBulkModalState({ isOpen: false, editingMedications: [] })}
      />
    </div>
  );
};

CurrentMedications.displayName = 'CurrentMedications';

export default CurrentMedications;