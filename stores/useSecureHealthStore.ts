import { create } from 'zustand';
import { secureStorage } from '../services/secureStorageService';
import type { Patient, MedicalRecord, Doctor, Document, Reminder, Medication, HbA1cReading, BloodGlucoseReading, DiabetesMedication } from '../types';
import { DOCTORS } from '../constants';

interface SecureHealthState {
  // Patient and Record State
  patients: Patient[];
  doctors: Doctor[];
  selectedPatientId: string | null;
  selectedRecordId: string | null;

  // UI State (can remain in Zustand)
  isEditingRecord: boolean;
  theme: 'light' | 'dark';

  // Search State
  searchQuery: string;

  // Actions - Patients (using secure storage)
  loadPatients: () => Promise<void>;
  savePatients: () => Promise<void>;
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;

  // Actions - Doctors (using secure storage)
  loadDoctors: () => Promise<void>;
  saveDoctors: () => Promise<void>;
  addDoctor: (doctor: Doctor) => Promise<void>;
  updateDoctor: (id: string, updates: Partial<Doctor>) => Promise<void>;
  deleteDoctor: (id: string) => Promise<void>;

  // Actions - Records
  setSelectedPatient: (patientId: string) => void;
  setSelectedRecord: (recordId: string | null) => void;
  addRecord: (patientId: string, record: MedicalRecord) => Promise<void>;
  updateRecord: (patientId: string, recordId: string, updates: Partial<MedicalRecord>) => Promise<void>;
  deleteRecord: (patientId: string, recordId: string) => Promise<void>;

  // Actions - UI
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSearchQuery: (query: string) => void;
  setIsEditing: (editing: boolean) => void;

  // Document Actions
  addDocument: (patientId: string, recordId: string, document: Document) => Promise<void>;
  deleteDocument: (patientId: string, recordId: string, documentId: string) => Promise<void>;
  renameDocument: (patientId: string, recordId: string, documentId: string, newName: string) => Promise<void>;

  // Reminder Actions
  addReminder: (patientId: string, reminder: Omit<Reminder, 'id'>) => Promise<void>;
  toggleReminder: (patientId: string, reminderId: string) => Promise<void>;
  deleteReminder: (patientId: string, reminderId: string) => Promise<void>;

  // Medication Actions
  addMedication: (patientId: string, medication: Omit<Medication, 'id'>) => Promise<void>;
  addBulkMedications: (patientId: string, medications: Omit<Medication, 'id'>[]) => Promise<void>;
  updateMedication: (patientId: string, medication: Medication) => Promise<void>;
  deleteMedication: (patientId: string, medicationId: string) => Promise<void>;

  // Appointment Actions
  addAppointment: (patientId: string, appointment: Omit<import('../types').Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointment: (patientId: string, appointmentId: string, updates: Partial<import('../types').Appointment>) => Promise<void>;
  deleteAppointment: (patientId: string, appointmentId: string) => Promise<void>;
  createReminderFromAppointment: (patientId: string, appointmentId: string) => Promise<void>;

  // Diabetes Actions
  initializeDiabetesRecord: (patientId: string) => Promise<void>;
  addHbA1cReading: (patientId: string, reading: Omit<HbA1cReading, 'id'>) => Promise<void>;
  updateHbA1cReading: (patientId: string, readingId: string, updates: Partial<HbA1cReading>) => Promise<void>;
  deleteHbA1cReading: (patientId: string, readingId: string) => Promise<void>;
  addBloodGlucoseReading: (patientId: string, reading: Omit<BloodGlucoseReading, 'id'>) => Promise<void>;
  updateBloodGlucoseReading: (patientId: string, readingId: string, updates: Partial<BloodGlucoseReading>) => Promise<void>;
  deleteBloodGlucoseReading: (patientId: string, readingId: string) => Promise<void>;
  addDiabetesMedication: (patientId: string, medication: Omit<DiabetesMedication, 'id'>) => Promise<void>;
  updateDiabetesMedication: (patientId: string, medicationId: string, updates: Partial<DiabetesMedication>) => Promise<void>;
  deleteDiabetesMedication: (patientId: string, medicationId: string) => Promise<void>;

  // Utility Actions
  clearAllData: () => Promise<void>;
  getAuditLog: () => any[];
}

export const useSecureHealthStore = create<SecureHealthState>((set, get) => ({
  // Initial State
  patients: [],
  doctors: [],
  selectedPatientId: null,
  selectedRecordId: null,
  isEditingRecord: false,
  theme: 'light',
  searchQuery: '',

  // Patient Actions
  loadPatients: async () => {
    try {
      const patients = await secureStorage.loadPatients();
      set({ patients });
    } catch (error) {
      console.error('Failed to load patients:', error);
      set({ patients: [] });
    }
  },

  savePatients: async () => {
    try {
      const { patients } = get();
      await secureStorage.savePatients(patients);
    } catch (error) {
      console.error('Failed to save patients:', error);
    }
  },

  addPatient: async (patient: Patient) => {
    try {
      await secureStorage.addPatient(patient);
      set((state) => ({
        patients: [...state.patients, patient]
      }));
    } catch (error) {
      console.error('Failed to add patient:', error);
    }
  },

  updatePatient: async (id: string, updates: Partial<Patient>) => {
    try {
      await secureStorage.updatePatient(id, updates);
      set((state) => ({
        patients: state.patients.map(patient =>
          patient.id === id ? { ...patient, ...updates } : patient
        )
      }));
    } catch (error) {
      console.error('Failed to update patient:', error);
    }
  },

  deletePatient: async (id: string) => {
    try {
      await secureStorage.deletePatient(id);
      set((state) => ({
        patients: state.patients.filter(patient => patient.id !== id),
        selectedPatientId: state.selectedPatientId === id ? null : state.selectedPatientId,
        selectedRecordId: state.selectedPatientId === id ? null : state.selectedRecordId
      }));
    } catch (error) {
      console.error('Failed to delete patient:', error);
    }
  },

  // Doctor Actions
  loadDoctors: async () => {
    try {
      let doctors = await secureStorage.loadDoctors();
      
      // If no doctors in storage, initialize with defaults from constants
      if (doctors.length === 0) {
        doctors = [...DOCTORS];
        // Save the initial doctors to storage
        await secureStorage.saveDoctors(doctors);
      }
      
      set({ doctors });
    } catch (error) {
      console.error('Failed to load doctors:', error);
      // Fallback to constants if load fails
      set({ doctors: [...DOCTORS] });
    }
  },

  saveDoctors: async () => {
    try {
      const { doctors } = get();
      await secureStorage.saveDoctors(doctors);
    } catch (error) {
      console.error('Failed to save doctors:', error);
    }
  },

  addDoctor: async (doctor: Doctor) => {
    try {
      await secureStorage.addDoctor?.(doctor);
      const doctors = await secureStorage.loadDoctors();
      set({ doctors });
    } catch (error) {
      console.error('Failed to add doctor:', error);
    }
  },

  updateDoctor: async (id: string, updates: Partial<Doctor>) => {
    try {
      await secureStorage.updateDoctor?.(id, updates);
      const doctors = await secureStorage.loadDoctors();
      set({ doctors });
    } catch (error) {
      console.error('Failed to update doctor:', error);
    }
  },

  deleteDoctor: async (id: string) => {
    try {
      await secureStorage.deleteDoctor?.(id);
      const doctors = await secureStorage.loadDoctors();
      set({ doctors });
    } catch (error) {
      console.error('Failed to delete doctor:', error);
    }
  },

  // Record Actions
  setSelectedPatient: (patientId: string) => {
    set({
      selectedPatientId: patientId,
      selectedRecordId: null // Reset record selection when patient changes
    });
  },

  setSelectedRecord: (recordId: string | null) => {
    set({ selectedRecordId: recordId });
  },

  addRecord: async (patientId: string, record: MedicalRecord) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex] = {
          ...updatedPatients[patientIndex],
          records: [...updatedPatients[patientIndex].records, record]
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to add record:', error);
    }
  },

  updateRecord: async (patientId: string, recordId: string, updates: Partial<MedicalRecord>) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const recordIndex = updatedPatients[patientIndex].records.findIndex(r => r.id === recordId);

        if (recordIndex !== -1) {
          updatedPatients[patientIndex].records[recordIndex] = {
            ...updatedPatients[patientIndex].records[recordIndex],
            ...updates
          };

          await secureStorage.savePatients(updatedPatients);
          set({ patients: updatedPatients });
        }
      }
    } catch (error) {
      console.error('Failed to update record:', error);
    }
  },

  deleteRecord: async (patientId: string, recordId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].records = updatedPatients[patientIndex].records.filter(r => r.id !== recordId);

        await secureStorage.savePatients(updatedPatients);
        set({
          patients: updatedPatients,
          selectedRecordId: null
        });
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
    }
  },

  // UI Actions
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    // Store theme preference in localStorage (non-sensitive data)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  },

  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setIsEditing: (editing: boolean) => {
    set({ isEditingRecord: editing });
  },

  // Utility Actions
  clearAllData: async () => {
    try {
      await secureStorage.clearAllData();
      set({
        patients: [],
        doctors: [],
        selectedPatientId: null,
        selectedRecordId: null,
        searchQuery: ''
      });
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  },

  // Document Actions
  addDocument: async (patientId: string, recordId: string, document: Document) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const recordIndex = updatedPatients[patientIndex].records.findIndex(r => r.id === recordId);

        if (recordIndex !== -1) {
          updatedPatients[patientIndex].records[recordIndex] = {
            ...updatedPatients[patientIndex].records[recordIndex],
            documents: [...updatedPatients[patientIndex].records[recordIndex].documents, document]
          };

          await secureStorage.savePatients(updatedPatients);
          set({ patients: updatedPatients });
        }
      }
    } catch (error) {
      console.error('Failed to add document:', error);
    }
  },

  deleteDocument: async (patientId: string, recordId: string, documentId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const recordIndex = updatedPatients[patientIndex].records.findIndex(r => r.id === recordId);

        if (recordIndex !== -1) {
          updatedPatients[patientIndex].records[recordIndex].documents =
            updatedPatients[patientIndex].records[recordIndex].documents.filter(d => d.id !== documentId);

          await secureStorage.savePatients(updatedPatients);
          set({ patients: updatedPatients });
        }
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  },

  renameDocument: async (patientId: string, recordId: string, documentId: string, newName: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const recordIndex = updatedPatients[patientIndex].records.findIndex(r => r.id === recordId);

        if (recordIndex !== -1) {
          updatedPatients[patientIndex].records[recordIndex].documents =
            updatedPatients[patientIndex].records[recordIndex].documents.map(d =>
              d.id === documentId ? { ...d, name: newName } : d
            );

          await secureStorage.savePatients(updatedPatients);
          set({ patients: updatedPatients });
        }
      }
    } catch (error) {
      console.error('Failed to rename document:', error);
    }
  },

  // Reminder Actions
  addReminder: async (patientId: string, reminder: Omit<Reminder, 'id'>) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const newReminder: Reminder = { ...reminder, id: `rem-${Date.now()}` };
        updatedPatients[patientIndex] = {
          ...updatedPatients[patientIndex],
          reminders: [...updatedPatients[patientIndex].reminders, newReminder]
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to add reminder:', error);
    }
  },

  toggleReminder: async (patientId: string, reminderId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].reminders =
          updatedPatients[patientIndex].reminders.map(r =>
            r.id === reminderId ? { ...r, completed: !r.completed } : r
          );

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
    }
  },

  deleteReminder: async (patientId: string, reminderId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].reminders =
          updatedPatients[patientIndex].reminders.filter(r => r.id !== reminderId);

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  },

  // Medication Actions
  addMedication: async (patientId: string, medication: Omit<Medication, 'id'>) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const newMedication: Medication = {
          ...medication,
          id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        };
        updatedPatients[patientIndex] = {
          ...updatedPatients[patientIndex],
          currentMedications: [...updatedPatients[patientIndex].currentMedications, newMedication]
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to add medication:', error);
    }
  },

  addBulkMedications: async (patientId: string, medications: Omit<Medication, 'id'>[]) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const newMedications: Medication[] = medications.map((medication, index) => ({
          ...medication,
          id: `med-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`
        }));

        updatedPatients[patientIndex] = {
          ...updatedPatients[patientIndex],
          currentMedications: [...updatedPatients[patientIndex].currentMedications, ...newMedications]
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to add bulk medications:', error);
    }
  },

  updateMedication: async (patientId: string, medication: Medication) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].currentMedications =
          updatedPatients[patientIndex].currentMedications.map(m =>
            m.id === medication.id ? medication : m
          );

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to update medication:', error);
    }
  },

  deleteMedication: async (patientId: string, medicationId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].currentMedications =
          updatedPatients[patientIndex].currentMedications.filter(m => m.id !== medicationId);

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to delete medication:', error);
    }
  },

  // Appointment Actions
  addAppointment: async (patientId: string, appointment) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const newAppointment = {
          ...appointment,
          id: `apt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };

        if (!updatedPatients[patientIndex].appointments) {
          updatedPatients[patientIndex].appointments = [];
        }
        
        updatedPatients[patientIndex].appointments.push(newAppointment);

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to add appointment:', error);
    }
  },

  updateAppointment: async (patientId: string, appointmentId: string, updates) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const appointmentIndex = updatedPatients[patientIndex].appointments?.findIndex(
          a => a.id === appointmentId
        );

        if (appointmentIndex !== undefined && appointmentIndex !== -1) {
          updatedPatients[patientIndex].appointments[appointmentIndex] = {
            ...updatedPatients[patientIndex].appointments[appointmentIndex],
            ...updates,
            updatedAt: new Date().toISOString(),
          };

          await secureStorage.savePatients(updatedPatients);
          set({ patients: updatedPatients });
        }
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
    }
  },

  deleteAppointment: async (patientId: string, appointmentId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].appointments =
          updatedPatients[patientIndex].appointments?.filter(a => a.id !== appointmentId) || [];

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to delete appointment:', error);
    }
  },

  createReminderFromAppointment: async (patientId: string, appointmentId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const patient = patients[patientIndex];
        const appointment = patient.appointments?.find(a => a.id === appointmentId);

        if (appointment) {
          const reminderDate = new Date(appointment.date);
          
          // Calculate reminder time based on reminderTime setting
          if (appointment.reminderTime) {
            if (appointment.reminderTime.includes('day')) {
              const days = parseInt(appointment.reminderTime);
              reminderDate.setDate(reminderDate.getDate() - (days || 1));
            } else if (appointment.reminderTime.includes('hour')) {
              const hours = parseInt(appointment.reminderTime);
              reminderDate.setHours(reminderDate.getHours() - (hours || 1));
            } else if (appointment.reminderTime.includes('minute')) {
              const minutes = parseInt(appointment.reminderTime);
              reminderDate.setMinutes(reminderDate.getMinutes() - (minutes || 15));
            }
          }

          const newReminder: Omit<import('../types').Reminder, 'id'> = {
            type: 'appointment',
            title: `Appointment: ${appointment.reason}`,
            date: reminderDate.toISOString().split('T')[0],
            dueDate: appointment.date,
            time: appointment.time,
            completed: false,
            priority: appointment.type === 'emergency' ? 'high' : 'medium',
            appointmentId: appointment.id,
            notes: `Reminder for appointment with doctor. Location: ${appointment.location || 'N/A'}`,
          };

          // Use existing addReminder method
          await get().addReminder(patientId, newReminder);
        }
      }
    } catch (error) {
      console.error('Failed to create reminder from appointment:', error);
    }
  },

  // Diabetes Actions
  initializeDiabetesRecord: async (patientId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1 && !patients[patientIndex].diabetesRecord) {
        const updatedPatients = [...patients];
        const newDiabetesRecord: import('../types').DiabetesRecord = {
          id: `diabetes-${Date.now()}`,
          patientId,
          diagnosisDate: new Date().toISOString().split('T')[0],
          type: 'type2', // Default, can be updated later
          hba1cReadings: [],
          bloodGlucoseReadings: [],
          medications: [],
          targetHba1c: 7.0,
          targetGlucoseRanges: {
            fasting: { min: 80, max: 130 },
            postprandial: { min: 100, max: 180 }
          },
          lastCheckup: new Date().toISOString().split('T')[0],
          nextCheckup: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };

        updatedPatients[patientIndex] = {
          ...updatedPatients[patientIndex],
          diabetesRecord: newDiabetesRecord
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to initialize diabetes record:', error);
    }
  },

  addHbA1cReading: async (patientId: string, reading: Omit<HbA1cReading, 'id'>) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const patient = updatedPatients[patientIndex];

        // Initialize diabetes record if it doesn't exist
        if (!patient.diabetesRecord) {
          await get().initializeDiabetesRecord(patientId);
          // Refetch updated patients
          const currentPatients = get().patients;
          const updatedPatientIndex = currentPatients.findIndex(p => p.id === patientId);
          if (updatedPatientIndex === -1) return;
          updatedPatients[updatedPatientIndex] = currentPatients[updatedPatientIndex];
        }

        const newReading: HbA1cReading = {
          ...reading,
          id: `hba1c-${Date.now()}`
        };

        const finalPatientIndex = updatedPatients.findIndex(p => p.id === patientId);
        if (finalPatientIndex !== -1 && updatedPatients[finalPatientIndex].diabetesRecord) {
          updatedPatients[finalPatientIndex].diabetesRecord = {
            ...updatedPatients[finalPatientIndex].diabetesRecord,
            hba1cReadings: [...updatedPatients[finalPatientIndex].diabetesRecord.hba1cReadings, newReading]
          };

          await secureStorage.savePatients(updatedPatients);
          set({ patients: updatedPatients });
        }
      }
    } catch (error) {
      console.error('Failed to add HbA1c reading:', error);
    }
  },

  updateHbA1cReading: async (patientId: string, readingId: string, updates: Partial<HbA1cReading>) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1 && patients[patientIndex].diabetesRecord) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].diabetesRecord = {
          ...updatedPatients[patientIndex].diabetesRecord,
          hba1cReadings: updatedPatients[patientIndex].diabetesRecord.hba1cReadings.map(r =>
            r.id === readingId ? { ...r, ...updates } : r
          )
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to update HbA1c reading:', error);
    }
  },

  deleteHbA1cReading: async (patientId: string, readingId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1 && patients[patientIndex].diabetesRecord) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].diabetesRecord = {
          ...updatedPatients[patientIndex].diabetesRecord,
          hba1cReadings: updatedPatients[patientIndex].diabetesRecord.hba1cReadings.filter(r => r.id !== readingId)
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to delete HbA1c reading:', error);
    }
  },

  addBloodGlucoseReading: async (patientId: string, reading: Omit<BloodGlucoseReading, 'id'>) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const patient = updatedPatients[patientIndex];

        // Initialize diabetes record if it doesn't exist
        if (!patient.diabetesRecord) {
          await get().initializeDiabetesRecord(patientId);
          // Refetch updated patients
          const currentPatients = get().patients;
          const updatedPatientIndex = currentPatients.findIndex(p => p.id === patientId);
          if (updatedPatientIndex === -1) return;
          updatedPatients[updatedPatientIndex] = currentPatients[updatedPatientIndex];
        }

        const newReading: BloodGlucoseReading = {
          ...reading,
          id: `glucose-${Date.now()}`
        };

        const finalPatientIndex = updatedPatients.findIndex(p => p.id === patientId);
        if (finalPatientIndex !== -1 && updatedPatients[finalPatientIndex].diabetesRecord) {
          updatedPatients[finalPatientIndex].diabetesRecord = {
            ...updatedPatients[finalPatientIndex].diabetesRecord,
            bloodGlucoseReadings: [...updatedPatients[finalPatientIndex].diabetesRecord.bloodGlucoseReadings, newReading]
          };

          await secureStorage.savePatients(updatedPatients);
          set({ patients: updatedPatients });
        }
      }
    } catch (error) {
      console.error('Failed to add blood glucose reading:', error);
    }
  },

  updateBloodGlucoseReading: async (patientId: string, readingId: string, updates: Partial<BloodGlucoseReading>) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1 && patients[patientIndex].diabetesRecord) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].diabetesRecord = {
          ...updatedPatients[patientIndex].diabetesRecord,
          bloodGlucoseReadings: updatedPatients[patientIndex].diabetesRecord.bloodGlucoseReadings.map(r =>
            r.id === readingId ? { ...r, ...updates } : r
          )
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to update blood glucose reading:', error);
    }
  },

  deleteBloodGlucoseReading: async (patientId: string, readingId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1 && patients[patientIndex].diabetesRecord) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].diabetesRecord = {
          ...updatedPatients[patientIndex].diabetesRecord,
          bloodGlucoseReadings: updatedPatients[patientIndex].diabetesRecord.bloodGlucoseReadings.filter(r => r.id !== readingId)
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to delete blood glucose reading:', error);
    }
  },

  addDiabetesMedication: async (patientId: string, medication: Omit<DiabetesMedication, 'id'>) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1) {
        const updatedPatients = [...patients];
        const patient = updatedPatients[patientIndex];

        // Initialize diabetes record if it doesn't exist
        if (!patient.diabetesRecord) {
          await get().initializeDiabetesRecord(patientId);
          // Refetch updated patients
          const currentPatients = get().patients;
          const updatedPatientIndex = currentPatients.findIndex(p => p.id === patientId);
          if (updatedPatientIndex === -1) return;
          updatedPatients[updatedPatientIndex] = currentPatients[updatedPatientIndex];
        }

        const newMedication: DiabetesMedication = {
          ...medication,
          id: `diabetes-med-${Date.now()}`
        };

        const finalPatientIndex = updatedPatients.findIndex(p => p.id === patientId);
        if (finalPatientIndex !== -1 && updatedPatients[finalPatientIndex].diabetesRecord) {
          updatedPatients[finalPatientIndex].diabetesRecord = {
            ...updatedPatients[finalPatientIndex].diabetesRecord,
            medications: [...updatedPatients[finalPatientIndex].diabetesRecord.medications, newMedication]
          };

          await secureStorage.savePatients(updatedPatients);
          set({ patients: updatedPatients });
        }
      }
    } catch (error) {
      console.error('Failed to add diabetes medication:', error);
    }
  },

  updateDiabetesMedication: async (patientId: string, medicationId: string, updates: Partial<DiabetesMedication>) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1 && patients[patientIndex].diabetesRecord) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].diabetesRecord = {
          ...updatedPatients[patientIndex].diabetesRecord,
          medications: updatedPatients[patientIndex].diabetesRecord.medications.map(m =>
            m.id === medicationId ? { ...m, ...updates } : m
          )
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to update diabetes medication:', error);
    }
  },

  deleteDiabetesMedication: async (patientId: string, medicationId: string) => {
    try {
      const { patients } = get();
      const patientIndex = patients.findIndex(p => p.id === patientId);

      if (patientIndex !== -1 && patients[patientIndex].diabetesRecord) {
        const updatedPatients = [...patients];
        updatedPatients[patientIndex].diabetesRecord = {
          ...updatedPatients[patientIndex].diabetesRecord,
          medications: updatedPatients[patientIndex].diabetesRecord.medications.filter(m => m.id !== medicationId)
        };

        await secureStorage.savePatients(updatedPatients);
        set({ patients: updatedPatients });
      }
    } catch (error) {
      console.error('Failed to delete diabetes medication:', error);
    }
  },

  getAuditLog: () => {
    return secureStorage.getAuditLog();
  }
}));