// Fix: Define and export the application's data types.
// The previous content was a copy of constants.ts and caused circular dependency and type resolution errors.
export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image';
  url: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

export interface MedicalRecord {
  id: string;
  date: string;
  doctorId: string;
  complaint: string;
  investigations: string;
  diagnosis: string;
  prescription: string;
  notes: string;
  documents: Document[];
  isNew?: boolean;
}

export interface Reminder {
  id:string;
  type: 'appointment' | 'medication';
  title: string;
  date: string; // The date the reminder should appear/trigger
  dueDate?: string; // The actual deadline for the task
  time: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface Medication {
  id: string;
  name: string;
  strength?: string; // e.g., "500mg"
  dosage: string; // e.g., "1 tablet"
  frequency: string; // e.g., "Twice daily"
  timings?: string[]; // e.g., ['08:00', '20:00']
  prescribedBy?: string;
  startDate?: string;
  notes?: string;
}

export interface HospitalId {
  id: string;
  hospitalName: string;
  patientId: string;
}

export interface Patient {
  id: string;
  name: string;
  hospitalIds: HospitalId[];
  avatarUrl: string;
  medicalHistory: string;
  records: MedicalRecord[];
  reminders: Reminder[];
  currentMedications: Medication[];
  primaryDoctorId?: string;
}