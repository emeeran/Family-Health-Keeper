import React, { useMemo } from 'react';
import { useHealthStore } from '../../../stores/useHealthStore';
import { useOptimizedArray } from '../../../hooks/usePerformance';
import PatientCard from './PatientCard';

interface PatientListProps {
  searchQuery: string;
  onPatientSelect: (patientId: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({ searchQuery, onPatientSelect }) => {
  const { patients, selectedPatientId } = useHealthStore();

  // Optimized patient filtering and sorting
  const filteredPatients = useOptimizedArray(
    patients,
    [searchQuery, patients],
    {
      filterFn: (patient) =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.dateOfBirth?.includes(searchQuery) ||
        patient.contactInfo?.phone?.includes(searchQuery),
      sortFn: (a, b) => a.name.localeCompare(b.name)
    }
  );

  if (filteredPatients.length === 0) {
    return (
      <div className="text-center py-8">
        <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-600 mb-4">
          person_search
        </span>
        <p className="text-gray-600 dark:text-gray-400">
          {searchQuery ? 'No patients found matching your search.' : 'No patients added yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredPatients.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          isSelected={patient.id === selectedPatientId}
          onSelect={() => onPatientSelect(patient.id)}
        />
      ))}
    </div>
  );
};

export default React.memo(PatientList);