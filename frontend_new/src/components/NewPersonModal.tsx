import React, { useState } from 'react';
import type { Doctor, HospitalId } from '../types';

interface NewPersonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (patientData: Omit<any, 'id' | 'records' | 'reminders' | 'currentMedications'>) => void;
    doctors: Doctor[];
    initialData?: Omit<any, 'id' | 'records' | 'reminders' | 'currentMedications'>;
    isEditMode?: boolean;
}

const NewPersonModal: React.FC<NewPersonModalProps> = ({
    isOpen,
    onClose,
    onSave,
    doctors,
    initialData,
    isEditMode = false
}) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        dateOfBirth: initialData?.dateOfBirth || '',
        gender: initialData?.gender || '',
        bloodType: initialData?.bloodType || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        emergencyContact: initialData?.emergencyContact || '',
        allergies: initialData?.allergies || '',
        medicalHistory: initialData?.medicalHistory || '',
        primaryDoctorId: initialData?.primaryDoctorId || doctors[0]?.id || '',
        hospitalIds: initialData?.hospitalIds || [] as HospitalId[]
    });

    const [newHospitalId, setNewHospitalId] = useState({
        hospitalName: '',
        patientId: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddHospitalId = () => {
        if (newHospitalId.hospitalName && newHospitalId.patientId) {
            setFormData(prev => ({
                ...prev,
                hospitalIds: [...prev.hospitalIds, { ...newHospitalId, id: `hid-${Date.now()}` }]
            }));
            setNewHospitalId({ hospitalName: '', patientId: '' });
        }
    };

    const handleRemoveHospitalId = (id: string) => {
        setFormData(prev => ({
            ...prev,
            hospitalIds: prev.hospitalIds.filter(hid => hid.id !== id)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Generate avatar URL based on name (only for new records)
        const avatarUrl = isEditMode ? (initialData as any)?.avatarUrl : `https://picsum.photos/seed/${formData.name.replace(/\s+/g, '-')}-${Date.now()}/200/200`;

        onSave({
            ...formData,
            avatarUrl
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
                            {isEditMode ? 'Edit Family Member' : 'Add New Family Member'}
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
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark border-b border-border-light dark:border-border-dark pb-2">
                                Basic Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="name">
                                        Full Name *
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter full name"
                                        className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="dateOfBirth">
                                        Date of Birth
                                    </label>
                                    <input
                                        id="dateOfBirth"
                                        name="dateOfBirth"
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="gender">
                                        Gender
                                    </label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="bloodType">
                                        Blood Type
                                    </label>
                                    <select
                                        id="bloodType"
                                        name="bloodType"
                                        value={formData.bloodType}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                    >
                                        <option value="">Select Blood Type</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark border-b border-border-light dark:border-border-dark pb-2">
                                Contact Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="phone">
                                        Phone Number
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="(555) 123-4567"
                                        className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="email">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="email@example.com"
                                        className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="emergencyContact">
                                        Emergency Contact
                                    </label>
                                    <input
                                        id="emergencyContact"
                                        name="emergencyContact"
                                        type="text"
                                        value={formData.emergencyContact}
                                        onChange={handleInputChange}
                                        placeholder="Name and phone number of emergency contact"
                                        className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Medical Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark border-b border-border-light dark:border-border-dark pb-2">
                                Medical Information
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="allergies">
                                    Allergies
                                </label>
                                <textarea
                                    id="allergies"
                                    name="allergies"
                                    value={formData.allergies}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="List any known allergies (medications, food, environmental, etc.)"
                                    className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="medicalHistory">
                                    Medical History
                                </label>
                                <textarea
                                    id="medicalHistory"
                                    name="medicalHistory"
                                    value={formData.medicalHistory}
                                    onChange={handleInputChange}
                                    rows={4}
                                    required
                                    placeholder="Provide a brief medical history including chronic conditions, past surgeries, family history, etc."
                                    className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2" htmlFor="primaryDoctorId">
                                    Primary Care Physician
                                </label>
                                <select
                                    id="primaryDoctorId"
                                    name="primaryDoctorId"
                                    value={formData.primaryDoctorId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                >
                                    <option value="">Select Primary Doctor</option>
                                    {doctors.map(doctor => (
                                        <option key={doctor.id} value={doctor.id}>
                                            Dr. {doctor.name} ({doctor.specialty})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Hospital IDs */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text-light dark:text-text-dark border-b border-border-light dark:border-border-dark pb-2">
                                Hospital Identification Numbers
                            </h3>

                            <div className="space-y-3">
                                {formData.hospitalIds.map((hid) => (
                                    <div key={hid.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                        <div>
                                            <span className="font-medium">{hid.hospitalName}:</span>
                                            <span className="ml-2">{hid.patientId}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveHospitalId(hid.id)}
                                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>
                                ))}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Hospital Name"
                                        value={newHospitalId.hospitalName}
                                        onChange={(e) => setNewHospitalId(prev => ({ ...prev, hospitalName: e.target.value }))}
                                        className="px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Patient ID"
                                        value={newHospitalId.patientId}
                                        onChange={(e) => setNewHospitalId(prev => ({ ...prev, patientId: e.target.value }))}
                                        className="px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddHospitalId}
                                        disabled={!newHospitalId.hospitalName || !newHospitalId.patientId}
                                        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
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
                                {isEditMode ? 'Update Family Member' : 'Add Family Member'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewPersonModal;