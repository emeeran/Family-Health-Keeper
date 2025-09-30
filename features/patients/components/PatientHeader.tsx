import React from 'react';
import { useHealthStore } from '../../../stores/useHealthStore';
import { useStableCallback } from '../../../hooks/usePerformance';
import type { Patient } from '../../../types';

interface PatientHeaderProps {
  patient: Patient;
}

const PatientHeader: React.FC<PatientHeaderProps> = ({ patient }) => {
  const {
    deletePatient,
    openPatientForm,
    exportPatient,
    exportPatientPdf
  } = useHealthStore();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAge = (dateString?: string) => {
    if (!dateString) return '';
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return `${age} years old`;
  };

  const handleEdit = useStableCallback(() => {
    openPatientForm(patient);
  });

  const handleDelete = useStableCallback(() => {
    if (window.confirm('Are you sure you want to delete this person and all their records? This action cannot be undone.')) {
      deletePatient(patient.id);
    }
  });

  const handleExportJson = useStableCallback(() => {
    exportPatient(patient.id);
  });

  const handleExportPdf = useStableCallback(() => {
    exportPatientPdf(patient.id);
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
      {/* Patient Info */}
      <div className="flex items-center gap-4">
        <img
          alt={patient.name}
          className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-700"
          src={patient.avatarUrl}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {patient.name}
          </h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
            {patient.dateOfBirth && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">cake</span>
                <span>{getAge(patient.dateOfBirth)} • {formatDate(patient.dateOfBirth)}</span>
              </div>
            )}
            {patient.gender && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">
                  {patient.gender === 'male' ? 'male' : patient.gender === 'female' ? 'female' : 'person'}
                </span>
                <span className="capitalize">{patient.gender}</span>
              </div>
            )}
            {patient.contactInfo?.phone && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">phone</span>
                <span>{patient.contactInfo.phone}</span>
              </div>
            )}
            {patient.contactInfo?.email && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">email</span>
                <span>{patient.contactInfo.email}</span>
              </div>
            )}
          </div>

          {/* Hospital IDs */}
          {patient.hospitalIds && patient.hospitalIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {patient.hospitalIds.map((hid) => (
                <div
                  key={hid.id}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  <span className="font-semibold">{hid.hospitalName}:</span> {hid.patientId}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleEdit}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          title="Edit patient information"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          <span>Edit</span>
        </button>

        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors">
            <span className="material-symbols-outlined text-sm">file_download</span>
            <span>Export</span>
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </button>

          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <button
              onClick={handleExportJson}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
            >
              <span className="material-symbols-outlined text-sm mr-2">data_object</span>
              Export as JSON
            </button>
            <button
              onClick={handleExportPdf}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
            >
              <span className="material-symbols-outlined text-sm mr-2">picture_as_pdf</span>
              Export as PDF
            </button>
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
          title="Delete patient and all records"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(PatientHeader);