import React, { useState, useEffect, memo } from 'react';
import type { Patient, Medication } from '../types';

interface MedicationModalProps {
    isOpen: boolean;
    medication: Medication | null; // null for adding new
    onSave: (medicationData: Omit<Medication, 'id'> | Medication) => void;
    onClose: () => void;
}

const MedicationModal: React.FC<MedicationModalProps> = ({ isOpen, medication, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        strength: '',
        dosage: '',
        frequency: 'Once daily',
        timings: [] as string[],
        prescribedBy: '',
        startDate: '',
        notes: '',
    });

    useEffect(() => {
        if (medication) {
            setFormData({
                name: medication.name || '',
                strength: medication.strength || '',
                dosage: medication.dosage || '',
                frequency: medication.frequency || 'Once daily',
                timings: medication.timings || [],
                prescribedBy: medication.prescribedBy || '',
                startDate: medication.startDate || '',
                notes: medication.notes || '',
            });
        } else {
             setFormData({
                name: '',
                strength: '',
                dosage: '',
                frequency: 'Once daily',
                timings: [],
                prescribedBy: '',
                startDate: new Date().toISOString().split('T')[0],
                notes: '',
            });
        }
    }, [medication, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value }));
    };

    const handleTimingChange = (index: number, value: string) => {
        const newTimings = [...formData.timings];
        newTimings[index] = value;
        setFormData(prev => ({ ...prev, timings: newTimings }));
    };

    const handleAddTiming = () => {
        setFormData(prev => ({ ...prev, timings: [...prev.timings, '09:00'] }));
    };

    const handleRemoveTiming = (index: number) => {
        setFormData(prev => ({ ...prev, timings: prev.timings.filter((_, i) => i !== index) }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.dosage.trim()) {
            alert('Medication name and dosage are required.');
            return;
        }
        if (medication) {
            onSave({ ...medication, ...formData });
        } else {
            onSave(formData);
        }
    };

    if (!isOpen) return null;
    
    const frequencyOptions = ["Once daily", "Twice daily", "Three times daily", "As needed", "Weekly", "Other"];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{medication ? 'Edit Medication' : 'Add New Medication'}</h3>
                    <button onClick={onClose} aria-label="Close medication form" className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Medication Name</label>
                            <input id="name" type="text" value={formData.name} onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm" required />
                        </div>
                        <div>
                            <label htmlFor="strength" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Strength (e.g., 500mg)</label>
                            <input id="strength" type="text" value={formData.strength} onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm" />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="dosage" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Dosage (e.g., 1 tablet)</label>
                            <input id="dosage" type="text" value={formData.dosage} onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm" required />
                        </div>
                        <div>
                            <label htmlFor="frequency" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Frequency</label>
                            <select id="frequency" value={formData.frequency} onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm">
                                {frequencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Specific Times</label>
                        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-border-light dark:border-border-dark">
                            {formData.timings.length > 0 ? formData.timings.map((time, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={(e) => handleTimingChange(index, e.target.value)}
                                        className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTiming(index)}
                                        className="p-2 text-subtle-light dark:text-subtle-dark hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                        title="Remove Time"
                                        aria-label={`Remove time slot ${index + 1}`}
                                    >
                                        <span className="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            )) : (
                                <p className="text-xs text-subtle-light dark:text-subtle-dark italic text-center py-1">No specific times set.</p>
                            )}
                            <button
                                type="button"
                                onClick={handleAddTiming}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-subtle-light dark:text-subtle-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors w-full justify-center"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Add Time
                            </button>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="prescribedBy" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Prescribed By (Optional)</label>
                            <input id="prescribedBy" type="text" value={formData.prescribedBy} onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm" />
                        </div>
                         <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Start Date (Optional)</label>
                            <input id="startDate" type="date" value={formData.startDate} onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm" />
                        </div>
                    </div>
                    <div>
                         <label htmlFor="notes" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Notes (Optional)</label>
                         <textarea id="notes" value={formData.notes} placeholder="e.g., Take with food" onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm" rows={2}></textarea>
                    </div>
                </form>
                 <div className="p-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-subtle-light dark:text-subtle-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-DEFAULT rounded-md hover:bg-primary-hover transition-colors">Save Medication</button>
                </div>
            </div>
        </div>
    );
};


interface CurrentMedicationsProps {
    patient: Patient;
    onAddMedication: (patientId: string, medication: Omit<Medication, 'id'>) => void;
    onUpdateMedication: (patientId: string, medication: Medication) => void;
    onDeleteMedication: (patientId: string, medicationId: string) => void;
    onRequestReminder: (medicationData: Omit<Medication, 'id'>) => void;
}

const CurrentMedications: React.FC<CurrentMedicationsProps> = memo(({ patient, onAddMedication, onUpdateMedication, onDeleteMedication, onRequestReminder }) => {
    const [modalState, setModalState] = useState<{ isOpen: boolean; medication: Medication | null }>({ isOpen: false, medication: null });

    const compactFrequency = (freq: string): string => {
        if (!freq) return '';
        const lowerFreq = freq.toLowerCase();
        if (lowerFreq.includes('once daily')) return '1x/day';
        if (lowerFreq.includes('twice daily')) return '2x/day';
        if (lowerFreq.includes('three times daily')) return '3x/day';
        if (lowerFreq.includes('as needed')) return 'PRN';
        if (lowerFreq.includes('weekly')) return '1x/wk';
        return freq;
    };

    const handleSave = (medicationData: Omit<Medication, 'id'> | Medication) => {
        if ('id' in medicationData) {
            onUpdateMedication(patient.id, medicationData);
        } else {
            onAddMedication(patient.id, medicationData);
            if (window.confirm(`Would you like to add a refill reminder for ${medicationData.name}?`)) {
                onRequestReminder(medicationData);
            }
        }
        setModalState({ isOpen: false, medication: null });
    };
    
    const handleDelete = (medicationId: string) => {
        onDeleteMedication(patient.id, medicationId);
    };

    const meds = patient.currentMedications || [];

    return (
        <div className="py-6 border-b border-border-light dark:border-border-dark">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-DEFAULT">pill</span>
                    <h4 className="text-lg font-semibold text-text-light dark:text-text-dark">Current Medications</h4>
                </div>
                <button 
                    onClick={() => setModalState({ isOpen: true, medication: null })}
                    disabled={modalState.isOpen} 
                    className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-secondary rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    <span>Add Medication</span>
                </button>
            </div>

            <div className="space-y-1">
                {meds.length > 0 ? (
                    meds.map(med => (
                       <div key={med.id} className="flex items-center justify-between gap-4 py-1 px-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-border-light dark:border-border-dark/50">
                            <div className="flex-1 flex flex-wrap items-center gap-x-2 text-sm">
                                <span className="font-bold text-base text-text-light dark:text-text-dark whitespace-nowrap">{med.name}</span>
                                
                                {med.strength && (
                                    <>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <span className="font-medium text-subtle-light dark:text-subtle-dark whitespace-nowrap">{med.strength}</span>
                                    </>
                                )}
                                
                                {med.dosage && (
                                    <>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <span className="text-subtle-light dark:text-subtle-dark whitespace-nowrap">{med.dosage}, {compactFrequency(med.frequency)}</span>
                                    </>
                                )}

                                {med.timings && med.timings.length > 0 && (
                                     <>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <span className="font-mono text-xs text-subtle-light dark:text-subtle-dark whitespace-nowrap">{med.timings.sort().join('-')}</span>
                                     </>
                                )}

                                {med.notes && (
                                    <>
                                        <span className="text-gray-300 dark:text-gray-600">|</span>
                                        <span className="italic text-subtle-light dark:text-subtle-dark whitespace-nowrap">{med.notes}</span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button onClick={() => setModalState({ isOpen: true, medication: med })} aria-label={`Edit medication: ${med.name}`} className="p-1.5 text-subtle-light dark:text-subtle-dark hover:text-primary-DEFAULT rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Edit Medication">
                                    <span className="material-symbols-outlined text-base">edit</span>
                                </button>
                                <button onClick={() => handleDelete(med.id)} aria-label={`Delete medication: ${med.name}`} className="p-1.5 text-subtle-light dark:text-subtle-dark hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Delete Medication">
                                    <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-sm text-subtle-light dark:text-subtle-dark py-6 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg">
                        No current medications listed.
                    </div>
                )}
            </div>

  
            <MedicationModal 
                isOpen={modalState.isOpen}
                medication={modalState.medication}
                onSave={handleSave}
                onClose={() => setModalState({ isOpen: false, medication: null })}
            />
        </div>
    );
});

CurrentMedications.displayName = 'CurrentMedications';

export default CurrentMedications;