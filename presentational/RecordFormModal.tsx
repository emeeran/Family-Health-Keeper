import React, { useState, useRef, useEffect } from 'react';
import type { MedicalRecord, Doctor, Document } from '../types';

interface RecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordData: Omit<MedicalRecord, 'id' | 'documents'>, files?: File[]) => void;
  editData?: MedicalRecord | null;
  doctors: Doctor[];
}

const RecordFormModal: React.FC<RecordFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editData,
  doctors,
}) => {
  const [formData, setFormData] = useState({
    date: editData?.date || new Date().toISOString().split('T')[0],
    doctorId: editData?.doctorId || (doctors && doctors.length > 0 ? doctors[0].id : ''),
    complaint: editData?.complaint || '',
    investigations: editData?.investigations || '',
    diagnosis: editData?.diagnosis || '',
    prescription: editData?.prescription || '',
    notes: editData?.notes || '',
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form data when doctors change to ensure we have the latest doctor list
  useEffect(() => {
    if (doctors && doctors.length > 0) {
      setFormData(prev => {
        // If the current doctorId is not in the updated doctors list, reset to first doctor
        const doctorExists = doctors.some(d => d.id === prev.doctorId);
        return {
          ...prev,
          doctorId: doctorExists ? prev.doctorId : doctors[0].id
        };
      });
    }
  }, [doctors]);

  // Update form data when editData changes (when switching between new/edit modes)
  useEffect(() => {
    if (editData) {
      setFormData({
        date: editData.date,
        doctorId: editData.doctorId || (doctors && doctors.length > 0 ? doctors[0].id : ''),
        complaint: editData.complaint,
        investigations: editData.investigations,
        diagnosis: editData.diagnosis,
        prescription: editData.prescription,
        notes: editData.notes,
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        doctorId: doctors && doctors.length > 0 ? doctors[0].id : '',
        complaint: '',
        investigations: '',
        diagnosis: '',
        prescription: '',
        notes: '',
      });
    }
    // Reset selected files when switching between records
    setSelectedFiles([]);
  }, [editData, doctors]);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== fileArray.length) {
      const invalidCount = fileArray.length - validFiles.length;
      alert(`${invalidCount} file(s) were skipped. Only images (PNG, JPG) and PDF files up to 10MB are allowed.`);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEvents = (e: React.DragEvent<HTMLElement>, isOver: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(isOver);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    handleDragEvents(e, false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.date.trim()) {
      alert('Please select a date');
      return;
    }

    if (!formData.doctorId && doctors.length > 0) {
      alert('Please select a doctor');
      return;
    }

    if (!formData.complaint.trim()) {
      alert('Please enter a complaint');
      return;
    }

    onSave(formData, selectedFiles.length > 0 ? selectedFiles : undefined);
  };

  if (!isOpen || !doctors) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">medical_information</span>
              {editData ? 'Edit Medical Record' : 'Add Medical Record'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Visit Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-700 p-3 rounded-lg border border-blue-100 dark:border-gray-600">
              <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">event</span>
                Visit Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Doctor *
                  </label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {doctors.length === 0 ? (
                      <option value="">No doctors available</option>
                    ) : (
                      doctors.map(doctor => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.name} ({doctor.specialty})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Clinical Assessment */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 p-3 rounded-lg border border-green-100 dark:border-gray-600">
              <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">health_and_safety</span>
                Clinical Assessment
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Chief Complaint *
                  </label>
                  <textarea
                    required
                    value={formData.complaint}
                    onChange={(e) => setFormData({...formData, complaint: e.target.value})}
                    rows={2}
                    placeholder="Main reason for visit..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Investigations
                    </label>
                    <textarea
                      value={formData.investigations}
                      onChange={(e) => setFormData({...formData, investigations: e.target.value})}
                      rows={2}
                      placeholder="Tests, labs, imaging..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Diagnosis *
                    </label>
                    <textarea
                      required
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                      rows={2}
                      placeholder="Diagnosis or assessment..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Treatment Plan */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-gray-700 dark:to-gray-700 p-3 rounded-lg border border-purple-100 dark:border-gray-600">
              <h3 className="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">medication</span>
                Treatment Plan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Prescription
                  </label>
                  <textarea
                    value={formData.prescription}
                    onChange={(e) => setFormData({...formData, prescription: e.target.value})}
                    rows={2}
                    placeholder="Medications with dosage..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                    placeholder="Follow-up instructions..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Document Attachment */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-700 p-3 rounded-lg border border-amber-100 dark:border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">attach_file</span>
                  Attach Documents
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Max 10MB
                </span>
              </div>

              <div className="mb-3">
                <label
                  htmlFor="record-file-upload"
                  onDragEnter={(e) => handleDragEvents(e, true)}
                  onDragLeave={(e) => handleDragEvents(e, false)}
                  onDragOver={(e) => handleDragEvents(e, true)}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center w-full h-20 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer ${
                    isDraggingOver
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 scale-[1.01]'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <span className={`material-symbols-outlined w-6 h-6 mb-1 transition-colors ${
                      isDraggingOver ? 'text-amber-500' : 'text-gray-400'
                    }`}>cloud_upload</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-amber-600">Click to upload</span> or drag & drop
                    </p>
                  </div>
                  <input
                    id="record-file-upload"
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/png, image/jpeg, application/pdf"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Selected Files ({selectedFiles.length})
                  </h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {file.type.startsWith('image/') ? (
                              <div className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-blue-500 text-xs">image</span>
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-500 text-xs">picture_as_pdf</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove file"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-xs">save</span>
                {editData ? 'Update Record' : 'Add Record'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecordFormModal;