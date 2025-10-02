import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PatientDetails from './components/PatientDetails';
import Dashboard from './components/Dashboard';
import SecurityDashboard from './components/SecurityDashboard';
import RecordDetailsPanel from './src/components/RecordDetailsPanel';
import type { Patient, MedicalRecord, Document, Reminder, Medication, Doctor } from './types';
import { generatePatientPdf } from './services/pdfService';
import PatientFormModal from './components/PatientFormModal';
import PatientEditModal from './components/PatientEditModal';
import RecordFormModal from './components/RecordFormModal';
import DoctorEditModal from './components/DoctorEditModal';
import { useSecureHealthStore } from './stores/useSecureHealthStore';
import {
  useDebounce,
  usePerformanceMonitor,
  useAriaLive,
  useMemoizedCallback
} from './hooks/usePerformanceOptimizations';

const MAX_FILE_SIZE_MB = 10;

const App: React.FC = () => {
  const { measureOperation } = usePerformanceMonitor('App');
  const { announcement, announce } = useAriaLive();

  // Debounced console logging to reduce noise in production
  const debouncedLog = useDebounce((message: string) => {
    if (import.meta.env.DEV) {
      console.log(message);
    }
  }, 1000);

  debouncedLog('App component rendering...');

  // Move the store destructuring outside the try block so variables are accessible
  const {
    patients,
    doctors,
    selectedPatientId,
    selectedRecordId,
    isEditingRecord,
    theme,
    setSelectedPatient,
    setSelectedRecord,
    addPatient,
    updatePatient,
    deletePatient,
    addRecord,
    updateRecord,
    deleteRecord,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    setTheme: setStoreTheme,
    setIsEditing,
    loadPatients,
    loadDoctors,
    addDocument: addDocumentToRecord,
    deleteDocument,
    renameDocument,
    addReminder,
    toggleReminder,
    deleteReminder,
    addMedication,
    updateMedication,
    deleteMedication,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    createReminderFromAppointment,
  } = useSecureHealthStore();

  // Now it's safe to use the destructured variables
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

  // Ref to track previous values and prevent infinite loops
  const previousValuesRef = useRef({
    selectedPatientId,
    selectedRecordId,
    formStateId: null
  });

  // UI State for modals and forms (handled locally since they're UI concerns)
  const [formState, setFormStateData] = useState<MedicalRecord | null>(null);
  const [originalRecord, setOriginalRecord] = useState<MedicalRecord | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isPatientFormModalOpen, setIsPatientFormModalOpen] = useState(false);
  const [isRecordFormModalOpen, setIsRecordFormModalOpen] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<MedicalRecord | null>(null);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);

  // Modal handlers
  const openPatientForm = (patient: Patient | null) => {
    setPatientToEdit(patient);
    setIsPatientFormModalOpen(true);
  };

  const closePatientForm = () => {
    setIsPatientFormModalOpen(false);
    setPatientToEdit(null);
  };

  const openRecordForm = (record: MedicalRecord | null) => {
    setRecordToEdit(record);
    setIsRecordFormModalOpen(true);
  };

  const closeRecordForm = () => {
    setIsRecordFormModalOpen(false);
    setRecordToEdit(null);
  };

  const openDoctorModal = (doctor: Doctor | null) => {
    setDoctorToEdit(doctor);
    setIsDoctorModalOpen(true);
  };

  const closeDoctorModal = () => {
    setIsDoctorModalOpen(false);
    setDoctorToEdit(null);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const setFormStateRecord = (record: MedicalRecord | null) => {
    setFormStateData(record);
  };

  const toggleEditMode = () => {
    if (formState) {
      setIsEditing(!isEditingRecord);
    }
  };

  const updateFormState = (field: string, value: string) => {
    if (formState) {
      setFormStateData({ ...formState, [field]: value });
      setIsFormDirty(true);
    }
  };

  // Move all hooks after the store destructuring
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    loadPatients();
    loadDoctors();
  }, [loadPatients, loadDoctors]);

  const toggleTheme = () => {
    setStoreTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Prevent infinite loop by checking if values actually changed
    const prev = previousValuesRef.current;
    const valuesChanged =
      prev.selectedPatientId !== selectedPatientId ||
      prev.selectedRecordId !== selectedRecordId;

    if (!valuesChanged) {
      return;
    }

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

    // Only update formState if the record actually changed
    if (record?.id !== prev.formStateId) {
      setFormStateRecord(record);
      setOriginalRecord(record);
      setIsEditing(false); // Default to read-only when selection changes
    }

    // Update the ref with current values
    previousValuesRef.current = {
      selectedPatientId,
      selectedRecordId,
      formStateId: record?.id
    };
  }, [selectedPatientId, selectedRecordId, patients, setSelectedRecord]);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatient(patientId);
  };

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecord(recordId);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    updateFormState(id, value);
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

  const handleSavePatient = useMemoizedCallback((patientData: Partial<Patient>) => {
    measureOperation('savePatient', () => {
      if (patientToEdit) {
        // Update existing patient
        updatePatient(patientToEdit.id, patientData);
        announce(`Patient ${patientData.name} updated successfully`);
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
          appointments: [],
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
        announce(`New patient ${patientData.name} added successfully`);
      }
      closePatientForm();
    });
  }, [patientToEdit, updatePatient, addPatient, closePatientForm, measureOperation, announce]);

  const handleNewRecord = () => {
    if (!selectedPatientId) {
      alert("Please select a person first.");
      return;
    }
    openRecordForm(null);
  };

  const handleSaveRecord = () => {
    if (!formState || !selectedPatientId) {
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
    // TODO: Implement export functionality with secure storage
    console.log('Export patient:', patientId);
  };

  const handleExportPatientPdf = async (patientId: string) => {
    // TODO: Implement PDF export functionality with secure storage
    console.log('Export patient PDF:', patientId);
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

  const handleAddReminder = (patientId: string, reminderData: Omit<Reminder, 'id'>) => {
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

  // Appointment handlers
  const handleAddAppointment = (patientId: string, appointmentData: Omit<import('./types').Appointment, 'id' | 'createdAt'>) => {
    addAppointment(patientId, appointmentData);
  };

  const handleUpdateAppointment = (patientId: string, appointmentId: string, updates: Partial<import('./types').Appointment>) => {
    updateAppointment(patientId, appointmentId, updates);
  };

  const handleDeleteAppointment = (patientId: string, appointmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) return;
    deleteAppointment(patientId, appointmentId);
  };

  const handleCreateReminderFromAppointment = (patientId: string, appointmentId: string) => {
    createReminderFromAppointment(patientId, appointmentId);
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
    <>
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      <div
        className="h-screen flex text-text-light dark:text-text-dark overflow-hidden"
        role="application"
        aria-label="Family Health Keeper Application"
      >
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={toggleMobileSidebar}
          />
        )}
        
        {/* Mobile Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
            onEditRecord={handleEditRecordModal}
            onSaveRecord={handleSaveRecord}
            onDeleteRecord={handleDeleteRecord}
            isEditing={isEditingRecord}
            isFormDirty={isFormDirty}
            isRecordSelected={!!selectedRecordId && !selectedRecordId.startsWith('new-')}
            doctors={doctors}
            onOpenDoctorModal={handleOpenDoctorModal}
            onDeleteDoctor={handleDeleteDoctor}
            onDeleteRecordDirect={handleDeleteRecordDirect}
          />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
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
            onEditRecord={handleEditRecordModal}
            onSaveRecord={handleSaveRecord}
            onDeleteRecord={handleDeleteRecord}
            isEditing={isEditingRecord}
            isFormDirty={isFormDirty}
            isRecordSelected={!!selectedRecordId && !selectedRecordId.startsWith('new-')}
            doctors={doctors}
            onOpenDoctorModal={handleOpenDoctorModal}
            onDeleteDoctor={handleDeleteDoctor}
            onDeleteRecordDirect={handleDeleteRecordDirect}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
          <Header
            selectedPatient={selectedPatient}
            theme={theme}
            onToggleTheme={toggleTheme}
            onMobileMenuToggle={toggleMobileSidebar}
            showMobileMenuButton={true}
          />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto overflow-x-hidden p-6 animate-fade-in"
            role="main"
            tabIndex={-1}
          >
            {selectedPatient ? (
              <div className="animate-scale-in">
                <Dashboard 
                  patient={selectedPatient} 
                  onViewDetails={() => {
                    // Dashboard can trigger actions if needed
                  }}
                />
                <PatientDetails
                  patient={selectedPatient}
                  selectedRecord={formState || selectedPatient.records[0]}
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
                  onAddAppointment={handleAddAppointment}
                  onUpdateAppointment={handleUpdateAppointment}
                  onDeleteAppointment={handleDeleteAppointment}
                  onCreateReminderFromAppointment={handleCreateReminderFromAppointment}
                  doctors={doctors}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-subtle-light dark:text-subtle-dark animate-fade-in">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/20 dark:to-secondary-900/20 flex items-center justify-center animate-bounce-soft">
                    <span className="material-symbols-outlined text-4xl text-primary-600 dark:text-primary-400">waving_hand</span>
                  </div>
                  <h3 className="text-xl font-semibold text-text-light dark:text-text-dark mb-2">Welcome to Family Health Keeper</h3>
                  <p className="text-sm text-subtle-light dark:text-subtle-dark max-w-md mx-auto">
                    Select a person from the sidebar to view their records, or add a new person to begin.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Record Details Slide-out Panel */}
      {selectedPatient && formState && (
        <RecordDetailsPanel
          patient={selectedPatient}
          record={formState}
          isOpen={!!formState}
          onClose={() => {
            setSelectedRecord(null);
            setFormStateRecord(null);
          }}
          onFormChange={handleFormChange}
          onFileUpload={handleFileUpload}
          onDeleteDocument={handleDeleteDocument}
          onRenameDocument={handleRenameDocument}
          isEditing={isEditingRecord}
          doctors={doctors}
        />
      )}

      {(() => {
        console.log('isPatientFormModalOpen:', isPatientFormModalOpen);
        return isPatientFormModalOpen && (
          <PatientFormModal
            isOpen={isPatientFormModalOpen}
            onClose={closePatientForm}
            onSave={handleSavePatient}
            editData={patientToEdit}
          />
        );
      })()}
      
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
      
      <SecurityDashboard />
    </>
  );
};

export default App;
