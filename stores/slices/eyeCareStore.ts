// @ts-nocheck
import type { StateCreator } from 'zustand';
import type { EyeRecord, EyePrescription, EyeTest, EyeCondition } from '../../types';

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

export interface EyeCareState {
  // Eye Care Actions
  initializeEyeRecord: (patientId: string) => void;
  addEyePrescription: (patientId: string, prescription: Omit<EyePrescription, 'id'>) => { success: boolean; error?: string; prescription?: EyePrescription };
  updateEyePrescription: (patientId: string, prescriptionId: string, updates: Partial<EyePrescription>) => void;
  deleteEyePrescription: (patientId: string, prescriptionId: string) => void;
  addEyeTest: (patientId: string, test: Omit<EyeTest, 'id'>) => { success: boolean; error?: string; test?: EyeTest };
  updateEyeTest: (patientId: string, testId: string, updates: Partial<EyeTest>) => void;
  deleteEyeTest: (patientId: string, testId: string) => void;
  addEyeCondition: (patientId: string, condition: Omit<EyeCondition, 'id'>) => { success: boolean; error?: string; condition?: EyeCondition };
  updateEyeCondition: (patientId: string, conditionId: string, updates: Partial<EyeCondition>) => void;
  deleteEyeCondition: (patientId: string, conditionId: string) => void;
  setCurrentGlasses: (patientId: string, prescriptionId: string) => void;
  setCurrentContacts: (patientId: string, prescriptionId: string) => void;
  updateEyeRecordNotes: (patientId: string, notes: string) => void;
}

export const createEyeCareSlice: StateCreator<EyeCareState> = (set, get: any) => ({
  initializeEyeRecord: (patientId: string) => {
    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId && !p.eyeRecord
          ? {
              ...p,
              eyeRecord: {
                id: generateUniqueId('eye'),
                patientId,
                prescriptions: [],
                tests: [],
                conditions: [],
                surgeries: [],
                medications: [],
                notes: '',
              },
            }
          : p
      ),
    }));
  },

  addEyePrescription: (patientId: string, prescription: Omit<EyePrescription, 'id'>) => {
    const newPrescription: EyePrescription = {
      ...prescription,
      id: generateUniqueId('eyerx'),
    };

    const state = get();
    const patient = state.patients.find((p: any) => p.id === patientId);
    
    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    // Initialize eye record if it doesn't exist
    if (!patient.eyeRecord) {
      state.initializeEyeRecord(patientId);
    }

    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                prescriptions: [...(p.eyeRecord?.prescriptions || []), newPrescription],
                lastCheckup: prescription.date,
              },
            }
          : p
      ),
    }));

    return { success: true, prescription: newPrescription };
  },

  updateEyePrescription: (patientId: string, prescriptionId: string, updates: Partial<EyePrescription>) => {
    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId && p.eyeRecord
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                prescriptions: p.eyeRecord.prescriptions.map((rx: EyePrescription) =>
                  rx.id === prescriptionId ? { ...rx, ...updates } : rx
                ),
              },
            }
          : p
      ),
    }));
  },

  deleteEyePrescription: (patientId: string, prescriptionId: string) => {
    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId && p.eyeRecord
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                prescriptions: p.eyeRecord.prescriptions.filter((rx: EyePrescription) => rx.id !== prescriptionId),
                currentGlasses: p.eyeRecord.currentGlasses === prescriptionId ? undefined : p.eyeRecord.currentGlasses,
                currentContacts: p.eyeRecord.currentContacts === prescriptionId ? undefined : p.eyeRecord.currentContacts,
              },
            }
          : p
      ),
    }));
  },

  addEyeTest: (patientId: string, test: Omit<EyeTest, 'id'>) => {
    const newTest: EyeTest = {
      ...test,
      id: generateUniqueId('eyetest'),
    };

    const state = get();
    const patient = state.patients.find((p: any) => p.id === patientId);
    
    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    if (!patient.eyeRecord) {
      state.initializeEyeRecord(patientId);
    }

    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                tests: [...(p.eyeRecord?.tests || []), newTest],
                lastCheckup: test.date,
              },
            }
          : p
      ),
    }));

    return { success: true, test: newTest };
  },

  updateEyeTest: (patientId: string, testId: string, updates: Partial<EyeTest>) => {
    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId && p.eyeRecord
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                tests: p.eyeRecord.tests.map((test: EyeTest) =>
                  test.id === testId ? { ...test, ...updates } : test
                ),
              },
            }
          : p
      ),
    }));
  },

  deleteEyeTest: (patientId: string, testId: string) => {
    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId && p.eyeRecord
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                tests: p.eyeRecord.tests.filter((test: EyeTest) => test.id !== testId),
              },
            }
          : p
      ),
    }));
  },

  addEyeCondition: (patientId: string, condition: Omit<EyeCondition, 'id'>) => {
    const newCondition: EyeCondition = {
      ...condition,
      id: generateUniqueId('eyecond'),
    };

    const state = get();
    const patient = state.patients.find((p: any) => p.id === patientId);
    
    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    if (!patient.eyeRecord) {
      state.initializeEyeRecord(patientId);
    }

    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                conditions: [...(p.eyeRecord?.conditions || []), newCondition],
              },
            }
          : p
      ),
    }));

    return { success: true, condition: newCondition };
  },

  updateEyeCondition: (patientId: string, conditionId: string, updates: Partial<EyeCondition>) => {
    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId && p.eyeRecord
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                conditions: p.eyeRecord.conditions.map((cond: EyeCondition) =>
                  cond.id === conditionId ? { ...cond, ...updates } : cond
                ),
              },
            }
          : p
      ),
    }));
  },

  deleteEyeCondition: (patientId: string, conditionId: string) => {
    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId && p.eyeRecord
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                conditions: p.eyeRecord.conditions.filter((cond: EyeCondition) => cond.id !== conditionId),
              },
            }
          : p
      ),
    }));
  },

  setCurrentGlasses: (patientId: string, prescriptionId: string) => {
    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId && p.eyeRecord
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                currentGlasses: prescriptionId,
              },
            }
          : p
      ),
    }));
  },

  setCurrentContacts: (patientId: string, prescriptionId: string) => {
    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId && p.eyeRecord
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                currentContacts: prescriptionId,
              },
            }
          : p
      ),
    }));
  },

  updateEyeRecordNotes: (patientId: string, notes: string) => {
    set((state: any) => ({
      patients: state.patients.map((p: any) =>
        p.id === patientId && p.eyeRecord
          ? {
              ...p,
              eyeRecord: {
                ...p.eyeRecord,
                notes,
              },
            }
          : p
      ),
    }));
  },
});
