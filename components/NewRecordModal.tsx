import React, { useState } from 'react';
import type { Doctor } from '../types';

interface NewRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recordData: {
        date: string;
        doctorId: string;
        complaint: string;
        investigations: string;
        diagnosis: string;
        prescription: string;
        notes: string;
    }) => void;
    doctors: Doctor[];
    patientName: string;
    initialData?: {
        date: string;
        doctorId: string;
        complaint: string;
        investigations: string;
        diagnosis: string;
        prescription: string;
        notes: string;
    };
    isEditMode?: boolean;
}

const NewRecordModal: React.FC<NewRecordModalProps> = ({
    isOpen,
    onClose,
    onSave,
    doctors,
    patientName,
    initialData,
    isEditMode = false
}) => {
    const [formData, setFormData] = useState({
        date: initialData?.date || new Date().toISOString().split('T')[0],
        doctorId: initialData?.doctorId || doctors[0]?.id || '',
        complaint: initialData?.complaint || '',
        investigations: initialData?.investigations || '',
        diagnosis: initialData?.diagnosis || '',
        prescription: initialData?.prescription || '',
        notes: initialData?.notes || ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                            {isEditMode ? 'Edit Medical Record' : 'New Medical Record'} for {patientName}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-subtle-light dark:text-subtle-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
                            aria-label="Close modal"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="date">
                                    Date *
                                </label>
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="doctorId">
                                    Attending Doctor *
                                </label>
                                <select
                                    id="doctorId"
                                    name="doctorId"
                                    value={formData.doctorId}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                >
                                    <option value="">-- Select a Doctor --</option>
                                    {doctors.map(doctor => (
                                        <option key={doctor.id} value={doctor.id}>
                                            {doctor.name} ({doctor.specialty})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="complaint">
                                Chief Complaint *
                            </label>
                            <input
                                id="complaint"
                                name="complaint"
                                type="text"
                                value={formData.complaint}
                                onChange={handleInputChange}
                                required
                                placeholder="Describe the main reason for visit..."
                                className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="investigations">
                                    Investigations
                                </label>
                                <textarea
                                    id="investigations"
                                    name="investigations"
                                    value={formData.investigations}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="Laboratory tests, imaging, etc..."
                                    className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="diagnosis">
                                    Diagnosis *
                                </label>
                                <textarea
                                    id="diagnosis"
                                    name="diagnosis"
                                    value={formData.diagnosis}
                                    onChange={handleInputChange}
                                    rows={3}
                                    required
                                    placeholder="Diagnosis and assessment..."
                                    className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="prescription">
                                Prescription
                            </label>
                            <textarea
                                id="prescription"
                                name="prescription"
                                value={formData.prescription}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="Medications, dosage, instructions..."
                                className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="notes">
                                Additional Notes
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="Any additional observations or notes..."
                                className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-border-light dark:border-border-dark">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-text-light dark:text-text-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors border-2 border-green-400"
                                style={{fontWeight: 'bold'}}
                            >
                                {isEditMode ? 'Update Record' : 'Create Record'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewRecordModal;