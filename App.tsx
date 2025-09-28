import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PatientDetails from './components/PatientDetails';
import NewRecordModal from './components/NewRecordModal';
import NewPersonModal from './components/NewPersonModal';
import { PATIENTS, DOCTORS } from './constants';
import type { Patient, MedicalRecord, Document, Reminder, Medication, Doctor } from './types';
import { generatePatientPdf } from './services/pdfService';
import { databaseService } from './services/databaseService';
import PatientEditModal from './components/PatientEditModal';
import DoctorEditModal from './components/DoctorEditModal';

const createBlankRecord = (doctors: Doctor[]): Omit<MedicalRecord, 'id' | 'documents'> => ({
    date: new Date().toISOString().split('T')[0],
    doctorId: doctors[0]?.id || '',
    complaint: '',
    investigations: '',
    diagnosis: '',
    prescription: '',
    notes: '',
});

const MAX_FILE_SIZE_MB = 10;

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [isNewRecordModalOpen, setIsNewRecordModalOpen] = useState(false);
  const [isNewPersonModalOpen, setIsNewPersonModalOpen] = useState(false);
  const [isEditRecordModalOpen, setIsEditRecordModalOpen] = useState(false);
  const [isEditPersonModalOpen, setIsEditPersonModalOpen] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
  });
  
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;
  
  const [formState, setFormState] = useState<MedicalRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Initialize database and load data
  useEffect(() => {
    const initializeDatabase = async () => {
      console.log('Starting database initialization...');
      try {
        await databaseService.init();
        console.log('Database initialized successfully');

        await databaseService.initializeWithSampleData();
        console.log('Sample data initialized');

        // Load data from database
        const [loadedPatients, loadedDoctors] = await Promise.all([
          databaseService.getAllPatients(),
          databaseService.getAllDoctors()
        ]);

        console.log('Loaded data:', {
          patients: loadedPatients.length,
          doctors: loadedDoctors.length
        });

        // Load records, reminders, and medications for each patient
        const patientsWithRecords = await Promise.all(
          loadedPatients.map(async (patient) => {
            const [records, reminders, medications] = await Promise.all([
              databaseService.getAllMedicalRecords(patient.id),
              databaseService.getAllReminders(patient.id),
              databaseService.getAllMedications(patient.id)
            ]);

            return {
              ...patient,
              records,
              reminders,
              currentMedications: medications
            };
          })
        );

        console.log('Final patients with records:', patientsWithRecords.length);
        setPatients(patientsWithRecords);
        setDoctors(loadedDoctors);
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Fallback to in-memory data if database fails
        console.log('Using fallback in-memory data');
        setPatients(PATIENTS);
        setDoctors(DOCTORS);
        setLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  // Set initial selected patient when data is loaded
  useEffect(() => {
    console.log('Patient selection effect:', {
      patientsLength: patients.length,
      selectedPatientId,
      loading,
      firstPatient: patients[0]
    });

    if (patients.length > 0 && !selectedPatientId && !loading) {
      console.log('Setting initial patient:', patients[0].id);
      setSelectedPatientId(patients[0].id);
      if (patients[0].records.length > 0) {
        setSelectedRecordId(patients[0].records[0].id);
      }
    }
  }, [patients, selectedPatientId, loading]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Don't reset formState if we're creating a new record (ID starts with "new-")
    if (selectedRecordId?.startsWith('new-')) {
      console.log('Skipping formState update for new record:', selectedRecordId);
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    const record = patient?.records.find(r => r.id === selectedRecordId) || null;
    console.log('Updating formState from effect:', { selectedPatientId, selectedRecordId, record });
    setFormState(record);
    setIsEditing(false); // Default to read-only when selection changes
  }, [selectedPatientId, selectedRecordId, patients]);

  const handleSelectPatient = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatientId(patientId);
    setSelectedRecordId(patient?.records[0]?.id || null);
  };

  const handleSelectRecord = (recordId: string) => {
    setSelectedRecordId(recordId);
    
    // Mark record as "read"
    setPatients(prevPatients => prevPatients.map(p => {
        if (p.id === selectedPatientId) {
            return {
                ...p,
                records: p.records.map(r => 
                    r.id === recordId ? { ...r, isNew: false } : r
                ),
            };
        }
        return p;
    }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    if (formState) {
        setFormState(prevState => prevState ? { ...prevState, [id]: value } : null);
    }
  };

  const handleNewPatient = () => {
    setIsNewPersonModalOpen(true);
  };

  const handleSaveNewPerson = async (patientData: Omit<Patient, 'id' | 'records' | 'reminders' | 'currentMedications'>) => {
    const newPatient: Patient = {
      ...patientData,
      id: `p-${Date.now()}`,
      records: [],
      reminders: [],
      currentMedications: []
    };

    try {
      await databaseService.savePatient(newPatient);
      setPatients(prev => [...prev, newPatient]);
      handleSelectPatient(newPatient.id);
      setIsNewPersonModalOpen(false);
    } catch (error) {
      console.error('Failed to save patient:', error);
      alert('Failed to save patient. Please try again.');
    }
  };

  const handleCancelNewPerson = () => {
    setIsNewPersonModalOpen(false);
  };
  
  const handleEditPatient = () => {
    if (!selectedPatient) return;
    setIsEditPersonModalOpen(true);
  };

  const handleEditRecord = () => {
    if (!formState || !selectedPatientId) return;
    setIsEditRecordModalOpen(true);
  };

  const handleUpdateRecordFromModal = async (recordData: any) => {
    if (!formState || !selectedPatientId) return;

    try {
      const updatedRecord: MedicalRecord = {
        ...formState,
        ...recordData,
        id: formState.id,
        documents: formState.documents || []
      };

      // Update the record in the database
      await databaseService.saveMedicalRecord(updatedRecord);

      // Update local state
      setPatients(prevPatients => prevPatients.map(p => {
        if (p.id === selectedPatientId) {
          const existingRecordIndex = p.records.findIndex(r => r.id === formState.id);
          if (existingRecordIndex >= 0) {
            const updatedRecords = [...p.records];
            updatedRecords[existingRecordIndex] = updatedRecord;
            return { ...p, records: updatedRecords };
          } else {
            return { ...p, records: [...p.records, updatedRecord] };
          }
        }
        return p;
      }));

      setFormState(updatedRecord);
      setIsEditRecordModalOpen(false);
    } catch (error) {
      console.error('Failed to update record:', error);
      alert('Failed to update record. Please try again.');
    }
  };

  const handleUpdatePatientFromModal = async (patientData: any) => {
    if (!selectedPatient) return;

    try {
      const updatedPatient: Patient = {
        ...selectedPatient,
        ...patientData,
        id: selectedPatient.id,
        records: selectedPatient.records,
        reminders: selectedPatient.reminders,
        currentMedications: selectedPatient.currentMedications
      };

      await databaseService.savePatient(updatedPatient);
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p));
      setIsEditPersonModalOpen(false);
    } catch (error) {
      console.error('Failed to update patient:', error);
      alert('Failed to update patient. Please try again.');
    }
  };

  const handleUpdatePatient = async (updatedPatient: Patient) => {
      try {
        await databaseService.savePatient(updatedPatient);
        setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
        setIsEditingPatient(false);
      } catch (error) {
        console.error('Failed to update patient:', error);
        alert('Failed to update patient. Please try again.');
      }
  };

  const handleDeletePatient = async () => {
      if (!selectedPatientId) return;
      if (window.confirm('Are you sure you want to delete this person and all their records? This action cannot be undone.')) {
          try {
              // Delete patient from database
              await databaseService.deletePatient(selectedPatientId);

              // Delete all related records, reminders, and medications
              const [records, reminders, medications] = await Promise.all([
                  databaseService.getAllMedicalRecords(selectedPatientId),
                  databaseService.getAllReminders(selectedPatientId),
                  databaseService.getAllMedications(selectedPatientId)
              ]);

              await Promise.all([
                  ...records.map(record => databaseService.deleteMedicalRecord(record.id)),
                  ...reminders.map(reminder => databaseService.deleteReminder(reminder.id)),
                  ...medications.map(medication => databaseService.deleteMedication(medication.id))
              ]);

              let newPatientToSelectId: string | null = null;
              const patientIndex = patients.findIndex(p => p.id === selectedPatientId);
              const remainingPatients = patients.filter(p => p.id !== selectedPatientId);

              if (remainingPatients.length > 0) {
                  newPatientToSelectId = patientIndex > 0 ? remainingPatients[patientIndex - 1].id : remainingPatients[0].id;
              }

              setPatients(remainingPatients);
              if (newPatientToSelectId) {
                  handleSelectPatient(newPatientToSelectId);
              } else {
                  setSelectedPatientId(null);
                  setSelectedRecordId(null);
                  setFormState(null);
              }
          } catch (error) {
              console.error('Failed to delete patient:', error);
              alert('Failed to delete patient. Please try again.');
          }
      }
  };

  const handleExportPatient = (patientId: string) => {
    const patientToExport = patients.find(p => p.id === patientId);
    if (!patientToExport) {
      alert("Could not find the person to export.");
      return;
    }

    const dataStr = JSON.stringify(patientToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${patientToExport.name.replace(/\s+/g, '_')}_health_record.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPatientPdf = async (patientId: string) => {
    const patientToExport = patients.find(p => p.id === patientId);
    if (!patientToExport) {
      alert("Could not find the person to export.");
      return;
    }
    try {
      alert("Generating PDF... This may take a moment.");
      await generatePatientPdf(patientToExport, doctors);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("An error occurred while generating the PDF. Please check the console for details.");
    }
  };

  const handleNewRecord = () => {
    console.log('handleNewRecord called:', {
      selectedPatientId,
      selectedPatient: patients.find(p => p.id === selectedPatientId),
      doctorsLength: doctors.length,
      doctors: doctors,
      patientsLength: patients.length,
      loading
    });

    if (!selectedPatientId) {
      console.log('No selected patient ID');
      alert("Please select a person first.");
      return;
    }

    if (doctors.length === 0) {
      console.log('No doctors available');
      alert("No doctors available. Please add a doctor first.");
      return;
    }

    setIsNewRecordModalOpen(true);
  };

  const handleSaveNewRecord = (recordData: Omit<MedicalRecord, 'id' | 'documents'>) => {
    try {
      const newRecord: MedicalRecord = {
        ...recordData,
        id: `new-${Date.now()}`,
        documents: [],
        isNew: true
      };

      setFormState(newRecord);
      setSelectedRecordId(newRecord.id);
      setIsEditing(true);
      setIsNewRecordModalOpen(false);

      console.log('New record created and saved:', newRecord);
    } catch (error) {
      console.error('Error saving new record:', error);
      alert('Failed to create new record. Please try again.');
    }
  };

  const handleCancelNewRecord = () => {
    setIsNewRecordModalOpen(false);
  };

  const handleSaveRecord = async () => {
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
      const existingRecordIndex = patients.find(p => p.id === selectedPatientId)?.records.findIndex(r => r.id === formState.id) ?? -1;
      let recordToSave: MedicalRecord;
      let newRecordId: string;

      if (existingRecordIndex > -1) {
        // Update existing record
        recordToSave = formState;
        newRecordId = formState.id;
      } else {
        // Add new record
        recordToSave = { ...formState, id: `rec-${Date.now()}` };
        newRecordId = recordToSave.id;
        setSelectedRecordId(newRecordId); // Update selected ID to the new permanent one
      }

      // Save to database
      await databaseService.saveMedicalRecord(recordToSave);

      // Update local state
      setPatients(prevPatients => {
        return prevPatients.map(p => {
          if (p.id === selectedPatientId) {
            const existingRecordIndex = p.records.findIndex(r => r.id === formState.id);
            let updatedRecords;

            if (existingRecordIndex > -1) {
              // Update existing record
              updatedRecords = [...p.records];
              updatedRecords[existingRecordIndex] = recordToSave;
            } else {
              // Add new record
              updatedRecords = [recordToSave, ...p.records];
            }
            return { ...p, records: updatedRecords };
          }
          return p;
        });
      });

      setIsEditing(false); // Exit edit mode after saving
      alert('Record saved!');
    } catch (error) {
      console.error('Failed to save record:', error);
      alert('Failed to save record. Please try again.');
    }
  };

  const handleDeleteRecord = async () => {
    if (!selectedPatientId || !selectedRecordId || selectedRecordId.startsWith('new-')) {
      alert("No record selected to delete.");
      return;
    }

    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        // Delete from database
        await databaseService.deleteMedicalRecord(selectedRecordId);

        let newRecordToSelectId: string | null = null;

        setPatients(prevPatients => prevPatients.map(p => {
          if (p.id === selectedPatientId) {
            const recordIndex = p.records.findIndex(r => r.id === selectedRecordId);
            const updatedRecords = p.records.filter(r => r.id !== selectedRecordId);

            if (updatedRecords.length > 0) {
              newRecordToSelectId = recordIndex > 0 ? updatedRecords[recordIndex - 1].id : updatedRecords[0].id;
            }

            return { ...p, records: updatedRecords };
          }
          return p;
        }));

        setSelectedRecordId(newRecordToSelectId);
        if (!newRecordToSelectId) {
          setFormState(null);
        }
      } catch (error) {
        console.error('Failed to delete record:', error);
        alert('Failed to delete record. Please try again.');
      }
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || !formState) return;

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

            setFormState(prevState => {
                if (!prevState) return null;
                // Add the new document to the existing documents array
                return { ...prevState, documents: [...prevState.documents, newDoc] };
            });
        };
        reader.readAsDataURL(file);
    });
  };

  const handleDeleteDocument = (documentId: string) => {
    if (!formState) return;
    
    setFormState(prevState => {
        if (!prevState) return null;
        return {
            ...prevState,
            documents: prevState.documents.filter(doc => doc.id !== documentId),
        };
    });
  };
  
  const handleRenameDocument = (documentId: string, newName: string) => {
    if (!formState) return;
    setFormState(prevState => {
        if (!prevState) return null;
        const updatedDocuments = prevState.documents.map(doc =>
            doc.id === documentId ? { ...doc, name: newName } : doc
        );
        return { ...prevState, documents: updatedDocuments };
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleAddReminder = async (patientId: string, reminderData: Omit<Reminder, 'id' | 'completed'>) => {
    try {
        const newReminder: Reminder = {
            ...reminderData,
            id: `rem-${Date.now()}`,
            completed: false,
        };

        await databaseService.saveReminder(newReminder);

        setPatients(prev => prev.map(p => {
            if (p.id === patientId) {
                const updatedReminders = [...(p.reminders || []), newReminder];
                return { ...p, reminders: updatedReminders };
            }
            return p;
        }));
    } catch (error) {
        console.error('Failed to add reminder:', error);
        alert('Failed to add reminder. Please try again.');
    }
  };

  const handleToggleReminder = async (patientId: string, reminderId: string) => {
      try {
          const patient = patients.find(p => p.id === patientId);
          const reminder = patient?.reminders.find(r => r.id === reminderId);

          if (reminder) {
              const updatedReminder = { ...reminder, completed: !reminder.completed };
              await databaseService.saveReminder(updatedReminder);

              setPatients(prev => prev.map(p => {
                  if (p.id === patientId) {
                      const updatedReminders = (p.reminders || []).map(r =>
                          r.id === reminderId ? updatedReminder : r
                      );
                      return { ...p, reminders: updatedReminders };
                  }
                  return p;
              }));
          }
      } catch (error) {
          console.error('Failed to toggle reminder:', error);
          alert('Failed to update reminder. Please try again.');
      }
  };

  const handleDeleteReminder = async (patientId: string, reminderId: string) => {
       if (!window.confirm('Are you sure you want to delete this reminder?')) return;
       try {
           await databaseService.deleteReminder(reminderId);
           setPatients(prev => prev.map(p => {
              if (p.id === patientId) {
                  const updatedReminders = (p.reminders || []).filter(r => r.id !== reminderId);
                  return { ...p, reminders: updatedReminders };
              }
              return p;
          }));
       } catch (error) {
           console.error('Failed to delete reminder:', error);
           alert('Failed to delete reminder. Please try again.');
       }
  };
  
  const handleAddMedication = async (patientId: string, medicationData: Omit<Medication, 'id'>) => {
    try {
        const newMedication: Medication = {
            ...medicationData,
            id: `med-${Date.now()}`
        };

        await databaseService.saveMedication(newMedication);

        setPatients(prev => prev.map(p => {
            if (p.id === patientId) {
                const updatedMeds = [...(p.currentMedications || []), newMedication];
                return { ...p, currentMedications: updatedMeds };
            }
            return p;
        }));
    } catch (error) {
        console.error('Failed to add medication:', error);
        alert('Failed to add medication. Please try again.');
    }
  };

  const handleUpdateMedication = async (patientId: string, updatedMedication: Medication) => {
      try {
          await databaseService.saveMedication(updatedMedication);
          setPatients(prev => prev.map(p => {
              if (p.id === patientId) {
                  const updatedMeds = (p.currentMedications || []).map(med =>
                      med.id === updatedMedication.id ? updatedMedication : med
                  );
                  return { ...p, currentMedications: updatedMeds };
              }
              return p;
          }));
      } catch (error) {
          console.error('Failed to update medication:', error);
          alert('Failed to update medication. Please try again.');
      }
  };

  const handleDeleteMedication = async (patientId: string, medicationId: string) => {
      if (!window.confirm('Are you sure you want to delete this medication?')) return;
      try {
          await databaseService.deleteMedication(medicationId);
          setPatients(prev => prev.map(p => {
              if (p.id === patientId) {
                  const updatedMeds = (p.currentMedications || []).filter(med => med.id !== medicationId);
                  return { ...p, currentMedications: updatedMeds };
              }
              return p;
          }));
      } catch (error) {
          console.error('Failed to delete medication:', error);
          alert('Failed to delete medication. Please try again.');
      }
  };

  // --- Doctor Handlers ---
  const handleOpenDoctorModal = (doctor: Doctor | null) => {
      setDoctorToEdit(doctor);
      setIsDoctorModalOpen(true);
  };
  
  const handleSaveDoctor = async (doctorData: Omit<Doctor, 'id'> | Doctor) => {
      try {
          if ('id' in doctorData) {
              // Editing existing doctor
              await databaseService.saveDoctor(doctorData);
              setDoctors(prev => prev.map(d => d.id === doctorData.id ? doctorData : d));
          } else {
              // Adding new doctor
              const newDoctor: Doctor = { ...doctorData, id: `doc-${Date.now()}` };
              await databaseService.saveDoctor(newDoctor);
              setDoctors(prev => [...prev, newDoctor]);
          }
          setIsDoctorModalOpen(false);
          setDoctorToEdit(null);
      } catch (error) {
          console.error('Failed to save doctor:', error);
          alert('Failed to save doctor. Please try again.');
      }
  };

  const handleDeleteDoctor = async (doctorId: string) => {
    const isDoctorInUse = patients.some(p =>
        p.primaryDoctorId === doctorId ||
        p.records.some(r => r.doctorId === doctorId)
    );

    if (isDoctorInUse) {
        alert("Cannot delete this doctor because they are assigned to a patient or a record. Please reassign before deleting.");
        return;
    }

    if (window.confirm("Are you sure you want to delete this doctor?")) {
        try {
            await databaseService.deleteDoctor(doctorId);
            setDoctors(prev => prev.filter(d => d.id !== doctorId));
        } catch (error) {
            console.error('Failed to delete doctor:', error);
            alert('Failed to delete doctor. Please try again.');
        }
    }
  };

  const originalRecord = selectedPatient?.records.find(r => r.id === formState?.id);
  const isFormDirty = formState ? JSON.stringify(formState) !== JSON.stringify(originalRecord) : false;

  return (
    <div className="h-screen flex text-text-light dark:text-text-dark">
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
        onEditRecord={handleEditRecord}
        onSaveRecord={handleSaveRecord}
        onDeleteRecord={handleDeleteRecord}
        isEditing={isEditing}
        isFormDirty={isFormDirty}
        isRecordSelected={!!selectedRecordId && !selectedRecordId.startsWith('new-')}
        doctors={doctors}
        onOpenDoctorModal={handleOpenDoctorModal}
        onDeleteDoctor={handleDeleteDoctor}
      />
      <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
        <Header 
            selectedPatient={selectedPatient}
            theme={theme}
            onToggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-y-auto p-6">
            {loading ? (
            <div className="h-full flex items-center justify-center text-subtle-light dark:text-subtle-dark">
                <div className="text-center">
                    <span className="material-symbols-outlined text-6xl animate-spin">refresh</span>
                    <p className="mt-4 text-lg font-medium">Loading data...</p>
                    <p>Please wait while we initialize the database.</p>
                </div>
            </div>
            ) : selectedPatient && formState ? (
            <PatientDetails
                patient={selectedPatient}
                selectedRecord={formState}
                onFormChange={handleFormChange}
                onFileUpload={handleFileUpload}
                onDeleteDocument={handleDeleteDocument}
                onRenameDocument={handleRenameDocument}
                isEditing={isEditing}
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
                    <span className="material-symbols-outlined text-6xl">waving_hand</span>
                    <p className="mt-4 text-lg font-medium">Welcome to Family Health Keeper</p>
                    <p>Select a person from the sidebar to view their records, or add a new person to begin.</p>
                </div>
            </div>
            )}
        </main>
      </div>
       {isEditingPatient && selectedPatient && (
        <PatientEditModal
            isOpen={isEditingPatient}
            patient={selectedPatient}
            onSave={handleUpdatePatient}
            onClose={() => setIsEditingPatient(false)}
            doctors={doctors}
        />
      )}
      <DoctorEditModal
        isOpen={isDoctorModalOpen}
        doctor={doctorToEdit}
        onSave={handleSaveDoctor}
        onClose={() => setIsDoctorModalOpen(false)}
      />
      <NewRecordModal
        isOpen={isNewRecordModalOpen}
        onClose={handleCancelNewRecord}
        onSave={handleSaveNewRecord}
        doctors={doctors}
        patientName={selectedPatient?.name || 'Unknown Patient'}
      />
      <NewPersonModal
        isOpen={isNewPersonModalOpen}
        onClose={handleCancelNewPerson}
        onSave={handleSaveNewPerson}
        doctors={doctors}
      />
      <NewRecordModal
        isOpen={isEditRecordModalOpen}
        onClose={() => setIsEditRecordModalOpen(false)}
        onSave={handleUpdateRecordFromModal}
        doctors={doctors}
        patientName={selectedPatient?.name || 'Unknown Patient'}
        initialData={formState ? {
          date: formState.date,
          doctorId: formState.doctorId,
          complaint: formState.complaint,
          investigations: formState.investigations,
          diagnosis: formState.diagnosis,
          prescription: formState.prescription,
          notes: formState.notes
        } : undefined}
        isEditMode={true}
      />
      <NewPersonModal
        isOpen={isEditPersonModalOpen}
        onClose={() => setIsEditPersonModalOpen(false)}
        onSave={handleUpdatePatientFromModal}
        doctors={doctors}
        initialData={selectedPatient ? {
          name: selectedPatient.name,
          dateOfBirth: selectedPatient.dateOfBirth,
          gender: selectedPatient.gender,
          bloodType: selectedPatient.bloodType,
          phone: selectedPatient.phone,
          email: selectedPatient.email,
          emergencyContact: selectedPatient.emergencyContact,
          allergies: selectedPatient.allergies,
          medicalHistory: selectedPatient.medicalHistory,
          primaryDoctorId: selectedPatient.primaryDoctorId,
          hospitalIds: selectedPatient.hospitalIds
        } : undefined}
        isEditMode={true}
      />
    </div>
  );
};

export default App;