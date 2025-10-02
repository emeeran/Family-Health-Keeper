import React, { memo, useCallback, useMemo } from 'react';
import type { Patient, MedicalRecord, Doctor, Document, Reminder, Medication } from '../../types';

interface OptimizedPatientDetailsProps {
  patient: Patient;
  selectedRecord: MedicalRecord;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onFileUpload: (files: FileList | null) => void;
  onDeleteDocument: (documentId: string) => void;
  onRenameDocument: (documentId: string, newName: string) => void;
  isEditing: boolean;
  onAddReminder: (patientId: string, reminderData: Omit<Reminder, 'id' | 'completed'>) => void;
  onToggleReminder: (patientId: string, reminderId: string) => void;
  onDeleteReminder: (patientId: string, reminderId: string) => void;
  onAddMedication: (patientId: string, medicationData: Omit<Medication, 'id'>) => void;
  onUpdateMedication: (patientId: string, medication: Medication) => void;
  onDeleteMedication: (patientId: string, medicationId: string) => void;
  doctors: Doctor[];
}

const OptimizedPatientDetails: React.FC<OptimizedPatientDetailsProps> = ({
  patient,
  selectedRecord,
  onFormChange,
  onFileUpload,
  onDeleteDocument,
  onRenameDocument,
  isEditing,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
  doctors
}) => {
  // Memoize expensive calculations
  const patientName = useMemo(() => patient.name, [patient.name]);
  const recordDate = useMemo(() => new Date(selectedRecord.date).toLocaleDateString(), [selectedRecord.date]);
  const doctorName = useMemo(() => {
    const doctor = doctors.find(d => d.id === selectedRecord.doctorId);
    return doctor?.name || 'Unknown Doctor';
  }, [doctors, selectedRecord.doctorId]);

  // Memoize callback functions
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onFormChange(e);
  }, [onFormChange]);

  const handleFileUpload = useCallback((files: FileList | null) => {
    onFileUpload(files);
  }, [onFileUpload]);

  const handleDeleteDocument = useCallback((documentId: string) => {
    onDeleteDocument(documentId);
  }, [onDeleteDocument]);

  const handleRenameDocument = useCallback((documentId: string, newName: string) => {
    onRenameDocument(documentId, newName);
  }, [onRenameDocument]);

  const handleAddReminder = useCallback((reminderData: Omit<Reminder, 'id' | 'completed'>) => {
    onAddReminder(patient.id, reminderData);
  }, [onAddReminder, patient.id]);

  const handleToggleReminder = useCallback((reminderId: string) => {
    onToggleReminder(patient.id, reminderId);
  }, [onToggleReminder, patient.id]);

  const handleDeleteReminder = useCallback((reminderId: string) => {
    onDeleteReminder(patient.id, reminderId);
  }, [onDeleteReminder, patient.id]);

  const handleAddMedication = useCallback((medicationData: Omit<Medication, 'id'>) => {
    onAddMedication(patient.id, medicationData);
  }, [onAddMedication, patient.id]);

  const handleUpdateMedication = useCallback((medication: Medication) => {
    onUpdateMedication(patient.id, medication);
  }, [onUpdateMedication, patient.id]);

  const handleDeleteMedication = useCallback((medicationId: string) => {
    onDeleteMedication(patient.id, medicationId);
  }, [onDeleteMedication, patient.id]);

  // Render the component content
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Patient Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {patientName}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Medical Record from {recordDate} • Dr. {doctorName}
        </p>
      </div>

      {/* Record Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <form className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Record Type
            </label>
            <select
              id="type"
              value={selectedRecord.type}
              onChange={handleFormChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="checkup">Checkup</option>
              <option value="emergency">Emergency</option>
              <option value="consultation">Consultation</option>
              <option value="lab_result">Lab Result</option>
              <option value="imaging">Imaging</option>
              <option value="prescription">Prescription</option>
              <option value="vaccination">Vaccination</option>
              <option value="surgery">Surgery</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={selectedRecord.date}
              onChange={handleFormChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Diagnosis
            </label>
            <textarea
              id="diagnosis"
              value={selectedRecord.diagnosis}
              onChange={handleFormChange}
              disabled={!isEditing}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="treatment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Treatment
            </label>
            <textarea
              id="treatment"
              value={selectedRecord.treatment}
              onChange={handleFormChange}
              disabled={!isEditing}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={selectedRecord.notes}
              onChange={handleFormChange}
              disabled={!isEditing}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </form>
      </div>

      {/* Documents Section */}
      {selectedRecord.documents && selectedRecord.documents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Documents</h2>
          <div className="space-y-3">
            {selectedRecord.documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex items-center space-x-3">
                  <span className="material-symbols-outlined text-blue-500">
                    {document.type === 'image' ? 'image' : 'description'}
                  </span>
                  <span className="text-gray-900 dark:text-white">{document.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {isEditing && (
                    <>
                      <button
                        onClick={() => handleRenameDocument(document.id, prompt('New name:', document.name) || document.name)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </>
                  )}
                  <a
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <span className="material-symbols-outlined">open_in_new</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Upload */}
      {isEditing && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upload Documents</h2>
          <input
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Accepted formats: Images (JPG, PNG, GIF) and PDF files
          </p>
        </div>
      )}
    </div>
  );
};

// Custom comparison function for memo
const areEqual = (prevProps: OptimizedPatientDetailsProps, nextProps: OptimizedPatientDetailsProps) => {
  return (
    prevProps.patient.id === nextProps.patient.id &&
    prevProps.selectedRecord.id === nextProps.selectedRecord.id &&
    prevProps.isEditing === nextProps.isEditing &&
    JSON.stringify(prevProps.doctors) === JSON.stringify(nextProps.doctors)
  );
};

export default memo(OptimizedPatientDetails, areEqual);