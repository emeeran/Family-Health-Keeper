import type { StateCreator } from 'zustand';
import type { DiabetesRecord, HbA1cReading, BloodGlucoseReading, DiabetesMedication } from '../../types';
import type { AppState } from '../types';

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${generateUUID().slice(0, 8)}`;
};

export interface DiabetesState {
  // Diabetes Actions
  initializeDiabetesRecord: (patientId: string) => void;
  addHbA1cReading: (patientId: string, reading: Omit<HbA1cReading, 'id'>) => { success: boolean; error?: string; reading?: HbA1cReading };
  updateHbA1cReading: (patientId: string, readingId: string, updates: Partial<HbA1cReading>) => void;
  deleteHbA1cReading: (patientId: string, readingId: string) => void;
  addBloodGlucoseReading: (patientId: string, reading: Omit<BloodGlucoseReading, 'id'>) => { success: boolean; error?: string; reading?: BloodGlucoseReading };
  updateBloodGlucoseReading: (patientId: string, readingId: string, updates: Partial<BloodGlucoseReading>) => void;
  deleteBloodGlucoseReading: (patientId: string, readingId: string) => void;
  addDiabetesMedication: (patientId: string, medication: Omit<DiabetesMedication, 'id'>) => { success: boolean; error?: string; medication?: DiabetesMedication };
  updateDiabetesMedication: (patientId: string, medicationId: string, updates: Partial<DiabetesMedication>) => void;
  deleteDiabetesMedication: (patientId: string, medicationId: string) => void;
  updateDiabetesRecord: (patientId: string, updates: Partial<DiabetesRecord>) => void;
}

export const createDiabetesSlice: StateCreator<AppState & DiabetesState, [], [], DiabetesState> = (set, get) => ({
  // Initialize diabetes record for a patient
  initializeDiabetesRecord: (patientId: string) => {
    const { patients } = get();
    const patient = patients.find(p => p.id === patientId);

    if (patient && !patient.diabetesRecord) {
      const newDiabetesRecord: DiabetesRecord = {
        id: generateUniqueId('diabetes'),
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

      set((state) => ({
        patients: state.patients.map(p =>
          p.id === patientId
            ? { ...p, diabetesRecord: newDiabetesRecord }
            : p
        )
      }));
    }
  },

  // Add HbA1c reading
  addHbA1cReading: (patientId: string, reading: Omit<HbA1cReading, 'id'>) => {
    try {
      const { patients } = get();
      const patient = patients.find(p => p.id === patientId);

      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      // Initialize diabetes record if it doesn't exist
      if (!patient.diabetesRecord) {
        get().initializeDiabetesRecord(patientId);
      }

      const newReading: HbA1cReading = {
        ...reading,
        id: generateUniqueId('hba1c')
      };

      set((state) => ({
        patients: state.patients.map(p => {
          if (p.id === patientId && p.diabetesRecord) {
            return {
              ...p,
              diabetesRecord: {
                ...p.diabetesRecord,
                hba1cReadings: [...p.diabetesRecord.hba1cReadings, newReading]
              }
            };
          }
          return p;
        })
      }));

      return { success: true, reading: newReading };
    } catch (error) {
      console.error('Failed to add HbA1c reading:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Update HbA1c reading
  updateHbA1cReading: (patientId: string, readingId: string, updates: Partial<HbA1cReading>) => {
    set((state) => ({
      patients: state.patients.map(p => {
        if (p.id === patientId && p.diabetesRecord) {
          return {
            ...p,
            diabetesRecord: {
              ...p.diabetesRecord,
              hba1cReadings: p.diabetesRecord.hba1cReadings.map(r =>
                r.id === readingId ? { ...r, ...updates } : r
              )
            }
          };
        }
        return p;
      })
    }));
  },

  // Delete HbA1c reading
  deleteHbA1cReading: (patientId: string, readingId: string) => {
    set((state) => ({
      patients: state.patients.map(p => {
        if (p.id === patientId && p.diabetesRecord) {
          return {
            ...p,
            diabetesRecord: {
              ...p.diabetesRecord,
              hba1cReadings: p.diabetesRecord.hba1cReadings.filter(r => r.id !== readingId)
            }
          };
        }
        return p;
      })
    }));
  },

  // Add blood glucose reading
  addBloodGlucoseReading: (patientId: string, reading: Omit<BloodGlucoseReading, 'id'>) => {
    try {
      const { patients } = get();
      const patient = patients.find(p => p.id === patientId);

      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      // Initialize diabetes record if it doesn't exist
      if (!patient.diabetesRecord) {
        get().initializeDiabetesRecord(patientId);
      }

      const newReading: BloodGlucoseReading = {
        ...reading,
        id: generateUniqueId('glucose')
      };

      set((state) => ({
        patients: state.patients.map(p => {
          if (p.id === patientId && p.diabetesRecord) {
            return {
              ...p,
              diabetesRecord: {
                ...p.diabetesRecord,
                bloodGlucoseReadings: [...p.diabetesRecord.bloodGlucoseReadings, newReading]
              }
            };
          }
          return p;
        })
      }));

      return { success: true, reading: newReading };
    } catch (error) {
      console.error('Failed to add blood glucose reading:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Update blood glucose reading
  updateBloodGlucoseReading: (patientId: string, readingId: string, updates: Partial<BloodGlucoseReading>) => {
    set((state) => ({
      patients: state.patients.map(p => {
        if (p.id === patientId && p.diabetesRecord) {
          return {
            ...p,
            diabetesRecord: {
              ...p.diabetesRecord,
              bloodGlucoseReadings: p.diabetesRecord.bloodGlucoseReadings.map(r =>
                r.id === readingId ? { ...r, ...updates } : r
              )
            }
          };
        }
        return p;
      })
    }));
  },

  // Delete blood glucose reading
  deleteBloodGlucoseReading: (patientId: string, readingId: string) => {
    set((state) => ({
      patients: state.patients.map(p => {
        if (p.id === patientId && p.diabetesRecord) {
          return {
            ...p,
            diabetesRecord: {
              ...p.diabetesRecord,
              bloodGlucoseReadings: p.diabetesRecord.bloodGlucoseReadings.filter(r => r.id !== readingId)
            }
          };
        }
        return p;
      })
    }));
  },

  // Add diabetes medication
  addDiabetesMedication: (patientId: string, medication: Omit<DiabetesMedication, 'id'>) => {
    try {
      const { patients } = get();
      const patient = patients.find(p => p.id === patientId);

      if (!patient) {
        return { success: false, error: 'Patient not found' };
      }

      // Initialize diabetes record if it doesn't exist
      if (!patient.diabetesRecord) {
        get().initializeDiabetesRecord(patientId);
      }

      const newMedication: DiabetesMedication = {
        ...medication,
        id: generateUniqueId('medication')
      };

      set((state) => ({
        patients: state.patients.map(p => {
          if (p.id === patientId && p.diabetesRecord) {
            return {
              ...p,
              diabetesRecord: {
                ...p.diabetesRecord,
                medications: [...p.diabetesRecord.medications, newMedication]
              }
            };
          }
          return p;
        })
      }));

      return { success: true, medication: newMedication };
    } catch (error) {
      console.error('Failed to add diabetes medication:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  // Update diabetes medication
  updateDiabetesMedication: (patientId: string, medicationId: string, updates: Partial<DiabetesMedication>) => {
    set((state) => ({
      patients: state.patients.map(p => {
        if (p.id === patientId && p.diabetesRecord) {
          return {
            ...p,
            diabetesRecord: {
              ...p.diabetesRecord,
              medications: p.diabetesRecord.medications.map(m =>
                m.id === medicationId ? { ...m, ...updates } : m
              )
            }
          };
        }
        return p;
      })
    }));
  },

  // Delete diabetes medication
  deleteDiabetesMedication: (patientId: string, medicationId: string) => {
    set((state) => ({
      patients: state.patients.map(p => {
        if (p.id === patientId && p.diabetesRecord) {
          return {
            ...p,
            diabetesRecord: {
              ...p.diabetesRecord,
              medications: p.diabetesRecord.medications.filter(m => m.id !== medicationId)
            }
          };
        }
        return p;
      })
    }));
  },

  // Update diabetes record
  updateDiabetesRecord: (patientId: string, updates: Partial<DiabetesRecord>) => {
    set((state) => ({
      patients: state.patients.map(p => {
        if (p.id === patientId && p.diabetesRecord) {
          return {
            ...p,
            diabetesRecord: { ...p.diabetesRecord, ...updates }
          };
        }
        return p;
      })
    }));
  }
});