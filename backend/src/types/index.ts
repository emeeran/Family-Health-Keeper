export interface User {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'user' | 'doctor';
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  device_info?: string;
  ip_address?: string;
  expires_at: Date;
  created_at: Date;
  is_active: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone?: string;
  email?: string;
  address?: string;
  hospital_affiliation?: string;
  license_number?: string;
  years_experience?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Patient {
  id: string;
  user_id: string;
  name: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other';
  blood_type?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  primary_doctor_id?: string;
  avatar_url?: string;
  medical_history?: string;
  allergies?: string;
  family_medical_history?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PatientHospitalId {
  id: string;
  patient_id: string;
  hospital_name: string;
  hospital_patient_id: string;
  created_at: Date;
}

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id?: string;
  record_date: Date;
  complaint?: string;
  symptoms?: string;
  investigations?: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
  follow_up_date?: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: string;
  medical_record_id: string;
  filename: string;
  original_name: string;
  file_type: 'pdf' | 'jpg' | 'jpeg' | 'png' | 'doc' | 'docx';
  file_size: number;
  file_path: string;
  mime_type?: string;
  uploaded_at: Date;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id?: string;
  title: string;
  description?: string;
  appointment_date: Date;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  location?: string;
  notes?: string;
  reminder_sent: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Medication {
  id: string;
  patient_id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'other';
  start_date: Date;
  end_date?: Date;
  prescribed_by?: string;
  instructions?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Reminder {
  id: string;
  patient_id: string;
  title: string;
  description?: string;
  reminder_date: Date;
  reminder_type: 'medication' | 'appointment' | 'follow-up' | 'other';
  is_completed: boolean;
  notification_sent: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// Request/Response types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role?: 'user' | 'doctor';
}

export interface AuthResponse {
  success: boolean;
  user?: Omit<User, 'password_hash'>;
  token?: string;
  message?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PatientQueryParams extends PaginationParams {
  search?: string;
  doctor_id?: string;
}

export interface MedicalRecordQueryParams extends PaginationParams {
  patient_id: string;
  doctor_id?: string;
  date_from?: string;
  date_to?: string;
  severity?: string;
}

export interface AppointmentQueryParams extends PaginationParams {
  patient_id?: string;
  doctor_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

// Database query results
export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  command: string;
  fields: any[];
}