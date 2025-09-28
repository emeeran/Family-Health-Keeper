import React, { useState, useEffect } from 'react';
import type { Doctor } from '../types';

interface DoctorEditModalProps {
    isOpen: boolean;
    doctor: Doctor | null; // null for adding new
    onSave: (doctorData: Omit<Doctor, 'id'> | Doctor) => void;
    onClose: () => void;
}

const DoctorEditModal: React.FC<DoctorEditModalProps> = ({ isOpen, doctor, onSave, onClose }) => {
    const [formData, setFormData] = useState({ name: '', specialty: '' });

    useEffect(() => {
        if (doctor) {
            setFormData({ name: doctor.name, specialty: doctor.specialty });
        } else {
            setFormData({ name: '', specialty: '' });
        }
    }, [doctor, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.specialty.trim()) {
            alert('Doctor name and specialty are required.');
            return;
        }
        if (doctor) {
            onSave({ ...doctor, ...formData });
        } else {
            onSave(formData);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl w-full max-w-lg flex flex-col">
                <div className="p-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{doctor ? 'Edit Doctor' : 'Add New Doctor'}</h3>
                    <button onClick={onClose} aria-label="Close doctor form" className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Full Name</label>
                        <input id="name" type="text" value={formData.name} onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm" required />
                    </div>
                    <div>
                        <label htmlFor="specialty" className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">Specialty</label>
                        <input id="specialty" type="text" value={formData.specialty} onChange={handleChange} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT text-sm" required />
                    </div>
                </form>
                <div className="p-4 border-t border-border-light dark:border-border-dark flex items-center justify-end gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-subtle-light dark:text-subtle-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-DEFAULT rounded-md hover:bg-primary-hover transition-colors">Save Doctor</button>
                </div>
            </div>
        </div>
    );
};

export default DoctorEditModal;