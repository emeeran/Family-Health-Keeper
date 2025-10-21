import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Plus, Trash2, AlertCircle, Clock, Pill, Zap, Copy, ChevronDown, ChevronUp, Table, List, Download, Upload, X, User } from 'lucide-react';
import type { Medication, Doctor } from '../types';

interface BulkMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (medications: Omit<Medication, 'id'>[]) => void;
  editingMedications?: Medication[];
  doctors?: Doctor[];
}

// Enhanced medication database with combined name+strength format
const MEDICATION_DATABASE = [
  // Blood Pressure Medications
  { nameStrength: 'Lisinopril 10mg', name: 'Lisinopril', strength: '10mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'blood_pressure' },
  { nameStrength: 'Lisinopril 20mg', name: 'Lisinopril', strength: '20mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'blood_pressure' },
  { nameStrength: 'Amlodipine 5mg', name: 'Amlodipine', strength: '5mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'blood_pressure' },
  { nameStrength: 'Amlodipine 10mg', name: 'Amlodipine', strength: '10mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'blood_pressure' },
  { nameStrength: 'Metoprolol 25mg', name: 'Metoprolol', strength: '25mg', dosage: '1 tablet', frequency: 'Twice daily', timings: ['09:00', '21:00'], category: 'blood_pressure' },
  { nameStrength: 'Metoprolol 50mg', name: 'Metoprolol', strength: '50mg', dosage: '1 tablet', frequency: 'Twice daily', timings: ['09:00', '21:00'], category: 'blood_pressure' },
  { nameStrength: 'Hydrochlorothiazide 12.5mg', name: 'Hydrochlorothiazide', strength: '12.5mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'blood_pressure' },
  { nameStrength: 'Losartan 50mg', name: 'Losartan', strength: '50mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'blood_pressure' },

  // Diabetes Medications
  { nameStrength: 'Metformin 500mg', name: 'Metformin', strength: '500mg', dosage: '1 tablet', frequency: 'Twice daily', timings: ['09:00', '21:00'], category: 'diabetes' },
  { nameStrength: 'Metformin 1000mg', name: 'Metformin', strength: '1000mg', dosage: '1 tablet', frequency: 'Twice daily', timings: ['09:00', '21:00'], category: 'diabetes' },
  { nameStrength: 'Insulin Glargine 100U/ml', name: 'Insulin Glargine', strength: '100U/ml', dosage: '10 units', frequency: 'Once daily', timings: ['22:00'], category: 'diabetes' },
  { nameStrength: 'Glipizide 5mg', name: 'Glipizide', strength: '5mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'diabetes' },

  // Cholesterol Medications
  { nameStrength: 'Atorvastatin 20mg', name: 'Atorvastatin', strength: '20mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['21:00'], category: 'cholesterol' },
  { nameStrength: 'Atorvastatin 40mg', name: 'Atorvastatin', strength: '40mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['21:00'], category: 'cholesterol' },
  { nameStrength: 'Simvastatin 20mg', name: 'Simvastatin', strength: '20mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['21:00'], category: 'cholesterol' },
  { nameStrength: 'Rosuvastatin 10mg', name: 'Rosuvastatin', strength: '10mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['21:00'], category: 'cholesterol' },

  // Blood Thinners
  { nameStrength: 'Aspirin 81mg', name: 'Aspirin', strength: '81mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'blood_thinner' },
  { nameStrength: 'Aspirin 325mg', name: 'Aspirin', strength: '325mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'blood_thinner' },
  { nameStrength: 'Warfarin 5mg', name: 'Warfarin', strength: '5mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['18:00'], category: 'blood_thinner' },
  { nameStrength: 'Clopidogrel 75mg', name: 'Clopidogrel', strength: '75mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'blood_thinner' },

  // Stomach/GI Medications
  { nameStrength: 'Omeprazole 20mg', name: 'Omeprazole', strength: '20mg', dosage: '1 capsule', frequency: 'Once daily', timings: ['09:00'], category: 'stomach' },
  { nameStrength: 'Pantoprazole 40mg', name: 'Pantoprazole', strength: '40mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'stomach' },

  // Thyroid Medications
  { nameStrength: 'Levothyroxine 50mcg', name: 'Levothyroxine', strength: '50mcg', dosage: '1 tablet', frequency: 'Once daily', timings: ['07:00'], category: 'thyroid' },
  { nameStrength: 'Levothyroxine 75mcg', name: 'Levothyroxine', strength: '75mcg', dosage: '1 tablet', frequency: 'Once daily', timings: ['07:00'], category: 'thyroid' },
  { nameStrength: 'Levothyroxine 100mcg', name: 'Levothyroxine', strength: '100mcg', dosage: '1 tablet', frequency: 'Once daily', timings: ['07:00'], category: 'thyroid' },

  // Pain/Inflammation
  { nameStrength: 'Ibuprofen 400mg', name: 'Ibuprofen', strength: '400mg', dosage: '1 tablet', frequency: 'As needed (PRN)', timings: [], category: 'pain' },
  { nameStrength: 'Naproxen 500mg', name: 'Naproxen', strength: '500mg', dosage: '1 tablet', frequency: 'Twice daily', timings: ['09:00', '21:00'], category: 'pain' },
  { nameStrength: 'Acetaminophen 500mg', name: 'Acetaminophen', strength: '500mg', dosage: '2 tablets', frequency: 'As needed (PRN)', timings: [], category: 'pain' },

  // Mental Health
  { nameStrength: 'Sertraline 50mg', name: 'Sertraline', strength: '50mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'antidepressant' },
  { nameStrength: 'Sertraline 100mg', name: 'Sertraline', strength: '100mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'antidepressant' },
  { nameStrength: 'Escitalopram 10mg', name: 'Escitalopram', strength: '10mg', dosage: '1 tablet', frequency: 'Once daily', timings: ['09:00'], category: 'antidepressant' },
  { nameStrength: 'Alprazolam 0.5mg', name: 'Alprazolam', strength: '0.5mg', dosage: '1 tablet', frequency: 'As needed (PRN)', timings: [], category: 'antidepressant' },

  // Nerve Pain
  { nameStrength: 'Gabapentin 300mg', name: 'Gabapentin', strength: '300mg', dosage: '1 capsule', frequency: 'Three times daily', timings: ['08:00', '14:00', '20:00'], category: 'nerve_pain' },
  { nameStrength: 'Pregabalin 75mg', name: 'Pregabalin', strength: '75mg', dosage: '1 capsule', frequency: 'Twice daily', timings: ['09:00', '21:00'], category: 'nerve_pain' },

  // Respiratory
  { nameStrength: 'Albuterol 90mcg', name: 'Albuterol', strength: '90mcg', dosage: '2 puffs', frequency: 'As needed (PRN)', timings: [], category: 'inhaler' },
  { nameStrength: 'Fluticasone 110mcg', name: 'Fluticasone', strength: '110mcg', dosage: '2 puffs', frequency: 'Twice daily', timings: ['09:00', '21:00'], category: 'inhaler' },

  // Vitamins/Supplements
  { nameStrength: 'Vitamin D3 1000IU', name: 'Vitamin D3', strength: '1000IU', dosage: '1 capsule', frequency: 'Once daily', timings: ['09:00'], category: 'vitamin' },
  { nameStrength: 'Omega-3 1000mg', name: 'Omega-3', strength: '1000mg', dosage: '1 capsule', frequency: 'Once daily', timings: ['09:00'], category: 'vitamin' },
  { nameStrength: 'Calcium 500mg', name: 'Calcium', strength: '500mg', dosage: '1 tablet', frequency: 'Twice daily', timings: ['09:00', '21:00'], category: 'vitamin' },
];

// Quick patterns for fast entry
const QUICK_PATTERNS = [
  { name: 'Daily Morning', frequency: 'Once daily', timings: ['08:00'] },
  { name: 'Daily Evening', frequency: 'Once daily', timings: ['20:00'] },
  { name: 'Twice Daily', frequency: 'Twice daily', timings: ['08:00', '20:00'] },
  { name: 'Three Times Daily', frequency: 'Three times daily', timings: ['08:00', '14:00', '20:00'] },
  { name: 'With Meals', frequency: 'Three times daily', timings: ['08:00', '13:00', '19:00'] },
  { name: 'Bedtime Only', frequency: 'Once daily', timings: ['22:00'] },
];

// Generate 15-minute intervals for each hour
const generate15MinuteIntervals = (hours: string[]): string[] => {
  const intervals: string[] = [];
  hours.forEach(hour => {
    const [h] = hour.split(':').map(Number);
    intervals.push(
      `${h.toString().padStart(2, '0')}:00`,
      `${h.toString().padStart(2, '0')}:15`,
      `${h.toString().padStart(2, '0')}:30`,
      `${h.toString().padStart(2, '0')}:45`
    );
  });
  return intervals;
};

// Common timing options grouped by period with 15-minute intervals
const TIMING_GROUPS = {
  'Morning': generate15MinuteIntervals(['06', '07', '08', '09', '10']),
  'Afternoon': generate15MinuteIntervals(['12', '13', '14', '15', '16', '17']),
  'Evening': generate15MinuteIntervals(['18', '19', '20', '21']),
  'Night': generate15MinuteIntervals(['22', '23', '00', '01']),
};

const BulkMedicationModal: React.FC<BulkMedicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMedications = [],
  doctors = []
}) => {
  // Generate doctor options for dropdown with memoization
  const doctorOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];

    // Add existing doctors
    if (doctors && doctors.length > 0) {
      // Group doctors by specialty
      const doctorsBySpecialty = doctors.reduce((acc, doctor) => {
        const specialty = doctor.specialty || 'General Practice';
        if (!acc[specialty]) {
          acc[specialty] = [];
        }
        acc[specialty].push(doctor);
        return acc;
      }, {} as Record<string, Doctor[]>);

      // Add grouped doctors
      Object.entries(doctorsBySpecialty).forEach(([specialty, specialistDoctors]) => {
        options.push(
          ...specialistDoctors.map(doctor => ({
            value: doctor.id,
            label: `Dr. ${doctor.name} - ${specialty}`
          }))
        );
      });
    }

    // Add fallback common options if no doctors exist
    if (options.length === 0) {
      options.push(
        { value: 'dr-smith', label: 'Dr. Smith - Family Medicine' },
        { value: 'dr-jones', label: 'Dr. Jones - Cardiology' },
        { value: 'dr-williams', label: 'Dr. Williams - Internal Medicine' },
        { value: 'dr-brown', label: 'Dr. Brown - Endocrinology' },
        { value: 'dr-davis', label: 'Dr. Davis - Neurology' }
      );
    }

    return options;
  }, [doctors]);

  const [medications, setMedications] = useState([
    createEmptyMedication(doctorOptions)
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeView, setActiveView] = useState<'list' | 'table'>('table');
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [copiedMedication, setCopiedMedication] = useState<any>(null);
  const [showAutocomplete, setShowAutocomplete] = useState<{ row: number; field: string } | null>(null);
  const [filteredMeds, setFilteredMeds] = useState(MEDICATION_DATABASE);
  const tableRef = useRef<HTMLDivElement>(null);

  function createEmptyMedication(options: typeof doctorOptions) {
    return {
      name: '',
      strength: '',
      dosage: '',
      frequency: 'Once daily',
      timings: [] as string[],
      prescribedBy: options[0]?.value || '',
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    };
  }

  useEffect(() => {
    if (editingMedications.length > 0) {
      setMedications(editingMedications.map(med => ({
        name: med.name || '',
        strength: med.strength || '',
        dosage: med.dosage || '',
        frequency: med.frequency || 'Once daily',
        timings: med.timings || [],
        prescribedBy: med.prescribedBy || doctorOptions[0]?.value || '',
        startDate: med.startDate || new Date().toISOString().split('T')[0],
        notes: med.notes || '',
      })));
    } else if (isOpen) {
      setMedications([createEmptyMedication(doctorOptions)]);
    }
  }, [editingMedications, isOpen, doctorOptions]);

  const addMedicationRow = useCallback(() => {
    setMedications(prev => [...prev, createEmptyMedication(doctorOptions)]);
  }, [doctorOptions]);

  const removeMedicationRow = useCallback((index: number) => {
    if (medications.length > 1) {
      setMedications(prev => prev.filter((_, i) => i !== index));
      setErrors(prev => {
        const newErrors = { ...prev };
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith(`medication-${index}-`)) {
            delete newErrors[key];
          }
        });
        return newErrors;
      });
    }
  }, [medications.length]);

  const updateMedication = useCallback((index: number, field: string, value: any) => {
    setMedications(prev => {
      const newMeds = [...prev];
      newMeds[index] = { ...newMeds[index], [field]: value };
      return newMeds;
    });

    // Clear error for this field
    const errorKey = `medication-${index}-${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }

    // Auto-fill based on combined name+strength
    if (field === 'nameStrength' && value) {
      const matches = MEDICATION_DATABASE.filter(med =>
        med.nameStrength.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredMeds(matches);

      if (matches.length === 1) {
        // Exact match - auto-fill all fields
        const match = matches[0];
        setTimeout(() => {
          updateMedication(index, 'name', match.name);
          updateMedication(index, 'strength', match.strength);
          updateMedication(index, 'dosage', match.dosage);
          updateMedication(index, 'frequency', match.frequency);
          updateMedication(index, 'timings', match.timings);
        }, 100);
      }
    }
  }, [errors]);

  const applyPatternToSelected = useCallback((pattern: typeof QUICK_PATTERNS[0]) => {
    selectedCells.forEach(cellKey => {
      const [_, rowIndex] = cellKey.split('-');
      const index = parseInt(rowIndex);
      updateMedication(index, 'frequency', pattern.frequency);
      updateMedication(index, 'timings', pattern.timings);
    });
    setSelectedCells(new Set());
  }, [selectedCells, updateMedication]);

  const copyMedication = useCallback((index: number) => {
    setCopiedMedication(medications[index]);
  }, [medications]);

  const pasteMedication = useCallback((index: number) => {
    if (copiedMedication) {
      const pasted = { ...copiedMedication, name: copiedMedication.name + ' (Copy)' };
      setMedications(prev => {
        const newMeds = [...prev];
        newMeds[index] = pasted;
        return newMeds;
      });
    }
  }, [copiedMedication]);

  const duplicateRow = useCallback((index: number) => {
    const original = medications[index];
    const duplicate = { ...original, name: original.name + ' (Copy)' };
    setMedications(prev => {
      const newMeds = [...prev];
      newMeds.splice(index + 1, 0, duplicate);
      return newMeds;
    });
  }, [medications]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, field: string) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      // Navigate to next cell - skip strength since it's combined
      const fields = ['nameStrength', 'dosage', 'frequency', 'startDate', 'prescribedBy', 'notes'];
      const currentFieldIndex = fields.indexOf(field);
      const nextField = fields[(currentFieldIndex + 1) % fields.length];
      const nextInput = document.querySelector(`input[data-field="${nextField}"][data-row="${rowIndex}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    } else if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      addMedicationRow();
    } else if (e.key === 'Delete' && e.shiftKey) {
      e.preventDefault();
      removeMedicationRow(rowIndex);
    }
  }, [addMedicationRow, removeMedicationRow]);

  const handleCellClick = useCallback((rowIndex: number, field: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const cellKey = `${field}-${rowIndex}`;
      const newSelected = new Set(selectedCells);
      if (newSelected.has(cellKey)) {
        newSelected.delete(cellKey);
      } else {
        newSelected.add(cellKey);
      }
      setSelectedCells(newSelected);
    }
  }, [selectedCells]);

  const addTiming = useCallback((rowIndex: number, timing: string) => {
    const currentTimings = medications[rowIndex].timings || [];
    if (!currentTimings.includes(timing)) {
      updateMedication(rowIndex, 'timings', [...currentTimings, timing]);
    }
  }, [medications, updateMedication]);

  const removeTiming = useCallback((rowIndex: number, timingIndex: number) => {
    const currentTimings = medications[rowIndex].timings || [];
    const newTimings = currentTimings.filter((_, i) => i !== timingIndex);
    updateMedication(rowIndex, 'timings', newTimings);
  }, [medications, updateMedication]);

  const validateMedications = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    medications.forEach((med, index) => {
      if (!med.name.trim()) {
        newErrors[`medication-${index}-nameStrength`] = 'Required';
        isValid = false;
      }
      if (!med.dosage.trim()) {
        newErrors[`medication-${index}-dosage`] = 'Required';
        isValid = false;
      }
      if (!med.startDate) {
        newErrors[`medication-${index}-startDate`] = 'Required';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [medications]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validateMedications()) return;

    const validMedications = medications.filter(med =>
      med.name.trim() && med.dosage.trim()
    );

    if (validMedications.length === 0) {
      setErrors({ general: 'Please add at least one medication with name and dosage' });
      return;
    }

    onSave(validMedications);
    onClose();
  }, [medications, validateMedications, onSave, onClose]);

  const handleCSVImport = useCallback((e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        const importedMeds: Omit<Medication, 'id'>[] = [];

        lines.forEach((line, index) => {
          if (index === 0 && line.toLowerCase().includes('name')) return; // Skip header

          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          if (values.length >= 2 && values[0]) {
            const med = createEmptyMedication(doctorOptions);
            med.name = values[0];
            med.strength = values[1] || '';
            med.dosage = values[2] || '1 tablet';
            med.frequency = values[3] || 'Once daily';
            med.prescribedBy = doctorOptions[0]?.value || '';
            med.startDate = values[4] || new Date().toISOString().split('T')[0];
            med.notes = values[5] || '';

            // Set timings based on frequency
            if (med.frequency.includes('daily') && !med.frequency.includes('Twice') && !med.frequency.includes('Three')) {
              med.timings = ['09:00'];
            } else if (med.frequency.includes('Twice')) {
              med.timings = ['09:00', '21:00'];
            } else if (med.frequency.includes('Three')) {
              med.timings = ['08:00', '14:00', '20:00'];
            }

            importedMeds.push(med);
          }
        });

        if (importedMeds.length > 0) {
          setMedications([...medications, ...importedMeds]);
        }
      } catch (error) {
        console.error('Failed to import CSV:', error);
        alert('Failed to import CSV. Please check the format.');
      }
    };
    reader.readAsText(file);
  }, [medications, doctorOptions]);

  const commonFrequencies = [
    'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
    'Every 8 hours', 'Every 12 hours', 'Every 6 hours', 'As needed (PRN)', 'Weekly', 'Monthly'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-full w-full max-h-[98vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <Table className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingMedications.length > 0 ? 'Edit Medications' : 'Bulk Add Medications'}
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Enhanced spreadsheet-style entry with combined medication search
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500">
                {medications.filter(med => med.name.trim() && med.dosage.trim()).length} complete
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('table')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeView === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                }`}
              >
                <Table className="w-3 h-3 inline mr-1" />
                Table
              </button>
              <button
                onClick={() => setActiveView('list')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  activeView === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                }`}
              >
                <List className="w-3 h-3 inline mr-1" />
                List
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedCells.size > 0 && (
                <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded">
                  <span className="text-xs text-blue-700 dark:text-blue-300">
                    {selectedCells.size} selected
                  </span>
                  {QUICK_PATTERNS.slice(0, 3).map((pattern, index) => (
                    <button
                      key={index}
                      onClick={() => applyPatternToSelected(pattern)}
                      className="text-xs px-1.5 py-0.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {pattern.name}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.csv,.txt';
                  input.onchange = (e) => handleCSVImport(e);
                  input.click();
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                title="Import from CSV"
              >
                <Upload className="w-3 h-3" />
                Import
              </button>

              <button
                onClick={addMedicationRow}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Row
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
          {errors.general && (
            <div className="m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.general}</span>
              </div>
            </div>
          )}

          {/* Table View */}
          {activeView === 'table' && (
            <div className="overflow-auto" style={{ maxHeight: 'calc(98vh - 200px)' }}>
              <div ref={tableRef} className="min-w-[900px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-8">#</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 min-w-[200px]">Medication + Strength *</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-24">Dosage *</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-28">Frequency</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-40">Times</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-24">Start Date *</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-32">Prescribed By</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 min-w-[150px]">Notes</th>
                      <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((medication, index) => (
                      <tr
                        key={index}
                        className={`border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
                          index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-750/50'
                        }`}
                      >
                        <td className="px-2 py-1 text-gray-500 text-xs">{index + 1}</td>

                        {/* Combined Medication Name + Strength with autocomplete */}
                        <td className="px-2 py-1 relative">
                          <input
                            type="text"
                            data-field="nameStrength"
                            data-row={index}
                            value={`${medication.name} ${medication.strength}`.trim()}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Try to parse out name and strength
                              const match = value.match(/^(.+?)\s+(\d+[^a-z]*|[a-z]+)$/i);
                              if (match) {
                                updateMedication(index, 'name', match[1]);
                                updateMedication(index, 'strength', match[2]);
                                updateMedication(index, 'nameStrength', value);
                              } else {
                                updateMedication(index, 'nameStrength', value);
                                updateMedication(index, 'name', value);
                                updateMedication(index, 'strength', '');
                              }
                            }}
                            onFocus={() => setShowAutocomplete({ row: index, field: 'nameStrength' })}
                            onBlur={() => setTimeout(() => setShowAutocomplete(null), 200)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'nameStrength')}
                            onClick={(e) => handleCellClick(index, 'nameStrength', e)}
                            className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                              errors[`medication-${index}-nameStrength`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } ${
                              selectedCells.has(`nameStrength-${index}`) ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                            }`}
                            placeholder="e.g., Lisinopril 10mg, Metformin 500mg"
                          />
                          {showAutocomplete?.row === index && showAutocomplete?.field === 'nameStrength' && filteredMeds.length > 0 && (
                            <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                              {filteredMeds.slice(0, 8).map((med, medIndex) => (
                                <div
                                  key={medIndex}
                                  onClick={() => {
                                    updateMedication(index, 'name', med.name);
                                    updateMedication(index, 'strength', med.strength);
                                    updateMedication(index, 'dosage', med.dosage);
                                    updateMedication(index, 'frequency', med.frequency);
                                    updateMedication(index, 'timings', med.timings);
                                    updateMedication(index, 'nameStrength', med.nameStrength);
                                    setShowAutocomplete(null);
                                  }}
                                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900 dark:text-white">{med.nameStrength}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">{med.dosage} • {med.frequency} • {med.timings.join(', ') || 'No specific times'}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="px-2 py-1">
                          <input
                            type="text"
                            data-field="dosage"
                            data-row={index}
                            value={medication.dosage}
                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'dosage')}
                            onClick={(e) => handleCellClick(index, 'dosage', e)}
                            className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                              errors[`medication-${index}-dosage`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } ${
                              selectedCells.has(`dosage-${index}`) ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                            }`}
                            placeholder="1 tablet"
                          />
                        </td>

                        <td className="px-2 py-1">
                          <select
                            data-field="frequency"
                            data-row={index}
                            value={medication.frequency}
                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                            onClick={(e) => handleCellClick(index, 'frequency', e)}
                            className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                              selectedCells.has(`frequency-${index}`) ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                            }`}
                          >
                            {commonFrequencies.map(freq => (
                              <option key={freq} value={freq}>{freq}</option>
                            ))}
                          </select>
                        </td>

                        {/* Enhanced Time Selection with Dropdown */}
                        <td className="px-2 py-1">
                          <div className="flex flex-wrap gap-1 mb-1">
                            {medication.timings.map((timing, timingIndex) => (
                              <span
                                key={timingIndex}
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                              >
                                <Clock className="w-2.5 h-2.5" />
                                {timing}
                                <button
                                  type="button"
                                  onClick={() => removeTiming(index, timingIndex)}
                                  className="text-blue-600 hover:text-blue-800 ml-0.5"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  addTiming(index, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Add time...</option>
                              <optgroup label="Morning">
                                {TIMING_GROUPS['Morning'].map((timing) => (
                                  <option key={timing} value={timing}>{timing}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Afternoon">
                                {TIMING_GROUPS['Afternoon'].map((timing) => (
                                  <option key={timing} value={timing}>{timing}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Evening">
                                {TIMING_GROUPS['Evening'].map((timing) => (
                                  <option key={timing} value={timing}>{timing}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Night">
                                {TIMING_GROUPS['Night'].map((timing) => (
                                  <option key={timing} value={timing}>{timing}</option>
                                ))}
                              </optgroup>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const commonTimes = ['08:00', '12:00', '18:00', '22:00'];
                                commonTimes.forEach(time => addTiming(index, time));
                              }}
                              className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 rounded border border-green-200 dark:border-green-700 transition-colors"
                              title="Add common times (8AM, 12PM, 6PM, 10PM)"
                            >
                              Quick Add
                            </button>
                          </div>
                        </td>

                        <td className="px-2 py-1">
                          <input
                            type="date"
                            data-field="startDate"
                            data-row={index}
                            value={medication.startDate}
                            onChange={(e) => updateMedication(index, 'startDate', e.target.value)}
                            onClick={(e) => handleCellClick(index, 'startDate', e)}
                            className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                              errors[`medication-${index}-startDate`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                            } ${
                              selectedCells.has(`startDate-${index}`) ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                            }`}
                          />
                        </td>

                        {/* Enhanced Doctor Dropdown */}
                        <td className="px-2 py-1">
                          <select
                            data-field="prescribedBy"
                            data-row={index}
                            value={medication.prescribedBy}
                            onChange={(e) => updateMedication(index, 'prescribedBy', e.target.value)}
                            onClick={(e) => handleCellClick(index, 'prescribedBy', e)}
                            className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                              selectedCells.has(`prescribedBy-${index}`) ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                            }`}
                          >
                            <option value="">Select Doctor...</option>
                            {doctorOptions.length > 0 && (
                              <optgroup label="Existing Doctors">
                                {doctorOptions.map((doctor) => (
                                  <option key={doctor.value} value={doctor.value}>
                                    {doctor.label}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="Common Options">
                              <option value="pharmacy">Pharmacy/OTC</option>
                              <option value="self">Self-Medicated</option>
                              <option value="other">Other</option>
                            </optgroup>
                          </select>
                        </td>

                        <td className="px-2 py-1">
                          <input
                            type="text"
                            data-field="notes"
                            data-row={index}
                            value={medication.notes}
                            onChange={(e) => updateMedication(index, 'notes', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index, 'notes')}
                            onClick={(e) => handleCellClick(index, 'notes', e)}
                            className={`w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                              selectedCells.has(`notes-${index}`) ? 'bg-blue-100 dark:bg-blue-900/30' : ''
                            }`}
                            placeholder="Take with food..."
                          />
                        </td>

                        <td className="px-2 py-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => copyMedication(index)}
                              className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                              title="Copy medication"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {copiedMedication && (
                              <button
                                type="button"
                                onClick={() => pasteMedication(index)}
                                className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                title="Paste medication"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => duplicateRow(index)}
                              className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                              title="Duplicate row"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            {medications.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeMedicationRow(index)}
                                className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* List View (Compact) */}
          {activeView === 'list' && (
            <div className="overflow-auto" style={{ maxHeight: 'calc(98vh - 200px)' }}>
              <div className="p-4 space-y-2">
                {medications.map((medication, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                        <input
                          type="text"
                          value={`${medication.name} ${medication.strength}`.trim()}
                          onChange={(e) => {
                            const value = e.target.value;
                            const match = value.match(/^(.+?)\s+(\d+[^a-z]*|[a-z]+)$/i);
                            if (match) {
                              updateMedication(index, 'name', match[1]);
                              updateMedication(index, 'strength', match[2]);
                            } else {
                              updateMedication(index, 'name', value);
                              updateMedication(index, 'strength', '');
                            }
                          }}
                          className="px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Medication + Strength"
                        />
                        <input
                          type="text"
                          value={medication.dosage}
                          onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                          className="px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Dosage"
                        />
                        <select
                          value={medication.frequency}
                          onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                          className="px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          {commonFrequencies.map(freq => (
                            <option key={freq} value={freq}>{freq}</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={medication.startDate}
                          onChange={(e) => updateMedication(index, 'startDate', e.target.value)}
                          className="px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => duplicateRow(index)}
                          className="p-1 text-gray-500 hover:text-blue-600 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {medications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedicationRow(index)}
                            className="p-1 text-gray-500 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>Tab: Navigate cells</span>
              <span>Ctrl+Enter: Add row</span>
              <span>Shift+Delete: Remove row</span>
              <span>Ctrl+Click: Multi-select</span>
              <span>{MEDICATION_DATABASE.length} medications in database</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Pill className="w-4 h-4" />
                Save {medications.filter(med => med.name.trim() && med.dosage.trim()).length} Medications
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkMedicationModal;