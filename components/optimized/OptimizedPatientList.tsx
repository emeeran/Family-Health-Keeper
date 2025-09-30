import React, { memo, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { Patient } from '../../types';

interface OptimizedPatientListProps {
  patients: Patient[];
  selectedPatientId: string | null;
  searchQuery: string;
  onSelectPatient: (patientId: string) => void;
  onEditPatient: (patientId: string) => void;
  onDeletePatient: (patientId: string) => void;
  onExportPatient: (patientId: string) => void;
  onExportPatientPdf: (patientId: string) => void;
}

// Individual patient item component
const PatientItem = memo<{
  index: number;
  style: React.CSSProperties;
  data: any;
}>(({ index, style, data }) => {
  const { patients, selectedPatientId, onSelectPatient, onEditPatient, onDeletePatient, onExportPatient, onExportPatientPdf } = data;
  const patient = patients[index];
  const isSelected = patient.id === selectedPatientId;

  const handleSelect = useCallback(() => {
    onSelectPatient(patient.id);
  }, [onSelectPatient, patient.id]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEditPatient(patient.id);
  }, [onEditPatient, patient.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeletePatient(patient.id);
  }, [onDeletePatient, patient.id]);

  const handleExport = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExportPatient(patient.id);
  }, [onExportPatient, patient.id]);

  const handleExportPdf = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExportPatientPdf(patient.id);
  }, [onExportPatientPdf, patient.id]);

  return (
    <div style={style}>
      <div
        className={`p-4 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
          isSelected ? 'bg-blue-50 dark:bg-gray-700 border-blue-200 dark:border-blue-600' : 'border-gray-200 dark:border-gray-600'
        }`}
        onClick={handleSelect}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={patient.avatarUrl}
              alt={patient.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{patient.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {patient.records?.length || 0} records
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 opacity-0 hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button
              onClick={handleExport}
              className="p-1 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
            >
              <span className="material-symbols-outlined text-sm">download</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
            </button>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.index === nextProps.index &&
    prevProps.style === nextProps.style &&
    prevProps.data.selectedPatientId === nextProps.data.selectedPatientId &&
    JSON.stringify(prevProps.data.patients[prevProps.index]) === JSON.stringify(nextProps.data.patients[nextProps.index])
  );
});

const OptimizedPatientList: React.FC<OptimizedPatientListProps> = ({
  patients,
  selectedPatientId,
  searchQuery,
  onSelectPatient,
  onEditPatient,
  onDeletePatient,
  onExportPatient,
  onExportPatientPdf
}) => {
  // Memoize filtered patients
  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;

    const query = searchQuery.toLowerCase();
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(query) ||
      patient.contactInfo?.email?.toLowerCase().includes(query) ||
      patient.contactInfo?.phone?.toLowerCase().includes(query) ||
      patient.allergies?.some(allergy => allergy.toLowerCase().includes(query)) ||
      patient.conditions?.some(condition => condition.toLowerCase().includes(query))
    );
  }, [patients, searchQuery]);

  // Memoize item data
  const itemData = useMemo(() => ({
    patients: filteredPatients,
    selectedPatientId,
    onSelectPatient,
    onEditPatient,
    onDeletePatient,
    onExportPatient,
    onExportPatientPdf
  }), [filteredPatients, selectedPatientId, onSelectPatient, onEditPatient, onDeletePatient, onExportPatient, onExportPatientPdf]);

  // Render function for each item
  const renderItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => (
    <PatientItem
      index={index}
      style={style}
      data={itemData}
    />
  ), [itemData]);

  // If no patients found
  if (filteredPatients.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        {searchQuery ? 'No patients found matching your search.' : 'No patients yet. Add your first patient to get started.'}
      </div>
    );
  }

  // Use virtual scrolling for large lists
  return (
    <div className="h-full">
      <List
        height={600}
        itemCount={filteredPatients.length}
        itemSize={80}
        itemData={itemData}
      >
        {renderItem}
      </List>
    </div>
  );
};

// Memoize the entire component
const areEqual = (prevProps: OptimizedPatientListProps, nextProps: OptimizedPatientListProps) => {
  return (
    prevProps.selectedPatientId === nextProps.selectedPatientId &&
    prevProps.searchQuery === nextProps.searchQuery &&
    JSON.stringify(prevProps.patients) === JSON.stringify(nextProps.patients)
  );
};

export default memo(OptimizedPatientList, areEqual);