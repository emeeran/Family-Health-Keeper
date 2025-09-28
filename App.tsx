

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PatientDetails from './components/PatientDetails';
import { PATIENTS, DOCTORS } from './constants';
import type { Patient, MedicalRecord, Document, Reminder, Medication, Doctor } from './types';
import { generatePatientPdf } from './services/pdfService';
import PatientEditModal from './components/PatientEditModal';
import DoctorEditModal from './components/DoctorEditModal';

const BLANK_RECORD: Omit<MedicalRecord, 'id' | 'documents'> = {
    date: new Date().toISOString().split('T')[0],
    doctorId: DOCTORS[0]?.id || '',
    complaint: '',
    investigations: '',
    diagnosis: '',
    prescription: '',
    notes: '',
};

const MAX_FILE_SIZE_MB = 10;

const App: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(PATIENTS[0]?.id || null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(PATIENTS[0]?.records[0]?.id || null);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
  
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;
  
  const [formState, setFormState] = useState<MedicalRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const patient = patients.find(p => p.id === selectedPatientId);
    const record = patient?.records.find(r => r.id === selectedRecordId) || null;
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
    const name = window.prompt("Enter new person's name:");
    if (name) {
      const newPatient: Patient = {
        id: `p-${Date.now()}`,
        name,
        hospitalIds: [],
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/200/200`,
        medicalHistory: 'No prior history recorded.',
        records: [],
        reminders: [],
        currentMedications: [],
      };
      setPatients(prev => [...prev, newPatient]);
      handleSelectPatient(newPatient.id);
    }
  };
  
  const handleEditPatient = () => {
    if (!selectedPatient) return;
    setIsEditingPatient(true);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
      setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
      setIsEditingPatient(false);
  };

  const handleDeletePatient = () => {
      if (!selectedPatientId) return;
      if (window.confirm('Are you sure you want to delete this person and all their records? This action cannot be undone.')) {
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
    if (!selectedPatientId) {
      alert("Please select a person first.");
      return;
    }
    const newRecord: MedicalRecord = { ...BLANK_RECORD, id: `new-${Date.now()}`, documents: [], isNew: true };
    setFormState(newRecord);
    setSelectedRecordId(newRecord.id);
    setIsEditing(true); // Start in edit mode for new records
  };

  const handleSaveRecord = () => {
    if (!formState || !selectedPatientId) return;

    setPatients(prevPatients => {
      return prevPatients.map(p => {
        if (p.id === selectedPatientId) {
          const existingRecordIndex = p.records.findIndex(r => r.id === formState.id);
          let updatedRecords;

          if (existingRecordIndex > -1) {
            // Update existing record
            updatedRecords = [...p.records];
            updatedRecords[existingRecordIndex] = formState;
          } else {
            // Add new record
            const newRecordWithId = { ...formState, id: `rec-${Date.now()}` };
            updatedRecords = [newRecordWithId, ...p.records];
            setSelectedRecordId(newRecordWithId.id); // Update selected ID to the new permanent one
          }
          return { ...p, records: updatedRecords };
        }
        return p;
      });
    });
    setIsEditing(false); // Exit edit mode after saving
    alert('Record saved!');
  };

  const handleDeleteRecord = () => {
    if (!selectedPatientId || !selectedRecordId || selectedRecordId.startsWith('new-')) {
      alert("No record selected to delete.");
      return;
    }

    if (window.confirm('Are you sure you want to delete this record?')) {
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

  const handleAddReminder = (patientId: string, reminderData: Omit<Reminder, 'id' | 'completed'>) => {
    setPatients(prev => prev.map(p => {
        if (p.id === patientId) {
            const newReminder: Reminder = {
                ...reminderData,
                id: `rem-${Date.now()}`,
                completed: false,
            };
            const updatedReminders = [...(p.reminders || []), newReminder];
            return { ...p, reminders: updatedReminders };
        }
        return p;
    }));
  };

  const handleToggleReminder = (patientId: string, reminderId: string) => {
      setPatients(prev => prev.map(p => {
          if (p.id === patientId) {
              const updatedReminders = (p.reminders || []).map(r => 
                  r.id === reminderId ? { ...r, completed: !r.completed } : r
              );
              return { ...p, reminders: updatedReminders };
          }
          return p;
      }));
  };

  const handleDeleteReminder = (patientId: string, reminderId: string) => {
       if (!window.confirm('Are you sure you want to delete this reminder?')) return;
       setPatients(prev => prev.map(p => {
          if (p.id === patientId) {
              const updatedReminders = (p.reminders || []).filter(r => r.id !== reminderId);
              return { ...p, reminders: updatedReminders };
          }
          return p;
      }));
  };
  
  const handleAddMedication = (patientId: string, medicationData: Omit<Medication, 'id'>) => {
    setPatients(prev => prev.map(p => {
        if (p.id === patientId) {
            const newMedication: Medication = {
                ...medicationData,
                id: `med-${Date.now()}`
            };
            const updatedMeds = [...(p.currentMedications || []), newMedication];
            return { ...p, currentMedications: updatedMeds };
        }
        return p;
    }));
  };

  const handleUpdateMedication = (patientId: string, updatedMedication: Medication) => {
      setPatients(prev => prev.map(p => {
          if (p.id === patientId) {
              const updatedMeds = (p.currentMedications || []).map(med => 
                  med.id === updatedMedication.id ? updatedMedication : med
              );
              return { ...p, currentMedications: updatedMeds };
          }
          return p;
      }));
  };

  const handleDeleteMedication = (patientId: string, medicationId: string) => {
      if (!window.confirm('Are you sure you want to delete this medication?')) return;
      setPatients(prev => prev.map(p => {
          if (p.id === patientId) {
              const updatedMeds = (p.currentMedications || []).filter(med => med.id !== medicationId);
              return { ...p, currentMedications: updatedMeds };
          }
          return p;
      }));
  };

  // --- Doctor Handlers ---
  const handleOpenDoctorModal = (doctor: Doctor | null) => {
      setDoctorToEdit(doctor);
      setIsDoctorModalOpen(true);
  };
  
  const handleSaveDoctor = (doctorData: Omit<Doctor, 'id'> | Doctor) => {
      if ('id' in doctorData) {
          // Editing existing doctor
          setDoctors(prev => prev.map(d => d.id === doctorData.id ? doctorData : d));
      } else {
          // Adding new doctor
          const newDoctor: Doctor = { ...doctorData, id: `doc-${Date.now()}` };
          setDoctors(prev => [...prev, newDoctor]);
      }
      setIsDoctorModalOpen(false);
      setDoctorToEdit(null);
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
        setDoctors(prev => prev.filter(d => d.id !== doctorId));
    }
  };

  const originalRecord = selectedPatient?.records.find(r => r.id === formState?.id);
  const isFormDirty = formState ? JSON.stringify(formState) !== JSON.stringify(originalRecord) : false;

  return (
    <div className="h-screen flex text-text-light dark:text-text-dark">
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
        onExportPatient={handleExportPatient}
        onExportPatientPdf={handleExportPatientPdf}
        onEditRecord={handleEdit}
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
        />
        <main className="flex-1 overflow-y-auto p-6">
            {selectedPatient && formState ? (
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
    </div>
  );
};

export default App;
