import React from 'react';
import type { Patient } from '../../../types';

interface PatientCardProps {
  patient: Patient;
  isSelected: boolean;
  onSelect: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, isSelected, onSelect }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

    return age;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGenderIcon = (gender?: string) => {
    switch (gender) {
      case 'male':
        return 'male';
      case 'female':
        return 'female';
      default:
        return 'person';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {patient.avatarUrl ? (
            <img
              src={patient.avatarUrl}
              alt={patient.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg border-2 border-gray-200 dark:border-gray-700">
              {getInitials(patient.name)}
            </div>
          )}
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100'}`}>
              {patient.name}
            </h3>
            {patient.gender && (
              <span className="material-symbols-outlined text-sm text-gray-500 dark:text-gray-400">
                {getGenderIcon(patient.gender)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            {patient.dateOfBirth && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">cake</span>
                <span>{getAge(patient.dateOfBirth)}y</span>
              </div>
            )}

            {patient.hospitalIds && patient.hospitalIds.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">local_hospital</span>
                <span className="text-xs">
                  {patient.hospitalIds.length} {patient.hospitalIds.length === 1 ? 'ID' : 'IDs'}
                </span>
              </div>
            )}
          </div>

          {/* Medical indicators */}
          <div className="flex items-center gap-3 mt-2 text-xs">
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                <span className="material-symbols-outlined text-xs">warning</span>
                <span>{patient.allergies.length} Allergies</span>
              </div>
            )}

            {patient.conditions && patient.conditions.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                <span className="material-symbols-outlined text-xs">medical_information</span>
                <span>{patient.conditions.length} Conditions</span>
              </div>
            )}

            {patient.currentMedications && patient.currentMedications.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                <span className="material-symbols-outlined text-xs">medication</span>
                <span>{patient.currentMedications.length} Meds</span>
              </div>
            )}
          </div>
        </div>

        {/* Records count */}
        <div className="flex-shrink-0 text-center">
          <div className="text-2xl font-bold text-gray-400 dark:text-gray-600">
            {patient.records.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Records
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <span className="material-symbols-outlined text-blue-500">check_circle</span>
          </div>
        )}
      </div>

      {/* Unread indicator */}
      {patient.records.some(record => record.isNew) && (
        <div className="absolute top-2 left-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
};

export default React.memo(PatientCard);