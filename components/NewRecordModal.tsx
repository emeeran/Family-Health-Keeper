import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, AlertCircle } from 'lucide-react';
import type { Doctor, Document } from '../types';

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
    documents: Document[];
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
    documents: Document[];
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
  isEditMode = false,
}) => {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split('T')[0],
    doctorId: initialData?.doctorId || doctors[0]?.id || '',
    complaint: initialData?.complaint || '',
    investigations: initialData?.investigations || '',
    diagnosis: initialData?.diagnosis || '',
    prescription: initialData?.prescription || '',
    notes: initialData?.notes || '',
    documents: initialData?.documents || [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const documentType = file.type.startsWith('image/') ? 'image' : 'pdf';
      const document: Document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: documentType,
        url: URL.createObjectURL(file), // In a real app, this would be uploaded to a server
      };

      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, document],
      }));
    });
  };

  const removeDocument = (documentId: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.id !== documentId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4'>
        <div className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-2xl font-bold text-text-light dark:text-text-dark'>
              {isEditMode ? 'Edit Medical Record' : 'New Medical Record'} for {patientName}
            </h2>
            <button
              onClick={onClose}
              className='text-subtle-light dark:text-subtle-dark hover:text-text-light dark:hover:text-text-dark transition-colors'
              aria-label='Close modal'
            >
              <span className='material-symbols-outlined text-2xl'>close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label
                  className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2'
                  htmlFor='date'
                >
                  Date *
                </label>
                <input
                  id='date'
                  name='date'
                  type='date'
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT'
                />
              </div>

              <div>
                <label
                  className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2'
                  htmlFor='doctorId'
                >
                  Attending Doctor *
                </label>
                <select
                  id='doctorId'
                  name='doctorId'
                  value={formData.doctorId}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT'
                >
                  <option value=''>-- Select a Doctor --</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} ({doctor.specialty})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2'
                htmlFor='complaint'
              >
                Chief Complaint *
              </label>
              <input
                id='complaint'
                name='complaint'
                type='text'
                value={formData.complaint}
                onChange={handleInputChange}
                required
                placeholder='Describe the main reason for visit...'
                className='w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT'
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label
                  className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2'
                  htmlFor='investigations'
                >
                  Investigations
                </label>
                <textarea
                  id='investigations'
                  name='investigations'
                  value={formData.investigations}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder='Laboratory tests, imaging, etc...'
                  className='w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT'
                />
              </div>

              <div>
                <label
                  className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2'
                  htmlFor='diagnosis'
                >
                  Diagnosis *
                </label>
                <textarea
                  id='diagnosis'
                  name='diagnosis'
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  rows={3}
                  required
                  placeholder='Diagnosis and assessment...'
                  className='w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT'
                />
              </div>
            </div>

            <div>
              <label
                className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2'
                htmlFor='prescription'
              >
                Prescription
              </label>
              <textarea
                id='prescription'
                name='prescription'
                value={formData.prescription}
                onChange={handleInputChange}
                rows={3}
                placeholder='Medications, dosage, instructions...'
                className='w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT'
              />
            </div>

            <div>
              <label
                className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2'
                htmlFor='notes'
              >
                Additional Notes
              </label>
              <textarea
                id='notes'
                name='notes'
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder='Any additional observations or notes...'
                className='w-full px-3 py-2 rounded-md border border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark text-text-light dark:text-text-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT'
              />
            </div>

            {/* Document Upload Section */}
            <div>
              <label className='block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-2'>
                Supporting Documents
              </label>

              {/* Upload Area */}
              <div
                className='border-2 border-dashed border-border-light dark:border-border-dark rounded-lg p-6 text-center hover:border-primary-DEFAULT transition-colors cursor-pointer'
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className='h-12 w-12 text-subtle-light dark:text-subtle-dark mx-auto mb-3' />
                <p className='text-sm text-subtle-light dark:text-subtle-dark mb-1'>
                  Click to upload or drag and drop
                </p>
                <p className='text-xs text-subtle-light dark:text-subtle-dark'>
                  PDF files, images (JPG, PNG) up to 20MB each
                </p>
                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  accept='.pdf,.jpg,.jpeg,.png'
                  onChange={handleFileUpload}
                  className='hidden'
                />
              </div>

              {/* Document List */}
              {formData.documents.length > 0 && (
                <div className='mt-4 space-y-2'>
                  <h4 className='text-sm font-medium text-subtle-light dark:text-subtle-dark'>
                    Attached Documents ({formData.documents.length})
                  </h4>
                  <div className='space-y-2'>
                    {formData.documents.map(doc => (
                      <div
                        key={doc.id}
                        className='flex items-center justify-between p-3 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark'
                      >
                        <div className='flex items-center gap-3'>
                          <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center'>
                            {doc.type === 'pdf' ? (
                              <FileText className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                            ) : (
                              <Image className='h-4 w-4 text-green-600 dark:text-green-400' />
                            )}
                          </div>
                          <div>
                            <p className='text-sm font-medium text-text-light dark:text-text-dark'>
                              {doc.name}
                            </p>
                            <p className='text-xs text-subtle-light dark:text-subtle-dark uppercase'>
                              {doc.type}
                            </p>
                          </div>
                        </div>
                        <button
                          type='button'
                          onClick={() => removeDocument(doc.id)}
                          className='p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors'
                          title='Remove document'
                        >
                          <X className='h-4 w-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Help */}
              <div className='mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                <div className='flex items-start gap-2'>
                  <AlertCircle className='h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0' />
                  <div className='text-xs text-blue-800 dark:text-blue-200'>
                    <p className='font-medium mb-1'>AI-Powered Document Processing:</p>
                    <ul className='list-disc list-inside space-y-1'>
                      <li>
                        Uploaded documents are automatically analyzed and integrated into the
                        medical record
                      </li>
                      <li>
                        PDF reports, lab results, and medical images are processed to extract
                        relevant health information
                      </li>
                      <li>
                        Multiple documents can be attached to provide comprehensive context for the
                        visit
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex justify-end gap-3 pt-6 border-t border-border-light dark:border-border-dark'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-sm font-medium text-text-light dark:text-text-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors border-2 border-green-400'
                style={{ fontWeight: 'bold' }}
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
