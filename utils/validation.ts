import { z } from 'zod';
import type { Patient, Doctor, MedicalRecord, Medication, Reminder } from '../types';

// Common validation schemas
const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
const clinicPhoneRegex = /^Ph\s+\d{2}\s+\d{8,10}$/;
const mobileRegex = /^(0\d{9,10}|\+?[\d\s\-()]{10,})$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Patient validation
export const patientSchema = z.object({
  id: z.string().min(1, 'Patient ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  dateOfBirth: z.string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
    .optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  contactInfo: z.object({
    phone: z.string()
      .regex(phoneRegex, 'Invalid phone number format')
      .optional(),
    email: z.string()
      .regex(emailRegex, 'Invalid email address')
      .optional(),
    address: z.string().max(200, 'Address must be 200 characters or less').optional(),
  }).optional(),
  emergencyContact: z.object({
    name: z.string().min(1, 'Emergency contact name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phone: z.string().regex(phoneRegex, 'Invalid emergency contact phone number'),
  }).optional(),
  hospitalIds: z.array(z.object({
    id: z.string().min(1, 'Hospital ID is required'),
    hospitalName: z.string().min(1, 'Hospital name is required'),
    patientId: z.string().min(1, 'Patient hospital ID is required'),
  })).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  medicalHistory: z.string().max(2000, 'Medical history must be 2000 characters or less'),
  allergies: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  surgeries: z.array(z.object({
    type: z.string().min(1, 'Surgery type is required'),
    date: z.string().regex(dateRegex, 'Surgery date must be in YYYY-MM-DD format'),
    notes: z.string().max(500, 'Surgery notes must be 500 characters or less').optional(),
  })).optional(),
  notableEvents: z.array(z.object({
    type: z.string().min(1, 'Event type is required'),
    date: z.string().regex(dateRegex, 'Event date must be in YYYY-MM-DD format'),
    description: z.string().max(500, 'Event description must be 500 characters or less').optional(),
  })).optional(),
  familyMedicalHistory: z.string().max(1000, 'Family medical history must be 1000 characters or less').optional(),
  primaryDoctorId: z.string().optional(),
});

// Doctor validation
export const doctorSchema = z.object({
  id: z.string().min(1, 'Doctor ID is required'),
  name: z.string().min(1, 'Doctor name is required').max(100, 'Name must be 100 characters or less'),
  specialty: z.string().min(1, 'Specialty is required').max(100, 'Specialty must be 100 characters or less'),
  avatarUrl: z.string().url('Invalid avatar URL').optional(),
  contactInfo: z.object({
    clinicPhone: z.string()
      .regex(clinicPhoneRegex, 'Invalid clinic phone format. Use: Ph xx xxxxxxxxx')
      .optional(),
    mobile: z.string()
      .regex(mobileRegex, 'Invalid mobile format. Use: xxxxxxxxxx (10 digits starting with 0)')
      .optional(),
    email: z.string()
      .regex(emailRegex, 'Invalid email address')
      .optional(),
    address: z.string().max(200, 'Address must be 200 characters or less').optional(),
  }).optional(),
});

// Medical Record validation
export const medicalRecordSchema = z.object({
  id: z.string().min(1, 'Record ID is required'),
  date: z.string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const recordDate = new Date(date);
      const today = new Date();
      return recordDate <= today;
    }, 'Date cannot be in the future'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  complaint: z.string().min(1, 'Complaint is required').max(500, 'Complaint must be 500 characters or less'),
  investigations: z.string().max(1000, 'Investigations must be 1000 characters or less').optional(),
  diagnosis: z.string().min(1, 'Diagnosis is required').max(500, 'Diagnosis must be 500 characters or less'),
  prescription: z.string().max(2000, 'Prescription must be 2000 characters or less').optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  documents: z.array(z.object({
    id: z.string().min(1, 'Document ID is required'),
    name: z.string().min(1, 'Document name is required').max(100, 'Document name must be 100 characters or less'),
    type: z.enum(['pdf', 'image'], { required_error: 'Document type is required' }),
    url: z.string().url('Invalid document URL'),
  })).optional(),
  isNew: z.boolean().optional(),
});

// Medication validation
export const medicationSchema = z.object({
  id: z.string().min(1, 'Medication ID is required'),
  name: z.string().min(1, 'Medication name is required').max(100, 'Name must be 100 characters or less'),
  strength: z.string().max(50, 'Strength must be 50 characters or less').optional(),
  dosage: z.string().min(1, 'Dosage is required').max(100, 'Dosage must be 100 characters or less'),
  frequency: z.string().min(1, 'Frequency is required').max(100, 'Frequency must be 100 characters or less'),
  timings: z.array(z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')).optional(),
  prescribedBy: z.string().max(100, 'Prescribed by must be 100 characters or less').optional(),
  startDate: z.string()
    .regex(dateRegex, 'Start date must be in YYYY-MM-DD format')
    .optional(),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

// Reminder validation
export const reminderSchema = z.object({
  id: z.string().min(1, 'Reminder ID is required'),
  type: z.enum(['appointment', 'medication'], { required_error: 'Reminder type is required' }),
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  date: z.string()
    .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const reminderDate = new Date(date);
      const today = new Date();
      return reminderDate >= today;
    }, 'Date cannot be in the past'),
  dueDate: z.string()
    .regex(dateRegex, 'Due date must be in YYYY-MM-DD format')
    .optional(),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  completed: z.boolean(),
  priority: z.enum(['high', 'medium', 'low'], { required_error: 'Priority is required' }),
});

// Validation functions
export const validatePatient = (data: unknown): Patient => {
  return patientSchema.parse(data);
};

export const validateDoctor = (data: unknown): Doctor => {
  return doctorSchema.parse(data);
};

export const validateMedicalRecord = (data: unknown): MedicalRecord => {
  return medicalRecordSchema.parse(data);
};

export const validateMedication = (data: unknown): Medication => {
  return medicationSchema.parse(data);
};

export const validateReminder = (data: unknown): Reminder => {
  return reminderSchema.parse(data);
};

// Safe validation functions that return Result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: z.ZodError;
}

export const safeValidatePatient = (data: unknown): ValidationResult<Patient> => {
  const result = patientSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : undefined,
    error: result.success ? undefined : result.error,
  };
};

export const safeValidateDoctor = (data: unknown): ValidationResult<Doctor> => {
  const result = doctorSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : undefined,
    error: result.success ? undefined : result.error,
  };
};

export const safeValidateMedicalRecord = (data: unknown): ValidationResult<MedicalRecord> => {
  const result = medicalRecordSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : undefined,
    error: result.success ? undefined : result.error,
  };
};

// Utility functions for error messages
export const getValidationErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });

  return errors;
};

export const getFirstValidationError = (error: z.ZodError): string => {
  return error.errors[0]?.message || 'Validation failed';
};

// Form field validation helpers
export const validateFormField = <T>(
  schema: z.ZodSchema<T>,
  field: string,
  value: unknown
): { isValid: boolean; error?: string } => {
  try {
    const fieldSchema = schema.shape[field as keyof typeof schema.shape];
    if (fieldSchema) {
      fieldSchema.parse(value);
    }
    return { isValid: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldError = err.errors.find(e => e.path[0] === field);
      return { isValid: false, error: fieldError?.message };
    }
    return { isValid: false, error: 'Validation failed' };
  }
};