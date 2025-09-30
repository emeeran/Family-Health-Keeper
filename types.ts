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
  phone?: string;
  address?: string;
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

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  // Indian format specifics
  alternatePhone?: string;
  whatsapp?: string;
  aadhaarNumber?: string;
  state?: string;
  city?: string;
  pincode?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Surgery {
  type: string;
  date: string;
  notes?: string;
}

export interface NotableEvent {
  type: string;
  date: string;
  description?: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  contactInfo?: ContactInfo;
  emergencyContact?: EmergencyContact;
  hospitalIds: HospitalId[];
  avatarUrl: string;
  medicalHistory: string;
  allergies?: string[];
  conditions?: string[];
  surgeries?: Surgery[];
  notableEvents?: NotableEvent[];
  familyMedicalHistory?: string;
  medicalImages?: any[]; // Using any for now to avoid circular imports
  records: MedicalRecord[];
  reminders: Reminder[];
  currentMedications: Medication[];
  primaryDoctorId?: string;
}