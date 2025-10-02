import React, { useState } from 'react';
import type { Patient } from '../types';
import type { CompressionResult } from '../utils/imageCompression';
import { ImageUpload } from './ui/ImageUpload';

interface PatientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: Partial<Patient>) => void;
  editData?: Patient | null;
}

const PatientFormModal: React.FC<PatientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editData,
}) => {
  const [formData, setFormData] = useState({
    name: editData?.name || '',
    dateOfBirth: editData?.dateOfBirth || '',
    gender: editData?.gender || '',
    medicalHistory: editData?.medicalHistory || '',
    allergies: editData?.allergies?.join(', ') || '',
    conditions: editData?.conditions?.join(', ') || '',
    familyMedicalHistory: editData?.familyMedicalHistory || '',
  });

  const [medicalImages, setMedicalImages] = useState<CompressionResult[]>(editData?.medicalImages || []);

  const [surgeryInputs, setSurgeryInputs] = useState(
    editData?.surgeries?.map(s => `${s.type}|${s.date}|${s.notes || ''}`) || ['']
  );

  const [notableEventInputs, setNotableEventInputs] = useState(
    editData?.notableEvents?.map(e => `${e.type}|${e.date}|${e.description || ''}`) || ['']
  );

  const [hospitalIdInputs, setHospitalIdInputs] = useState(
    editData?.hospitalIds?.map(h => `${h.hospitalName}|${h.patientId}`) || ['']
  );

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const surgeries = surgeryInputs
      .filter(input => input.trim())
      .map(input => {
        const [type, date, notes] = input.split('|').map(s => s.trim());
        return { type, date, notes: notes || undefined };
      });

    const notableEvents = notableEventInputs
      .filter(input => input.trim())
      .map(input => {
        const [type, date, description] = input.split('|').map(s => s.trim());
        return { type, date, description: description || undefined };
      });

    const hospitalIds = hospitalIdInputs
      .filter(input => input.trim())
      .map(input => {
        const [hospitalName, patientId] = input.split('|').map(s => s.trim());
        return {
          id: `hid-${Date.now()}-${Math.random()}`,
          hospitalName,
          patientId
        };
      });

    const patientData: Partial<Patient> = {
      name: formData.name,
      dateOfBirth: formData.dateOfBirth || undefined,
      gender: formData.gender as 'male' | 'female' | 'other' | undefined,
      medicalHistory: formData.medicalHistory,
      allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()).filter(a => a) : undefined,
      conditions: formData.conditions ? formData.conditions.split(',').map(c => c.trim()).filter(c => c) : undefined,
      surgeries: surgeries.length > 0 ? surgeries : undefined,
      notableEvents: notableEvents.length > 0 ? notableEvents : undefined,
      hospitalIds: hospitalIds.length > 0 ? hospitalIds : [],
      medicalImages: medicalImages.length > 0 ? medicalImages : undefined,
      familyMedicalHistory: formData.familyMedicalHistory || undefined,
    };

    onSave(patientData);
    onClose();
  };

  const addSurgeryInput = () => {
    setSurgeryInputs([...surgeryInputs, '']);
  };

  const updateSurgeryInput = (index: number, value: string) => {
    const newInputs = [...surgeryInputs];
    newInputs[index] = value;
    setSurgeryInputs(newInputs);
  };

  const handleImageCompressed = (result: CompressionResult) => {
    setMedicalImages(prev => [...prev, result]);
  };

  const handleImagesCompressed = (results: CompressionResult[]) => {
    setMedicalImages(prev => [...prev, ...results]);
  };

  const removeMedicalImage = (index: number) => {
    setMedicalImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeSurgeryInput = (index: number) => {
    if (surgeryInputs.length > 1) {
      setSurgeryInputs(surgeryInputs.filter((_, i) => i !== index));
    }
  };

  const addNotableEventInput = () => {
    setNotableEventInputs([...notableEventInputs, '']);
  };

  const updateNotableEventInput = (index: number, value: string) => {
    const newInputs = [...notableEventInputs];
    newInputs[index] = value;
    setNotableEventInputs(newInputs);
  };

  const removeNotableEventInput = (index: number) => {
    if (notableEventInputs.length > 1) {
      setNotableEventInputs(notableEventInputs.filter((_, i) => i !== index));
    }
  };

  const addHospitalIdInput = () => {
    setHospitalIdInputs([...hospitalIdInputs, '']);
  };

  const updateHospitalIdInput = (index: number, value: string) => {
    const newInputs = [...hospitalIdInputs];
    newInputs[index] = value;
    setHospitalIdInputs(newInputs);
  };

  const removeHospitalIdInput = (index: number) => {
    if (hospitalIdInputs.length > 1) {
      setHospitalIdInputs(hospitalIdInputs.filter((_, i) => i !== index));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto animate-scale-in">
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">person_add</span>
              {editData ? 'Edit Member' : 'Add New Member'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 p-4 rounded-lg border border-blue-100 dark:border-gray-600">
              <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">badge</span>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>


            {/* Medical History */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 p-4 rounded-lg border border-green-100 dark:border-gray-600">
              <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">medical_information</span>
                Medical Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Medical History
                  </label>
                  <textarea
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
                    rows={2}
                    placeholder="Brief medical background..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Family Medical History
                  </label>
                  <textarea
                    value={formData.familyMedicalHistory}
                    onChange={(e) => setFormData({...formData, familyMedicalHistory: e.target.value})}
                    rows={2}
                    placeholder="Family health background..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Allergies
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                    placeholder="e.g., Penicillin, Peanuts"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Chronic Conditions
                  </label>
                  <input
                    type="text"
                    value={formData.conditions}
                    onChange={(e) => setFormData({...formData, conditions: e.target.value})}
                    placeholder="e.g., Diabetes, Hypertension"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Hospital IDs */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-700 p-4 rounded-lg border border-indigo-100 dark:border-gray-600">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">local_hospital</span>
                  Hospital IDs
                </h3>
                <button
                  type="button"
                  onClick={addHospitalIdInput}
                  className="px-3 py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 text-xs flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Hospital ID
                </button>
              </div>
              <div className="space-y-2">
                {hospitalIdInputs.map((hospitalId, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end p-2 bg-white dark:bg-gray-800/50 rounded-md">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Hospital Name
                      </label>
                      <input
                        type="text"
                        value={hospitalId.split('|')[0] || ''}
                        onChange={(e) => updateHospitalIdInput(index, `${e.target.value}|${hospitalId.split('|')[1] || ''}`)}
                        placeholder="Hospital name"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Patient ID
                      </label>
                      <input
                        type="text"
                        value={hospitalId.split('|')[1] || ''}
                        onChange={(e) => updateHospitalIdInput(index, `${hospitalId.split('|')[0] || ''}|${e.target.value}`)}
                        placeholder="Patient ID"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHospitalIdInput(index)}
                      disabled={hospitalIdInputs.length === 1}
                      className="px-2 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Surgeries */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-gray-700 dark:to-gray-700 p-4 rounded-lg border border-purple-100 dark:border-gray-600">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">medical_services</span>
                  Surgical History
                </h3>
                <button
                  type="button"
                  onClick={addSurgeryInput}
                  className="px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-xs flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Surgery
                </button>
              </div>
              <div className="space-y-2">
                {surgeryInputs.map((surgery, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-2 bg-white dark:bg-gray-800/50 rounded-md">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Type
                      </label>
                      <input
                        type="text"
                        value={surgery.split('|')[0] || ''}
                        onChange={(e) => updateSurgeryInput(index, `${e.target.value}|${surgery.split('|')[1] || ''}|${surgery.split('|')[2] || ''}`)}
                        placeholder="Surgery type"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={surgery.split('|')[1] || ''}
                        onChange={(e) => updateSurgeryInput(index, `${surgery.split('|')[0] || ''}|${e.target.value}|${surgery.split('|')[2] || ''}`)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={surgery.split('|')[2] || ''}
                        onChange={(e) => updateSurgeryInput(index, `${surgery.split('|')[0] || ''}|${surgery.split('|')[1] || ''}|${e.target.value}`)}
                        placeholder="Notes"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSurgeryInput(index)}
                      disabled={surgeryInputs.length === 1}
                      className="px-2 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Notable Events */}
            <div className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-gray-700 dark:to-gray-700 p-4 rounded-lg border border-cyan-100 dark:border-gray-600">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">event_note</span>
                  Other Notable Events
                </h3>
                <button
                  type="button"
                  onClick={addNotableEventInput}
                  className="px-3 py-1 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 text-xs flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add Event
                </button>
              </div>
              <div className="space-y-2">
                {notableEventInputs.map((event, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-2 bg-white dark:bg-gray-800/50 rounded-md">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Event Type
                      </label>
                      <input
                        type="text"
                        value={event.split('|')[0] || ''}
                        onChange={(e) => updateNotableEventInput(index, `${e.target.value}|${event.split('|')[1] || ''}|${event.split('|')[2] || ''}`)}
                        placeholder="e.g., Vaccination, Accident"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={event.split('|')[1] || ''}
                        onChange={(e) => updateNotableEventInput(index, `${event.split('|')[0] || ''}|${e.target.value}|${event.split('|')[2] || ''}`)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={event.split('|')[2] || ''}
                        onChange={(e) => updateNotableEventInput(index, `${event.split('|')[0] || ''}|${event.split('|')[1] || ''}|${e.target.value}`)}
                        placeholder="Details about the event"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNotableEventInput(index)}
                      disabled={notableEventInputs.length === 1}
                      className="px-2 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Medical Images */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-gray-700 dark:to-gray-700 p-4 rounded-lg border border-orange-100 dark:border-gray-600">
              <h3 className="text-base font-semibold mb-3 text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">image</span>
                Medical Images & Documents
              </h3>

              <div className="space-y-4">
                {/* Image Upload */}
                <ImageUpload
                  onImageCompressed={handleImageCompressed}
                  onImagesCompressed={handleImagesCompressed}
                  multiple={true}
                  maxSizeMB={20}
                  placeholder="Upload medical images, scans, or documents"
                  acceptedTypes={['image/jpeg', 'image/png', 'image/webp', 'application/pdf']}
                />

                {/* Uploaded Images List */}
                {medicalImages.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Uploaded Images ({medicalImages.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {medicalImages.map((image, index) => (
                        <div key={index} className="relative group bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
                          <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                            {image.compressedFile.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(image.compressedFile)}
                                alt={`Medical image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-gray-400">
                                  picture_as_pdf
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                              {image.compressedFile.name}
                            </p>
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.round(image.dimensions.width)}×{Math.round(image.dimensions.height)}
                              </p>
                              <p className="text-xs text-green-600 dark:text-green-400">
                                -{image.compressionRatio}%
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeMedicalImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Storage Savings */}
                {medicalImages.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-700">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      <span className="font-medium">Storage Optimized:</span> Images compressed automatically
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Total saved: {medicalImages.reduce((total, img) => total + img.originalSize - img.compressedSize, 0).toLocaleString()} bytes
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                {editData ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientFormModal;