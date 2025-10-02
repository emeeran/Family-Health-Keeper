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

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  date: string;
  time: string;
  duration?: number; // in minutes
  type: 'consultation' | 'followup' | 'procedure' | 'checkup' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  reason: string;
  notes?: string;
  location?: string;
  reminderSet?: boolean;
  reminderTime?: string; // When to send reminder (e.g., '1 day before', '2 hours before')
  createdAt: string;
  updatedAt?: string;
}

export interface Reminder {
  id: string;
  type: 'appointment' | 'medication' | 'test' | 'followup';
  title: string;
  date: string; // The date the reminder should appear/trigger
  dueDate?: string; // The actual deadline for the task
  time: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  appointmentId?: string; // Link to appointment if reminder is for appointment
  medicationId?: string; // Link to medication if reminder is for medication
  notes?: string;
  notificationSent?: boolean;
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

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'family_member';
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
  isActive: boolean;
  profileCompleted: boolean;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: string;
  createdAt: string;
  deviceId?: string;
  deviceInfo?: string;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role?: 'admin' | 'user' | 'family_member';
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
  appointments: Appointment[];
  currentMedications: Medication[];
  primaryDoctorId?: string;
  userId?: string; // Link to the user who owns this patient
}