import React, { useState } from 'react';
import { useSecureHealthStore } from '../stores/useSecureHealthStore';
import StreamlinedLayout from './StreamlinedLayout';
import SimplifiedDashboard from './SimplifiedDashboard';
import SimplifiedRecordView from './SimplifiedRecordView';
import PatientFormModal from './PatientFormModal';
import RecordFormModal from './RecordFormModal';

const StreamlinedApp: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'records' | 'overview'>('dashboard');
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [recordPatientId, setRecordPatientId] = useState<string>('');

  const {
    patients,
    doctors,
    selectedPatientId,
    theme,
    setSelectedPatient,
    addPatient,
    updatePatient,
    updateRecord,
    deleteRecord,
  } = useSecureHealthStore();

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleAddPatient = () => {
    setIsAddingPatient(true);
  };

  const handleAddRecord = (patientId: string) => {
    setRecordPatientId(patientId);
    setIsAddingRecord(true);
  };

  const handlePatientFormSubmit = async (patientData: any) => {
    await addPatient(patientData);
    setIsAddingPatient(false);
  };

  const handleRecordFormSubmit = async (recordData: any) => {
    if (recordPatientId) {
      await updateRecord(recordPatientId, recordData.id || '', recordData);
    }
    setIsAddingRecord(false);
    setRecordPatientId('');
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatient(patientId);
    setActiveView('records');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <SimplifiedDashboard
            patients={patients}
            selectedPatient={selectedPatient}
            onSelectPatient={handleSelectPatient}
            onAddPatient={handleAddPatient}
            onAddRecord={handleAddRecord}
          />
        );

      case 'records':
        if (selectedPatient) {
          return (
            <SimplifiedRecordView
              patient={selectedPatient}
              doctors={doctors}
              onUpdatePatient={updatePatient}
              onUpdateRecord={updateRecord}
              onDeleteRecord={deleteRecord}
            />
          );
        }
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-12 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Patient Selected</h2>
                <p className="text-gray-500 mb-4">Select a patient to view their medical records</p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        );

      case 'overview':
        return (
          <div className="p-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-12 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Health Overview</h2>
                <p className="text-gray-500">Analytics and insights coming soon</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <StreamlinedLayout>
        {renderContent()}

        {/* Patient Form Modal */}
        <PatientFormModal
          isOpen={isAddingPatient}
          onClose={() => setIsAddingPatient(false)}
          onSubmit={handlePatientFormSubmit}
        />

        {/* Record Form Modal */}
        <RecordFormModal
          isOpen={isAddingRecord}
          onClose={() => {
            setIsAddingRecord(false);
            setRecordPatientId('');
          }}
          onSubmit={handleRecordFormSubmit}
          doctors={doctors}
          patientId={recordPatientId}
        />
      </StreamlinedLayout>
    </div>
  );
};

export default StreamlinedApp;