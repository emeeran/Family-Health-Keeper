-- Family Health Keeper Database Schema
-- PostgreSQL Schema Version 1.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS medications CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'doctor')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Sessions table for authentication
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    device_info TEXT,
    ip_address INET,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Doctors table
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    hospital_affiliation TEXT,
    license_number VARCHAR(100),
    years_experience INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
    blood_type VARCHAR(10),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    primary_doctor_id UUID REFERENCES doctors(id),
    avatar_url TEXT,
    medical_history TEXT,
    allergies TEXT,
    family_medical_history TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospital IDs for patients (many-to-many relationship)
CREATE TABLE patient_hospital_ids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_patient_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, hospital_name, hospital_patient_id)
);

-- Medical records table
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id),
    record_date DATE NOT NULL,
    complaint TEXT,
    symptoms TEXT,
    investigations TEXT,
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT,
    follow_up_date DATE,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table for medical record attachments
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx')),
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
    location VARCHAR(255),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medications table
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    route VARCHAR(50) DEFAULT 'oral' CHECK (route IN ('oral', 'topical', 'injection', 'inhalation', 'other')),
    start_date DATE NOT NULL,
    end_date DATE,
    prescribed_by UUID REFERENCES doctors(id),
    instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reminders table
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('medication', 'appointment', 'follow-up', 'other')),
    is_completed BOOLEAN DEFAULT false,
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_primary_doctor ON patients(primary_doctor_id);

CREATE INDEX idx_doctors_name ON doctors(name);
CREATE INDEX idx_doctors_specialty ON doctors(specialty);

CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX idx_medical_records_date ON medical_records(record_date);

CREATE INDEX idx_documents_medical_record_id ON documents(medical_record_id);

CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

CREATE INDEX idx_medications_patient_id ON medications(patient_id);
CREATE INDEX idx_medications_active ON medications(is_active);

CREATE INDEX idx_reminders_patient_id ON reminders(patient_id);
CREATE INDEX idx_reminders_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_completed ON reminders(is_completed);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (id, email, username, password_hash, first_name, last_name, role, is_active, email_verified) VALUES
('user_admin_001', 'emeeranjp@gmail.com', 'emeeranjp', '$2b$10$placeholder_hash_for_development', 'Admin', 'User', 'admin', true, true);

INSERT INTO doctors (id, name, specialty, phone, email) VALUES
('doc_001', 'Dr. Evelyn Reed', 'Cardiologist', '555-0101', 'evelyn.reed@cardio.com'),
('doc_002', 'Dr. Marcus Holloway', 'Pediatrician', '555-0102', 'marcus.holloway@pediatrics.com'),
('doc_003', 'Dr. Anya Sharma', 'Dermatologist', '555-0103', 'anya.sharma@dermatology.com');

-- Insert sample patients
INSERT INTO patients (id, user_id, name, date_of_birth, gender, primary_doctor_id, medical_history, allergies) VALUES
('pat_001', 'user_admin_001', 'John Doe', '1980-05-15', 'male', 'doc_001', 'Hypertension diagnosed in 2015, well-controlled with medication', 'Penicillin'),
('pat_002', 'user_admin_001', 'Jane Doe', '1985-08-22', 'female', 'doc_002', 'No significant medical history', 'None known');

-- Insert sample hospital IDs
INSERT INTO patient_hospital_ids (patient_id, hospital_name, hospital_patient_id) VALUES
('pat_001', 'General Hospital', '738492'),
('pat_002', 'City Medical Center', '845621');

-- Insert sample medical records
INSERT INTO medical_records (id, patient_id, doctor_id, record_date, complaint, diagnosis, prescription, notes) VALUES
('rec_001', 'pat_001', 'doc_001', '2023-10-27', 'Persistent cough and fatigue for one week', 'Acute Bronchitis', 'Amoxicillin 500mg TID for 7 days. Dextromethorphan syrup as needed.', 'Patient advised to rest and increase fluid intake. Follow-up in one week.'),
('rec_002', 'pat_002', 'doc_002', '2023-09-15', 'Annual checkup', 'Healthy', 'No medication needed', 'All vaccinations up to date. Continue regular checkups.');

-- Insert sample medications
INSERT INTO medications (id, patient_id, name, dosage, frequency, start_date, prescribed_by, instructions, is_active) VALUES
('med_001', 'pat_001', 'Lisininopril', '10mg', 'Once daily', '2023-01-01', 'doc_001', 'Take in the morning with food', true),
('med_002', 'pat_001', 'Amoxicillin', '500mg', 'Three times daily', '2023-10-27', 'doc_001', 'Complete full course even if feeling better', false);

-- Insert sample appointments
INSERT INTO appointments (id, patient_id, doctor_id, title, description, appointment_date, status, location) VALUES
('apt_001', 'pat_001', 'doc_001', 'Cardiology Follow-up', 'Regular checkup for hypertension management', '2023-11-15 10:00:00+00', 'scheduled', 'Heart Medical Center, Room 301'),
('apt_002', 'pat_002', 'doc_002', 'Annual Physical', 'Yearly health examination', '2023-12-01 14:00:00+00', 'scheduled', 'Pediatrics Clinic');

-- Insert sample reminders
INSERT INTO reminders (id, patient_id, title, description, reminder_date, reminder_type, is_completed) VALUES
('rem_001', 'pat_001', 'Take Lisinopril', 'Morning blood pressure medication', '2023-11-01 08:00:00+00', 'medication', false),
('rem_002', 'pat_001', 'Cardiology Appointment', 'Follow-up with Dr. Reed', '2023-11-15 09:30:00+00', 'appointment', false);