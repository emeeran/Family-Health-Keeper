import type { Patient, Doctor } from './types';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const today = new Date();
const upcomingDate = new Date();
upcomingDate.setDate(today.getDate() + 5);
const overdueDate = new Date();
overdueDate.setDate(today.getDate() - 2);

export const DOCTORS: Doctor[] = [
  {
    id: 'doc1',
    name: 'Dr. Evelyn Reed',
    specialty: 'Cardiologist',
  },
  {
    id: 'doc2',
    name: 'Dr. Marcus Holloway',
    specialty: 'Pediatrician',
  },
  {
    id: 'doc3',
    name: 'Dr. Anya Sharma',
    specialty: 'Dermatologist',
  }
];


export const PATIENTS: Patient[] = [
  {
    id: 'p1',
    name: 'John Doe',
    hospitalIds: [{ id: 'hid1', hospitalName: 'General Hospital', patientId: '738492' }],
    avatarUrl: 'https://picsum.photos/id/1005/200/200',
    medicalHistory: 'Hypertension diagnosed in 2015, well-controlled with Lisinopril. No known allergies.',
    primaryDoctorId: 'doc1',
    records: [
      {
        id: 'r1-1',
        date: '2023-10-27',
        doctorId: 'doc1',
        complaint: 'Persistent cough and fatigue for one week.',
        investigations: 'Chest X-ray, Complete Blood Count (CBC).',
        diagnosis: 'Acute Bronchitis.',
        prescription: 'Amoxicillin 500mg TID for 7 days. Dextromethorphan syrup as needed.',
        notes: 'Advised patient to rest and increase fluid intake. Follow-up in one week or if symptoms worsen.',
        documents: [
          { id: 'd1', name: 'Blood Test Results.pdf', type: 'pdf', url: '#' },
          { id: 'd2', name: 'Chest X-ray Scan.jpg', type: 'image', url: '#' },
        ],
      },
      {
        id: 'r1-2',
        date: '2023-05-15',
        doctorId: 'doc1',
        complaint: 'Annual check-up.',
        investigations: 'Lipid panel, A1C.',
        diagnosis: 'Stable hypertension.',
        prescription: 'Continue Lisinopril 10mg daily.',
        notes: 'Blood pressure is well-controlled. Advised on maintaining a low-sodium diet.',
        documents: [],
      },
    ],
    reminders: [
      {
        id: 'rem1',
        type: 'appointment',
        title: 'Follow-up with Dr. Reed',
        date: formatDate(upcomingDate),
        dueDate: formatDate(new Date(upcomingDate.getTime() + 2 * 24 * 60 * 60 * 1000)), // Due 2 days after reminder
        time: '10:30',
        completed: false,
        priority: 'medium',
      },
      {
        id: 'rem2',
        type: 'medication',
        title: 'Refill Lisinopril',
        date: formatDate(overdueDate),
        dueDate: formatDate(new Date(overdueDate.getTime() + 1 * 24 * 60 * 60 * 1000)), // Due 1 day after reminder
        time: '09:00',
        completed: false,
        priority: 'high',
      },
       {
        id: 'rem3',
        type: 'medication',
        title: 'Pick up prescription',
        date: '2023-11-15',
        time: '14:00',
        completed: true,
        priority: 'low',
      },
    ],
    currentMedications: [
      { 
        id: 'med1', 
        name: 'Lisinopril', 
        strength: '10mg',
        dosage: '1 tablet',
        frequency: 'Once daily',
        timings: ['08:00'],
        prescribedBy: 'Dr. Evelyn Reed',
        startDate: '2015-06-01',
        notes: 'For hypertension' 
      },
    ],
    appointments: [
      {
        id: 'apt1',
        doctorId: 'doc1',
        patientId: 'p1',
        date: formatDate(upcomingDate),
        time: '10:30',
        duration: 30,
        type: 'followup',
        status: 'scheduled',
        reason: 'Hypertension follow-up checkup',
        notes: 'Regular blood pressure monitoring',
        location: 'General Hospital, Cardiology Wing',
        reminderSet: true,
        reminderTime: '1 day before',
        createdAt: new Date().toISOString(),
      },
    ]
  },
  {
    id: 'p2',
    name: 'Jane Smith',
    hospitalIds: [{ id: 'hid2', hospitalName: 'City Clinic', patientId: '849201' }],
    avatarUrl: 'https://picsum.photos/id/1027/200/200',
    medicalHistory: 'Type 2 Diabetes diagnosed in 2018, managed with Metformin and diet. Allergic to penicillin.',
    primaryDoctorId: 'doc1',
    records: [
      {
        id: 'r2-1',
        date: '2024-01-20',
        doctorId: 'doc1',
        complaint: 'Follow-up for diabetes management.',
        investigations: 'HbA1c, kidney function test.',
        diagnosis: 'Well-controlled Type 2 Diabetes.',
        prescription: 'Continue Metformin 1000mg BID.',
        notes: 'HbA1c at 6.8%. Patient is adherent to diet and exercise plan. Continue current management.',
        isNew: true,
        documents: [
           { id: 'd3', name: 'Lab Results Jan24.pdf', type: 'pdf', url: '#' },
        ],
      },
    ],
     reminders: [
       {
        id: 'rem4',
        type: 'appointment',
        title: 'Annual Eye Exam',
        date: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)), // 10 days from now
        time: '14:00',
        completed: false,
        priority: 'medium',
      },
    ],
    currentMedications: [
      { 
        id: 'med2', 
        name: 'Metformin',
        strength: '1000mg',
        dosage: '1 tablet',
        frequency: 'Twice daily',
        timings: ['08:30', '20:30'],
        prescribedBy: 'Dr. Evelyn Reed',
        startDate: '2018-03-12',
        notes: 'For Type 2 Diabetes. Take with meals.' 
      },
      { 
        id: 'med3', 
        name: 'Atorvastatin',
        strength: '20mg',
        dosage: '1 tablet',
        frequency: 'Once daily (evening)',
        timings: ['21:00'],
        startDate: '2020-01-15',
        notes: 'For high cholesterol' 
      },
    ],
    appointments: [
      {
        id: 'apt2',
        doctorId: 'doc1',
        patientId: 'p2',
        date: formatDate(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)),
        time: '14:00',
        duration: 45,
        type: 'checkup',
        status: 'scheduled',
        reason: 'Annual diabetic eye examination',
        notes: 'Bring previous eye exam reports',
        location: 'City Clinic, Ophthalmology Department',
        reminderSet: true,
        reminderTime: '2 days before',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'apt3',
        doctorId: 'doc1',
        patientId: 'p2',
        date: '2024-01-15',
        time: '09:00',
        duration: 30,
        type: 'consultation',
        status: 'completed',
        reason: 'Diabetes management consultation',
        notes: 'Adjusted medication dosage',
        location: 'General Hospital',
        reminderSet: false,
        createdAt: '2024-01-10T10:00:00.000Z',
      },
    ]
  },
];