import React, { useState, useRef, useEffect } from 'react';
import type { MedicalRecord, Doctor, Document } from '../types';
import { processMedicalDocument } from '../services/ocrService';

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

  // Close panel on escape key and manage body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

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
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrSuggestions, setOcrSuggestions] = useState<{
    complaint?: string;
    investigations?: string;
    diagnosis?: string;
    prescription?: string;
    notes?: string;
  }>({});
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

  const handleFileChange = async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type === 'application/pdf';
      const isValidSize = file.size <= 20 * 1024 * 1024; // 20MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== fileArray.length) {
      const invalidCount = fileArray.length - validFiles.length;
      alert(`${invalidCount} file(s) were skipped. Only images (PNG, JPG) and PDF files up to 20MB are allowed.`);
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Process OCR for new files
    if (validFiles.length > 0) {
      await processOCRForFiles(validFiles);
    }
  };

  const processOCRForFiles = async (files: File[]) => {
    setIsProcessingOCR(true);
    try {
      const extractedData = {
        complaint: '',
        investigations: '',
        diagnosis: '',
        prescription: '',
        notes: ''
      };

      for (const file of files) {
        // Create a mock document object for OCR processing
        const mockDocument: Document = {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type === 'application/pdf' ? 'pdf' : 'image',
          uploadedAt: new Date().toISOString(),
          size: file.size,
          url: URL.createObjectURL(file)
        };

        try {
          const ocrResult = await processMedicalDocument(mockDocument);

          // Extract and categorize information from OCR result
          const extractedText = ocrResult.text;
          const extractedDataFromOCR = ocrResult.extractedData;

          // Auto-fill complaint
          if (extractedDataFromOCR.diagnosis && extractedDataFromOCR.diagnosis.length > 0) {
            extractedData.complaint = extractedDataFromOCR.diagnosis.join('; ');
          }

          // Auto-fill investigations if lab results are found
          if (extractedDataFromOCR.labResults && extractedDataFromOCR.labResults.length > 0) {
            const labText = extractedDataFromOCR.labResults
              .map(lab => `${lab.test}: ${lab.value} ${lab.unit}`)
              .join(', ');
            extractedData.investigations = labText;
          }

          // Auto-fill diagnosis
          if (extractedDataFromOCR.diagnosis && extractedDataFromOCR.diagnosis.length > 0) {
            extractedData.diagnosis = extractedDataFromOCR.diagnosis.join(', ');
          }

          // Prescription auto-fill disabled - medications should be entered manually
          // Users can manually enter prescription details from medical documents

          // Add any additional relevant text to notes
          if (extractedText && !extractedData.notes.includes(extractedText.substring(0, 100))) {
            extractedData.notes += (extractedData.notes ? '\n\n' : '') + `Document: ${file.name}\n${extractedText}`;
          }

        } catch (error) {
          console.error(`Error processing OCR for ${file.name}:`, error);
        }
      }

      // Set OCR suggestions and auto-fill the form
      setOcrSuggestions(extractedData);

      // Auto-fill form fields with extracted data (only if fields are empty)
      setFormData(prev => ({
        ...prev,
        complaint: prev.complaint || extractedData.complaint,
        investigations: prev.investigations || extractedData.investigations,
        diagnosis: prev.diagnosis || extractedData.diagnosis,
        prescription: prev.prescription || extractedData.prescription,
        notes: prev.notes || extractedData.notes
      }));

    } catch (error) {
      console.error('Error during OCR processing:', error);
    } finally {
      setIsProcessingOCR(false);
    }
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

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-all-300 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Right Side Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-surface-light dark:bg-surface-dark shadow-panel z-50 transform transition-all-300 ease-out animate-slide-in-right">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark bg-gradient-to-r from-surface-light to-surface-hover-light dark:from-surface-dark dark:to-surface-hover-dark">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white">medical_information</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
                  {editData ? 'Edit Medical Record' : 'Add Medical Record'}
                </h2>
                <p className="text-sm text-subtle-light dark:text-subtle-dark">
                  {editData ? 'Edit the details for this medical record' : 'Add a new medical record to the patient\'s history'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost p-2 rounded-xl hover-lift"
              title="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Visit Information */}
              <div className="card p-4 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/10 dark:to-secondary-900/10 border border-primary-200 dark:border-primary-800">
                <h3 className="text-sm font-bold mb-3 text-primary-700 dark:text-primary-300 flex items-center gap-2 uppercase tracking-wide">
                  <span className="material-symbols-outlined text-base">event</span>
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
                      className="input-base text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Doctor *
                    </label>
                    <select
                      value={formData.doctorId}
                      onChange={(e) => setFormData({...formData, doctorId: e.target.value})}
                      className="input-base text-sm"
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
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                      Prescription
                      {ocrSuggestions.prescription && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Auto-filled from OCR
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <textarea
                        value={formData.prescription}
                        onChange={(e) => setFormData({...formData, prescription: e.target.value})}
                        rows={2}
                        placeholder="Medications with dosage..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                      />
                      {ocrSuggestions.prescription && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({...prev, prescription: ocrSuggestions.prescription || ''}))}
                          className="absolute top-1 right-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                          title="Use OCR suggestion"
                        >
                          Use OCR
                        </button>
                      )}
                    </div>
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
                    Max 20MB
                  </span>
                </div>

                {/* OCR Processing Status */}
                {isProcessingOCR && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-700 font-medium">
                        Processing OCR... Extracting medical information
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Automatically analyzing documents to fill prescription and other fields
                    </p>
                  </div>
                )}

                {/* OCR Success Summary */}
                {!isProcessingOCR && ocrSuggestions.prescription && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                      <span className="text-sm text-green-700 font-medium">
                        OCR Processing Complete
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Prescription and other medical information have been extracted from your documents
                    </p>
                  </div>
                )}

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
                      <p className="text-xs text-gray-500 mt-1">
                        OCR will auto-fill prescription fields
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
            </form>
          </div>

          {/* Footer Action Buttons */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                {editData ? 'Update Record' : 'Add Record'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RecordFormModal;