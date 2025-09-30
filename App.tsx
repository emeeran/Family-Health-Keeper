import React, { useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PatientDetails from './components/PatientDetails';
import type { Patient, MedicalRecord, Document, Reminder, Medication, Doctor } from './types';
import { generatePatientPdf } from './services/pdfService';
import PatientFormModal from './components/PatientFormModal';
import PatientEditModal from './components/PatientEditModal';
import RecordFormModal from './components/RecordFormModal';
import DoctorEditModal from './components/DoctorEditModal';
import { useHealthStore } from './stores/useHealthStore';

const MAX_FILE_SIZE_MB = 10;

const App: React.FC = () => {
  const {
    patients,
    doctors,
    selectedPatientId,
    selectedRecordId,
    isEditingRecord,
    formState,
    originalRecord,
    isFormDirty,
    isPatientFormModalOpen,
    isRecordFormModalOpen,
    isDoctorModalOpen,
    patientToEdit,
    recordToEdit,
    doctorToEdit,
    theme,
    setSelectedPatient,
    setSelectedRecord,
    setPatients,
    setDoctors,
    addPatient,
    updatePatient,
    deletePatient,
    addRecord,
    updateRecord,
    deleteRecord,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    openPatientForm,
    closePatientForm,
    openRecordForm,
    closeRecordForm,
    openDoctorModal,
    closeDoctorModal,
    setFormStateRecord,
    setOriginalRecord,
    setFormDirty,
    toggleEditMode,
    setTheme: setStoreTheme,
    setFormState,
    setIsEditing,
    initializeData,
    addDocument: addDocumentToRecord,
    deleteDocument,
    renameDocument,
    addReminder,
    toggleReminder,
    deleteReminder,
    addMedication,
    updateMedication,
    deleteMedication
  } = useHealthStore();

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    initializeData();
  }, []);


  const toggleTheme = () => {
    setStoreTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Don't reset formState if we're creating a new record (ID starts with "new-")
    if (selectedRecordId?.startsWith('new-')) {
      console.log('Skipping formState update for new record:', selectedRecordId);
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    let record = null;

    if (patient) {
      record = patient.records.find(r => r.id === selectedRecordId) || null;
      // If selected record doesn't exist but patient has records, select the first one
      if (!record && patient.records.length > 0) {
        record = patient.records[0];
        setSelectedRecord(record.id);
      }
    }

    setFormStateRecord(record);
    setOriginalRecord(record);
    setIsEditing(false); // Default to read-only when selection changes
  }, [selectedPatientId, selectedRecordId, patients, setFormStateRecord, setOriginalRecord, setIsEditing, setSelectedRecord]);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatient(patientId);
  };

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecord(recordId);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormState(id, value);
  };

  const handleNewPatient = () => {
    openPatientForm(null);
  };

  const handleEditPatient = () => {
    if (!selectedPatient) return;
    openPatientForm(selectedPatient);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    updatePatient(updatedPatient.id, updatedPatient);
  };

  const handleSavePatient = (patientData: Partial<Patient>) => {
    if (patientToEdit) {
      // Update existing patient
      updatePatient(patientToEdit.id, patientData);
    } else {
      // Create new patient
      const newPatient: Patient = {
        id: `p-${Date.now()}`,
        name: patientData.name || '',
        hospitalIds: patientData.hospitalIds || [],
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
        medicalHistory: patientData.medicalHistory || '',
        records: [],
        reminders: [],
        currentMedications: [],
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender,
        contactInfo: patientData.contactInfo,
        emergencyContact: patientData.emergencyContact,
        allergies: patientData.allergies,
        conditions: patientData.conditions,
        surgeries: patientData.surgeries,
        notableEvents: patientData.notableEvents,
        medicalImages: patientData.medicalImages,
        familyMedicalHistory: patientData.familyMedicalHistory,
      };
      addPatient(newPatient);
    }
    closePatientForm();
  };

  const handleNewRecord = () => {
    console.log('handleNewRecord called:', {
      selectedPatientId,
      selectedPatient: patients.find(p => p.id === selectedPatientId),
      doctorsLength: doctors.length,
      doctors: doctors,
      patientsLength: patients.length
    });

    if (!selectedPatientId) {
      console.log('No selected patient ID');
      alert("Please select a person first.");
      return;
    }
    openRecordForm(null);
  };

  const handleSaveRecord = () => {
    console.log('handleSaveRecord called:', {
      formState,
      selectedPatientId,
      isNewRecord: formState?.id?.startsWith('new-')
    });
    if (!formState || !selectedPatientId) {
      console.log('Cannot save - missing formState or selectedPatientId');
      return;
    }

    try {
      if (formState.id.startsWith('new-')) {
        // New record - add it
        const newRecord: MedicalRecord = {
          ...formState,
          id: `rec-${Date.now()}`,
          isNew: false
        };
        addRecord(selectedPatientId, newRecord);
      } else {
        // Existing record - update it
        updateRecord(selectedPatientId, formState.id, formState);
      }
      setIsEditing(false);
      alert('Record saved!');
    } catch (error) {
      console.error('Failed to save record:', error);
      alert('Failed to save record. Please try again.');
    }
  };

  const handleSaveRecordForm = (recordData: Omit<MedicalRecord, 'id' | 'documents'>, files?: File[]) => {
    if (!selectedPatientId) return;

    if (recordToEdit) {
      // Update existing record
      const updatedRecord: MedicalRecord = {
        ...recordToEdit,
        ...recordData,
        documents: recordToEdit.documents, // Preserve existing documents
      };
      updateRecord(selectedPatientId, recordToEdit.id, updatedRecord);
    } else {
      // Create new record
      const newRecord: MedicalRecord = {
        ...recordData,
        id: `rec-${Date.now()}`,
        documents: [],
        isNew: true,
      };
      addRecord(selectedPatientId, newRecord);
    }

    closeRecordForm();
  };

  const handleDeleteRecord = () => {
    if (!selectedPatientId || !selectedRecordId || selectedRecordId.startsWith('new-')) {
      alert("No record selected to delete.");
      return;
    }

    if (window.confirm('Are you sure you want to delete this record?')) {
      deleteRecord(selectedPatientId, selectedRecordId);
    }
  };

  const handleEditRecordModal = (record: MedicalRecord) => {
    openRecordForm(record);
  };

  const handleDeleteRecordDirect = (recordId: string) => {
    if (!selectedPatientId) {
      alert("No patient selected.");
      return;
    }

    if (window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      deleteRecord(selectedPatientId, recordId);
    }
  };

  const handleDeletePatient = () => {
      if (!selectedPatientId) return;
      if (window.confirm('Are you sure you want to delete this person and all their records? This action cannot be undone.')) {
          deletePatient(selectedPatientId);
      }
  };

  const handleExportPatient = (patientId: string) => {
    const { exportPatient } = useHealthStore.getState();
    exportPatient(patientId);
  };

  const handleExportPatientPdf = async (patientId: string) => {
    const { exportPatientPdf } = useHealthStore.getState();
    exportPatientPdf(patientId);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || !selectedPatientId || !selectedRecordId) return;

    Array.from(files).forEach(file => {
        const docType = file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : null);

        if (!docType) {
            alert(`Unsupported file type: "${file.name}". Only images and PDFs are allowed.`);
            return;
        }

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            alert(`File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const newDoc: Document = {
                id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: file.name,
                type: docType,
                url: e.target?.result as string,
            };

            // Use store action to add document to record
            addDocumentToRecord(selectedPatientId, selectedRecordId, newDoc);
        };
        reader.readAsDataURL(file);
    });
  };

  const handleDeleteDocument = (documentId: string) => {
    if (!selectedPatientId || !selectedRecordId) return;

    // Use store action to delete document from record
    deleteDocument(selectedPatientId, selectedRecordId, documentId);
  };

  const handleRenameDocument = (documentId: string, newName: string) => {
    if (!selectedPatientId || !selectedRecordId) return;

    // Use store action to rename document in record
    renameDocument(selectedPatientId, selectedRecordId, documentId, newName);
  };

  const handleEdit = () => {
    if (formState) {
      openRecordForm(formState);
    }
  };

  const handleAddReminder = (patientId: string, reminderData: Omit<Reminder, 'id' | 'completed'>) => {
    // Use store action to add reminder
    addReminder(patientId, reminderData);
  };

  const handleToggleReminder = (patientId: string, reminderId: string) => {
    // Use store action to toggle reminder
    toggleReminder(patientId, reminderId);
  };

  const handleDeleteReminder = (patientId: string, reminderId: string) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    // Use store action to delete reminder
    deleteReminder(patientId, reminderId);
  };

  const handleAddMedication = (patientId: string, medicationData: Omit<Medication, 'id'>) => {
    // Use store action to add medication
    addMedication(patientId, medicationData);
  };

  const handleUpdateMedication = (patientId: string, updatedMedication: Medication) => {
    // Use store action to update medication
    updateMedication(patientId, updatedMedication);
  };

  const handleDeleteMedication = (patientId: string, medicationId: string) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) return;
    // Use store action to delete medication
    deleteMedication(patientId, medicationId);
  };

  // --- Doctor Handlers ---
  const handleOpenDoctorModal = (doctor: Doctor | null) => {
      openDoctorModal(doctor);
  };

  const handleSaveDoctor = (doctorData: Omit<Doctor, 'id'> | Doctor) => {
      if ('id' in doctorData) {
          // Editing existing doctor
          updateDoctor(doctorData.id, doctorData);
      } else {
          // Adding new doctor
          const newDoctor: Doctor = { ...doctorData, id: `doc-${Date.now()}` };
          addDoctor(newDoctor);
      }
      closeDoctorModal();
  };

  const handleDeleteDoctor = (doctorId: string) => {
    const isDoctorInUse = patients.some(p =>
        p.primaryDoctorId === doctorId ||
        p.records.some(r => r.doctorId === doctorId)
    );

    if (isDoctorInUse) {
        alert("Cannot delete this doctor because they are assigned to a patient or a record. Please reassign before deleting.");
        return;
    }

    if (window.confirm("Are you sure you want to delete this doctor?")) {
        deleteDoctor(doctorId);
    }
  };

  return (
    <div className="h-screen flex text-text-light dark:text-text-dark overflow-hidden">
      <Sidebar
        patients={patients}
        selectedPatient={selectedPatient}
        selectedPatientId={selectedPatientId}
        selectedRecordId={selectedRecordId}
        onNewPatient={handleNewPatient}
        onNewRecord={handleNewRecord}
        onSelectPatient={handleSelectPatient}
        onSelectRecord={handleSelectRecord}
        onEditPatient={handleEditPatient}
        onDeletePatient={handleDeletePatient}
        onExportPatient={handleExportPatient}
        onExportPatientPdf={handleExportPatientPdf}
        onEditRecord={handleEdit}
        onSaveRecord={handleSaveRecord}
        onDeleteRecord={handleDeleteRecord}
        isEditing={isEditingRecord}
        isFormDirty={isFormDirty}
        isRecordSelected={!!selectedRecordId && !selectedRecordId.startsWith('new-')}
        doctors={doctors}
        onOpenDoctorModal={handleOpenDoctorModal}
        onDeleteDoctor={handleDeleteDoctor}
        onEditRecordModal={handleEditRecordModal}
        onDeleteRecordDirect={handleDeleteRecordDirect}
      />
      <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
        <Header
            selectedPatient={selectedPatient}
            theme={theme}
            onToggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
            {selectedPatient ? (
                formState ? (
                    <PatientDetails
                        patient={selectedPatient}
                        selectedRecord={formState}
                        onFormChange={handleFormChange}
                        onFileUpload={handleFileUpload}
                        onDeleteDocument={handleDeleteDocument}
                        onRenameDocument={handleRenameDocument}
                        isEditing={isEditingRecord}
                        onAddReminder={handleAddReminder}
                        onToggleReminder={handleToggleReminder}
                        onDeleteReminder={handleDeleteReminder}
                        onAddMedication={handleAddMedication}
                        onUpdateMedication={handleUpdateMedication}
                        onDeleteMedication={handleDeleteMedication}
                        doctors={doctors}
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-subtle-light dark:text-subtle-dark">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-6xl">folder_open</span>
                            <p className="mt-4 text-lg font-medium">No records available</p>
                            <p>This person has no medical records yet. Add a new record to get started.</p>
                        </div>
                    </div>
                )
            ) : (
                <div className="h-full flex items-center justify-center text-subtle-light dark:text-subtle-dark">
                    <div className="text-center">
                        <span className="material-symbols-outlined text-6xl">waving_hand</span>
                        <p className="mt-4 text-lg font-medium">Welcome to Family Health Keeper</p>
                        <p>Select a person from the sidebar to view their records, or add a new person to begin.</p>
                    </div>
                </div>
            )}
        </main>
      </div>
       {isPatientFormModalOpen && (
        <PatientFormModal
          isOpen={isPatientFormModalOpen}
          onClose={closePatientForm}
          onSave={handleSavePatient}
          editData={patientToEdit}
        />
      )}
      {isRecordFormModalOpen && (
        <RecordFormModal
          isOpen={isRecordFormModalOpen}
          onClose={closeRecordForm}
          onSave={handleSaveRecordForm}
          editData={recordToEdit}
          doctors={doctors}
        />
      )}
      <DoctorEditModal
        isOpen={isDoctorModalOpen}
        doctor={doctorToEdit}
        onSave={handleSaveDoctor}
        onClose={closeDoctorModal}
      />
    </div>
  );
};

export default App;