import React, { useState, useEffect } from 'react';
import type { Patient, HospitalId, Doctor } from '../types';

interface PatientEditModalProps {
    isOpen: boolean;
    patient: Patient | null;
    onSave: (patientData: Patient) => void;
    onClose: () => void;
    doctors: Doctor[];
}

const PatientEditModal: React.FC<PatientEditModalProps> = ({ isOpen, patient, onSave, onClose, doctors }) => {
    const [formData, setFormData] = useState<Patient | null>(null);

    useEffect(() => {
        if (patient) {
            setFormData(patient);
        } else {
            setFormData(null);
        }
    }, [patient, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => prev ? { ...prev, [id]: value } : null);
    };

    const handleHospitalIdChange = (index: number, field: 'hospitalName' | 'patientId', value: string) => {
        setFormData(prev => {
            if (!prev) return null;
            const newHospitalIds = [...prev.hospitalIds];
            if(newHospitalIds[index]) {
                newHospitalIds[index] = { ...newHospitalIds[index], [field]: value };
            }
            return { ...prev, hospitalIds: newHospitalIds };
        });
    };

    const handleAddHospitalId = () => {
        setFormData(prev => {
            if (!prev) return null;
            const newId: HospitalId = {
                id: `hid-${Date.now()}-${Math.random()}`,
                hospitalName: '',
                patientId: '',
            };
            return { ...prev, hospitalIds: [...(prev.hospitalIds || []), newId] };
        });
    };

    const handleRemoveHospitalId = (index: number) => {
        setFormData(prev => {
            if (!prev) return null;
            const newHospitalIds = (prev.hospitalIds || []).filter((_, i) => i !== index);
            return { ...prev, hospitalIds: newHospitalIds };
        });
    };


    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData && formData.name.trim()) {
             const allHospitalIdsAreValidOrEmpty = formData.hospitalIds.every(hid => 
                (hid.hospitalName.trim() && hid.patientId.trim()) || 
                (!hid.hospitalName.trim() && !hid.patientId.trim())
            );

            if (!allHospitalIdsAreValidOrEmpty) {
                alert("Please fill in both Hospital Name and Patient ID for each entry, or remove incomplete entries.");
                return;
            }

            onSave({ ...formData, hospitalIds: formData.hospitalIds.filter(hid => hid.hospitalName.trim() && hid.patientId.trim()) });

        } else {
            alert("Name is required.");
        }
    };

    if (!isOpen || !formData) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Edit Person Details</h3>
                    <button onClick={onClose} aria-label="Close edit person form" className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto @container">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Full Name</label>
                            <input id="name" type="text" value={formData.name} onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm" required />
                        </div>
                        <div>
                            <label htmlFor="avatarUrl" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Avatar Image URL</label>
                            <input id="avatarUrl" type="text" value={formData.avatarUrl} onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm" />
                        </div>
                    </div>

                     <div>
                        <label htmlFor="primaryDoctorId" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Primary Care Physician</label>
                        <select
                            id="primaryDoctorId"
                            value={formData.primaryDoctorId || ''}
                            onChange={handleChange}
                            className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm"
                        >
                            <option value="">-- Select a Doctor --</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialty}</option>
                            ))}
                        </select>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Hospital IDs</label>
                        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-border-light dark:border-border-dark">
                            {(formData.hospitalIds && formData.hospitalIds.length > 0) ? formData.hospitalIds.map((hid, index) => (
                                <div key={hid.id} className="grid grid-cols-1 @[25rem]:grid-cols-[1fr,1fr,auto] gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Hospital Name"
                                        value={hid.hospitalName}
                                        onChange={(e) => handleHospitalIdChange(index, 'hospitalName', e.target.value)}
                                        className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm"
                                        aria-label="Hospital Name"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Patient ID"
                                        value={hid.patientId}
                                        onChange={(e) => handleHospitalIdChange(index, 'patientId', e.target.value)}
                                        className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm"
                                        aria-label="Patient ID"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveHospitalId(index)}
                                        className="p-2 text-subtle-light dark:text-subtle-dark hover:text-red-500 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 justify-self-end"
                                        title="Remove Hospital ID"
                                        aria-label={`Remove hospital ID entry ${index + 1}`}
                                    >
                                        <span className="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            )) : (
                                <p className="text-xs text-subtle-light dark:text-subtle-dark italic text-center py-1">No hospital IDs added.</p>
                            )}
                            <button
                                type="button"
                                onClick={handleAddHospitalId}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-subtle-light dark:text-subtle-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors w-full justify-center"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Add Hospital ID
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="medicalHistory" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Medical History</label>
                        <textarea id="medicalHistory" value={formData.medicalHistory} onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm" rows={4}></textarea>
                    </div>
                </form>
                <div className="p-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-subtle-light dark:text-subtle-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-DEFAULT rounded-md hover:bg-primary-hover transition-colors">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default PatientEditModal;