import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useEncryptedStore } from '../../stores/encryptedStore';
import { StoreMigration } from '../../utils/storeMigration';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import PatientDetails from '../patients/components/PatientDetails';
import { BackupManagerComponent } from '../../components/BackupManager';
import SecuritySettings from '../../components/SecuritySettings';
import OfflineSettings from '../../components/OfflineSettings';
import OfflineStatusIndicator from '../../components/OfflineStatusIndicator';
import PerformanceDashboard from '../../components/PerformanceDashboard';
import PerformanceSettings from '../../components/PerformanceSettings';
import { LazyPatientFormModal, LazyRecordFormModal, LazyDoctorEditModal } from '../../utils/lazyComponents';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EyeCareModule } from '../../components/EyeCareModule';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import AdvancedSearch from '../search/components/AdvancedSearch';
import { ResponsiveContainer, ResponsiveFlex, ResponsiveSpacing, ResponsiveText } from '../../components/ui/ResponsiveContainer';
import { ResponsiveNavigation, ResponsiveBreadcrumbs } from '../../components/ui/ResponsiveNavigation';
import { useResponsive } from '../../utils/responsive';
import { useReactPerformance } from '../../hooks/useReactPerformance';

const App: React.FC = () => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const {
    patients,
    doctors,
    selectedPatientId,
    selectedRecordId,
    isEditing,
    theme,
    initializeData,
    setTheme,
    setSelectedPatient,
    setSelectedRecord,
    setFormState,
    setOriginalRecord,
    setIsEditing,
    markRecordAsRead,
    updatePatient,
    deletePatient,
    addPatient,
    addRecord,
    updateRecord,
    deleteRecord,
    uploadDocument,
    deleteDocument,
    renameDocument,
    addReminder,
    toggleReminder,
    deleteReminder,
    addMedication,
    updateMedication,
    deleteMedication,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    updateDoctorData,
    exportPatient,
    exportPatientPdf,
    openPatientForm,
    closePatientForm,
    openRecordForm,
    closeRecordForm,
    openDoctorModal,
    closeDoctorModal,
    isPatientFormModalOpen,
    isRecordFormModalOpen,
    isDoctorModalOpen,
    patientToEdit,
    recordToEdit,
    doctorToEdit,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showBackupManager, setShowBackupManager] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showOfflineSettings, setShowOfflineSettings] = useState(false);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [showPerformanceSettings, setShowPerformanceSettings] = useState(false);

  // Performance monitoring
  const { measureRender } = useReactPerformance({
    componentName: 'App',
    enabled: true,
    trackRerenders: true,
  });

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Perform store migration if needed
        StoreMigration.performMigration();

        // Initialize the app data
        await initializeData();
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [initializeData]);

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatient(patientId);
  };

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecord(recordId);
    markRecordAsRead(selectedPatientId, recordId);
  };

  const handleNewPatient = () => {
    openPatientForm(null);
  };

  const handleEditPatient = () => {
    const patient = patients.find(p => p.id === selectedPatientId);
    if (patient) {
      openPatientForm(patient);
    }
  };

  const handleNewRecord = () => {
    if (!selectedPatientId) return;
    openRecordForm(null);
  };

  const handleSaveRecord = () => {
    if (!selectedPatientId || !selectedRecordId) return;

    const patient = patients.find(p => p.id === selectedPatientId);
    const record = patient?.records.find(r => r.id === selectedRecordId);

    if (record) {
      updateRecord(selectedPatientId, record);
      setIsEditing(false);
    }
  };

  const showConfirmationDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'danger'
  ) => {
    setConfirmationDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    });
  };

  const hideConfirmationDialog = () => {
    setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteRecord = () => {
    if (!selectedPatientId || !selectedRecordId) return;

    const patient = patients.find(p => p.id === selectedPatientId);
    const record = patient?.records.find(r => r.id === selectedRecordId);

    if (patient && record) {
      showConfirmationDialog(
        'Delete Medical Record',
        `Are you sure you want to delete the medical record from ${record.date}?`,
        () => deleteRecord(selectedPatientId, selectedRecordId)
      );
    }
  };

  const handleDeletePatient = () => {
    if (!selectedPatientId) return;

    const patient = patients.find(p => p.id === selectedPatientId);
    if (patient) {
      showConfirmationDialog(
        'Delete Family Member',
        `Are you sure you want to delete ${patient.name} and all their medical records? This action cannot be undone.`,
        () => deletePatient(selectedPatientId)
      );
    }
  };

  const handleDeleteDoctor = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      showConfirmationDialog(
        'Delete Doctor',
        `Are you sure you want to delete Dr. ${doctor.name}? This action cannot be undone.`,
        () => deleteDoctor(doctorId)
      );
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || !selectedPatientId || !selectedRecordId) return;
    uploadDocument(selectedPatientId, selectedRecordId, Array.from(files));
  };

  const handleRestoreComplete = (restoredPatients: Patient[], restoredDoctors: Doctor[]) => {
    // Update the store with restored data
    // In a real implementation, this would call store methods to replace the data
    // For now, we'll just show a message and close the backup manager
    setShowBackupManager(false);

    // Force a re-initialization or update the store
    // This is a simplified approach - in production, you'd want proper store updates
    window.location.reload(); // Simple approach for demo
  };

  const handleDeleteDocument = (documentId: string) => {
    if (!selectedPatientId || !selectedRecordId) return;
    deleteDocument(selectedPatientId, selectedRecordId, documentId);
  };

  const handleRenameDocument = (documentId: string, newName: string) => {
    if (!selectedPatientId || !selectedRecordId) return;
    renameDocument(selectedPatientId, selectedRecordId, documentId, newName);
  };

  const handleEdit = () => {
    if (!selectedPatientId || !selectedRecordId) return;

    const patient = patients.find(p => p.id === selectedPatientId);
    const record = patient?.records.find(r => r.id === selectedRecordId);

    if (record) {
      openRecordForm(record);
    }
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedRecord = selectedPatient?.records.find(r => r.id === selectedRecordId);

  console.log('🔍 App Debug:', {
    selectedPatientId,
    selectedRecordId,
    selectedPatient: selectedPatient?.name || 'none',
    selectedRecord: selectedRecord?.date || 'none',
    totalPatients: patients.length
  });

  // Navigation items for responsive navigation
  const navItems = [
    {
      id: 'patients',
      label: 'Family Members',
      icon: 'people',
      onClick: () => {},
      badge: patients.length,
    },
    {
      id: 'add-patient',
      label: 'Add Member',
      icon: 'person_add',
      onClick: handleNewPatient,
    },
    {
      id: 'search',
      label: 'Search',
      icon: 'search',
      onClick: () => {},
    },
    {
      id: 'backup',
      label: 'Backup',
      icon: 'backup',
      onClick: () => setShowBackupManager(!showBackupManager),
    },
    {
      id: 'security',
      label: 'Security',
      icon: 'security',
      onClick: () => setShowSecuritySettings(!showSecuritySettings),
    },
    {
      id: 'offline',
      label: 'Offline',
      icon: 'offline_bolt',
      onClick: () => setShowOfflineSettings(!showOfflineSettings),
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: 'speed',
      onClick: () => setShowPerformanceDashboard(!showPerformanceDashboard),
    },
    {
      id: 'performance-settings',
      label: 'Perf Settings',
      icon: 'settings',
      onClick: () => setShowPerformanceSettings(!showPerformanceSettings),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      onClick: () => {},
    },
  ];

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home' },
    ...(showBackupManager ? [{ label: 'Backup & Restore' }] : []),
    ...(showSecuritySettings ? [{ label: 'Security Settings' }] : []),
    ...(showOfflineSettings ? [{ label: 'Offline Settings' }] : []),
    ...(showPerformanceDashboard ? [{ label: 'Performance Dashboard' }] : []),
    ...(showPerformanceSettings ? [{ label: 'Performance Settings' }] : []),
    ...(!showBackupManager && !showSecuritySettings && !showOfflineSettings && !showPerformanceDashboard && !showPerformanceSettings && selectedPatient ? [{ label: selectedPatient.name }] : []),
    ...(!showBackupManager && !showSecuritySettings && !showOfflineSettings && !showPerformanceDashboard && !showPerformanceSettings && selectedRecord ? [{ label: `Record: ${selectedRecord.date}` }] : []),
  ];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <LoadingSpinner size="lg" message="Initializing Family Health Keeper..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col text-text-light dark:text-text-dark bg-background-light dark:bg-background-dark">
        {/* Top Navigation for Mobile */}
        {isMobile && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <ResponsiveFlex direction="row" justify="between" align="center">
              <Header
                selectedPatient={selectedPatient}
                theme={theme}
                onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              />
            </ResponsiveFlex>
          </div>
        )}

        {/* Main Content Area */}
        <ResponsiveFlex direction="row" className="flex-1 overflow-hidden">
          {/* Sidebar - Hidden on mobile, shown on tablet/desktop */}
          {(!isMobile) && (
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
              <Sidebar
                patients={patients}
                selectedPatient={selectedPatient}
                selectedRecordId={selectedRecordId}
                onNewPatient={handleNewPatient}
                onNewRecord={handleNewRecord}
                onSelectPatient={handleSelectPatient}
                onSelectRecord={handleSelectRecord}
                onEditPatient={handleEditPatient}
                onDeletePatient={handleDeletePatient}
                onExportPatient={exportPatient}
                onExportPatientPdf={exportPatientPdf}
                onEditRecord={(record) => openRecordForm(record)}
                onSaveRecord={handleSaveRecord}
                onDeleteRecord={(record) => {
                  if (!selectedPatientId) return;
                  showConfirmationDialog(
                    'Delete Medical Record',
                    `Are you sure you want to delete the medical record from ${record.date}?`,
                    () => deleteRecord(selectedPatientId, record.id)
                  );
                }}
                isEditing={isEditing}
                isFormDirty={false}
                isRecordSelected={!!selectedRecordId && !selectedRecordId?.startsWith('new-')}
                doctors={doctors}
                onOpenDoctorModal={(doctor) => updateDoctorData(doctor || {})}
                onDeleteDoctor={handleDeleteDoctor}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Area */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <ResponsiveContainer maxWidth="7xl">
                <ResponsiveFlex direction="col" gap="md">
                  {/* Breadcrumbs */}
                  <ResponsiveBreadcrumbs items={breadcrumbItems} />

                  {/* Header and Search */}
                  <ResponsiveFlex
                    direction={isMobile ? "col" : "row"}
                    justify="between"
                    align={isMobile ? "start" : "center"}
                    gap="md"
                  >
                    {!isMobile && (
                      <Header
                        selectedPatient={selectedPatient}
                        theme={theme}
                        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      />
                    )}
                    <AdvancedSearch
                      patients={patients}
                      onPatientSelect={handleSelectPatient}
                      onRecordSelect={(patientId, recordId) => {
                        handleSelectPatient(patientId);
                        handleSelectRecord(recordId);
                      }}
                    />
                  </ResponsiveFlex>
                </ResponsiveFlex>
              </ResponsiveContainer>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
              <ResponsiveContainer maxWidth="7xl" className="p-6">
                {showBackupManager ? (
                  <BackupManagerComponent
                    patients={patients}
                    doctors={doctors}
                    onRestoreComplete={handleRestoreComplete}
                  />
                ) : showSecuritySettings ? (
                  <SecuritySettings onClose={() => setShowSecuritySettings(false)} />
                ) : showOfflineSettings ? (
                  <OfflineSettings onClose={() => setShowOfflineSettings(false)} />
                ) : showPerformanceDashboard ? (
                  <PerformanceDashboard onClose={() => setShowPerformanceDashboard(false)} />
                ) : showPerformanceSettings ? (
                  <PerformanceSettings onClose={() => setShowPerformanceSettings(false)} />
                ) : selectedPatient && selectedRecord ? (
                  (() => {
                    console.log('🚀 About to render PatientDetails for:', selectedPatient.name, selectedPatient.id);
                    return <PatientDetails
                    patient={selectedPatient}
                    selectedRecord={selectedRecord}
                    onFormChange={(e) => {
                      const { id, value } = e.target;
                      setFormState(id, value);
                    }}
                    onFileUpload={handleFileUpload}
                    onDeleteDocument={handleDeleteDocument}
                    onRenameDocument={handleRenameDocument}
                    isEditing={isEditing && !isRecordFormModalOpen}
                    onAddReminder={addReminder}
                    onToggleReminder={toggleReminder}
                    onDeleteReminder={deleteReminder}
                    onAddMedication={addMedication}
                    onUpdateMedication={updateMedication}
                    onDeleteMedication={deleteMedication}
                    doctors={doctors}
                  />)();
                ) : (
                  <div className="h-full flex items-center justify-center text-subtle-light dark:text-subtle-dark">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-6xl">waving_hand</span>
                      <p className="mt-4 text-lg font-medium">Welcome to Family Health Keeper</p>
                      <p className="text-sm mt-2">Select a person from the sidebar to view their records, or add a new person to begin.</p>
                      {isMobile && (
                        <button
                          onClick={handleNewPatient}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Family Member
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </ResponsiveContainer>
            </main>
          </div>
        </ResponsiveFlex>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <ResponsiveNavigation
            items={navItems}
            variant="mobile-bottom"
            className="pb-safe" /* For iOS safe area */
          />
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <div className="fixed bottom-20 right-4 z-30">
            <button
              onClick={() => {
                // Toggle mobile drawer for patients
                const drawer = document.getElementById('mobile-patients-drawer');
                if (drawer) {
                  drawer.classList.toggle('hidden');
                }
              }}
              className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">people</span>
            </button>
          </div>
        )}

        <LazyPatientFormModal
          isOpen={isPatientFormModalOpen}
          onClose={closePatientForm}
          onSave={(patientData) => {
            if (patientToEdit) {
              const patient = {
                id: patientToEdit.id,
                ...patientData,
                contactInfo: patientData.contactInfo || {},
                emergencyContact: patientData.emergencyContact || undefined,
                records: patientToEdit.records || [],
                reminders: patientToEdit.reminders || [],
                currentMedications: patientToEdit.currentMedications || []
              };
              updatePatient(patient.id, patient);
            } else {
              const patientDataWithoutId = {
                ...patientData,
                contactInfo: patientData.contactInfo || {},
                emergencyContact: patientData.emergencyContact || undefined,
                records: [],
                reminders: [],
                currentMedications: []
              };
              const result = addPatient(patientDataWithoutId);
              if (!result.success) {
                alert(result.error || 'Failed to add patient');
                return;
              }
            }
          }}
          editData={patientToEdit}
          doctors={doctors}
        />
        <LazyRecordFormModal
          isOpen={isRecordFormModalOpen}
          onClose={closeRecordForm}
          onSave={(recordData, files) => {
            if (!selectedPatientId) return;

            if (recordToEdit) {
              const record = {
                id: recordToEdit.id,
                ...recordData,
                documents: recordToEdit.documents || [],
                isNew: true
              };
              updateRecord(selectedPatientId, record.id, record);

              // Handle file uploads if any
              if (files && files.length > 0) {
                uploadDocument(selectedPatientId, record.id, files);
              }
            } else {
              const recordDataWithoutId = {
                ...recordData,
                documents: [],
                isNew: true
              };
              const result = addRecord(selectedPatientId, recordDataWithoutId);
              if (!result.success) {
                alert(result.error || 'Failed to add medical record');
                return;
              }

              // Handle file uploads if any
              if (files && files.length > 0 && result.record) {
                uploadDocument(selectedPatientId, result.record.id, files);
              }
            }
          }}
          editData={recordToEdit}
          doctors={doctors}
        />
        <LazyDoctorEditModal
          isOpen={isDoctorModalOpen}
          onClose={closeDoctorModal}
          onSave={(doctorData) => {
            if (!doctorData) return;

            if (doctorToEdit) {
              // For editing, pass the doctor ID and the updated data
              updateDoctor(doctorToEdit.id, doctorData);
            } else {
              const result = addDoctor(doctorData);
              if (!result.success) {
                alert(result.error || 'Failed to add doctor');
                return;
              }
            }
          }}
          editData={doctorToEdit}
          doctors={doctors}
        />

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmationDialog.isOpen}
          title={confirmationDialog.title}
          message={confirmationDialog.message}
          onConfirm={() => {
            confirmationDialog.onConfirm();
            hideConfirmationDialog();
          }}
          onCancel={hideConfirmationDialog}
          type={confirmationDialog.type}
        />

        {/* Offline Status Indicator */}
        <OfflineStatusIndicator onClick={() => setShowOfflineSettings(true)} />
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(App);