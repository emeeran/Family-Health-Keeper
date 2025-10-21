import React, { useState } from 'react';
import { FileText, Plus, Calendar, User, Brain, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import type { Patient, MedicalRecord, Doctor } from '../types';
import VisitViewer from './VisitViewer';
import RecordFormModal from './RecordFormModal';

interface SimplifiedRecordViewProps {
  patient: Patient;
  doctors: Doctor[];
  onUpdatePatient: (patientId: string, updates: Partial<Patient>) => void;
  onUpdateRecord: (patientId: string, recordId: string, updates: Partial<MedicalRecord>) => Promise<void>;
  onDeleteRecord: (patientId: string, recordId: string) => void;
}

const SimplifiedRecordView: React.FC<SimplifiedRecordViewProps> = ({
  patient,
  doctors,
  onUpdatePatient,
  onUpdateRecord,
  onDeleteRecord,
}) => {
  const [selectedRecordIndex, setSelectedRecordIndex] = useState(0);
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);

  // Sort records by date (newest first)
  const sortedRecords = [...patient.records].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const selectedRecord = sortedRecords[selectedRecordIndex];
  const selectedDoctor = doctors.find(d => d.id === selectedRecord?.doctorId);

  const handlePrevRecord = () => {
    setSelectedRecordIndex(Math.max(0, selectedRecordIndex - 1));
  };

  const handleNextRecord = () => {
    setSelectedRecordIndex(Math.min(sortedRecords.length - 1, selectedRecordIndex + 1));
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setEditingRecord(record);
    setIsEditingRecord(true);
  };

  const handleDeleteRecord = (recordId: string) => {
    if (window.confirm('Are you sure you want to delete this medical record?')) {
      onDeleteRecord(patient.id, recordId);
      if (selectedRecordIndex >= sortedRecords.length - 1) {
        setSelectedRecordIndex(Math.max(0, selectedRecordIndex - 1));
      }
    }
  };

  const handleRecordFormClose = () => {
    setIsEditingRecord(false);
    setEditingRecord(null);
  };

  const handleRecordFormSubmit = async (recordData: Partial<MedicalRecord>) => {
    if (editingRecord) {
      await onUpdateRecord(patient.id, editingRecord.id, recordData);
    }
    handleRecordFormClose();
  };

  if (sortedRecords.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Medical Records</h2>
            <p className="text-gray-500 mb-6">
              {patient.name} doesn't have any medical records yet.
            </p>
            <button
              onClick={() => handleEditRecord({
                id: '',
                date: new Date().toISOString().split('T')[0],
                doctorId: doctors[0]?.id || '',
                complaint: '',
                investigations: '',
                diagnosis: '',
                prescription: '',
                notes: '',
                documents: []
              } as MedicalRecord)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Medical Record
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-500 mt-1">
                {sortedRecords.length} medical record{sortedRecords.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEditRecord({
                  id: '',
                  date: new Date().toISOString().split('T')[0],
                  doctorId: doctors[0]?.id || '',
                  complaint: '',
                  investigations: '',
                  diagnosis: '',
                  prescription: '',
                  notes: '',
                  documents: []
                } as MedicalRecord)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Record
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Record Navigation */}
      {sortedRecords.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrevRecord}
                  disabled={selectedRecordIndex === 0}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {new Date(selectedRecord.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                    {selectedDoctor && (
                      <span className="text-gray-500">
                        • Dr. {selectedDoctor.name}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Record {selectedRecordIndex + 1} of {sortedRecords.length}
                  </div>
                </div>

                <button
                  onClick={handleNextRecord}
                  disabled={selectedRecordIndex === sortedRecords.length - 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditRecord(selectedRecord)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteRecord(selectedRecord.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1 mt-4">
              {sortedRecords.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedRecordIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === selectedRecordIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Record Viewer */}
      <VisitViewer
        record={selectedRecord}
        doctor={selectedDoctor}
        documents={selectedRecord.documents || []}
        patientName={patient.name}
        patientId={patient.id}
        onEdit={() => handleEditRecord(selectedRecord)}
        onUpdateRecord={onUpdateRecord}
      />

      {/* Record Form Modal */}
      <RecordFormModal
        isOpen={isEditingRecord}
        onClose={handleRecordFormClose}
        onSubmit={handleRecordFormSubmit}
        initialData={editingRecord || undefined}
        doctors={doctors}
        patientId={patient.id}
      />
    </div>
  );
};

export default SimplifiedRecordView;