import React, { useState, useMemo, useCallback } from 'react';
import { useStableCallback } from '../../../hooks/usePerformance';
import type { Patient, MedicalRecord } from '../../../types';

interface AdvancedSearchProps {
  patients: Patient[];
  onPatientSelect: (patientId: string) => void;
  onRecordSelect: (patientId: string, recordId: string) => void;
}

interface SearchFilters {
  query: string;
  dateFrom: string;
  dateTo: string;
  doctorId: string;
  hasAllergies: boolean;
  hasConditions: boolean;
  hasMedications: boolean;
  recordType: 'all' | 'diagnosis' | 'prescription' | 'investigation';
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  patients,
  onPatientSelect,
  onRecordSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    dateFrom: '',
    dateTo: '',
    doctorId: '',
    hasAllergies: false,
    hasConditions: false,
    hasMedications: false,
    recordType: 'all',
  });

  const uniqueDoctors = useMemo(() => {
    const doctorSet = new Set<string>();
    patients.forEach(patient => {
      patient.records.forEach(record => {
        if (record.doctorId) doctorSet.add(record.doctorId);
      });
    });
    return Array.from(doctorSet);
  }, [patients]);

  const filteredResults = useMemo(() => {
    return patients
      .map(patient => {
        const matchingRecords = patient.records.filter(record => {
          // Text search
          if (filters.query) {
            const searchText = filters.query.toLowerCase();
            const recordText = [
              record.complaint,
              record.investigations,
              record.diagnosis,
              record.prescription,
              record.notes,
            ].join(' ').toLowerCase();

            const patientText = [
              patient.name,
              ...(patient.allergies || []),
              ...(patient.conditions || []),
              ...(patient.currentMedications || []).map(m => m.name),
            ].join(' ').toLowerCase();

            if (!recordText.includes(searchText) && !patientText.includes(searchText)) {
              return false;
            }
          }

          // Date range filter
          if (filters.dateFrom && record.date < filters.dateFrom) {
            return false;
          }
          if (filters.dateTo && record.date > filters.dateTo) {
            return false;
          }

          // Doctor filter
          if (filters.doctorId && record.doctorId !== filters.doctorId) {
            return false;
          }

          // Record type filter
          if (filters.recordType !== 'all') {
            switch (filters.recordType) {
              case 'diagnosis':
                if (!record.diagnosis.trim()) return false;
                break;
              case 'prescription':
                if (!record.prescription.trim()) return false;
                break;
              case 'investigation':
                if (!record.investigations.trim()) return false;
                break;
            }
          }

          return true;
        });

        return { patient, matchingRecords };
      })
      .filter(({ patient, matchingRecords }) => {
        if (matchingRecords.length === 0) return false;

        // Patient-level filters
        if (filters.hasAllergies && (!patient.allergies || patient.allergies.length === 0)) {
          return false;
        }
        if (filters.hasConditions && (!patient.conditions || patient.conditions.length === 0)) {
          return false;
        }
        if (filters.hasMedications && (!patient.currentMedications || patient.currentMedications.length === 0)) {
          return false;
        }

        return true;
      });
  }, [patients, filters]);

  const handleFilterChange = useCallback((key: keyof SearchFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useStableCallback(() => {
    setFilters({
      query: '',
      dateFrom: '',
      dateTo: '',
      doctorId: '',
      hasAllergies: false,
      hasConditions: false,
      hasMedications: false,
      recordType: 'all',
    });
  });

  const handleRecordClick = useStableCallback((patientId: string, recordId: string) => {
    onPatientSelect(patientId);
    onRecordSelect(patientId, recordId);
    setIsOpen(false);
  });

  const resultCount = useMemo(() => {
    return filteredResults.reduce((total, { matchingRecords }) => total + matchingRecords.length, 0);
  }, [filteredResults]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">search</span>
        <span>Advanced Search</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Advanced Search</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Query
              </label>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                placeholder="Search in records, diagnosis, medications..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Doctor
              </label>
              <select
                value={filters.doctorId}
                onChange={(e) => handleFilterChange('doctorId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">All Doctors</option>
                {uniqueDoctors.map(doctorId => (
                  <option key={doctorId} value={doctorId}>{doctorId}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Record Type
              </label>
              <select
                value={filters.recordType}
                onChange={(e) => handleFilterChange('recordType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="all">All Records</option>
                <option value="diagnosis">Diagnosis Only</option>
                <option value="prescription">Prescriptions Only</option>
                <option value="investigation">Investigations Only</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasAllergies}
                  onChange={(e) => handleFilterChange('hasAllergies', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Has Allergies</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasConditions}
                  onChange={(e) => handleFilterChange('hasConditions', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Has Conditions</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.hasMedications}
                  onChange={(e) => handleFilterChange('hasMedications', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Has Medications</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {resultCount} result{resultCount !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear Filters
            </button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {filteredResults.map(({ patient, matchingRecords }) => (
              <div key={patient.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{patient.name}</h3>
                  <button
                    onClick={() => onPatientSelect(patient.id)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Patient
                  </button>
                </div>

                <div className="space-y-2">
                  {matchingRecords.map(record => (
                    <div
                      key={record.id}
                      onClick={() => handleRecordClick(patient.id, record.id)}
                      className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {record.date}
                        </span>
                        {record.isNew && (
                          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      {record.diagnosis && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <strong>Diagnosis:</strong> {record.diagnosis}
                        </p>
                      )}
                      {record.complaint && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Complaint:</strong> {record.complaint}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredResults.length === 0 && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-600 mb-2">
                search_off
              </span>
              <p className="text-gray-600 dark:text-gray-400">No records found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(AdvancedSearch);