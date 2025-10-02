import React, { useState, useEffect } from 'react';
import type { Patient, MedicalRecord, Document, Doctor } from '../../types';
import AIAssistant from '../../components/AIAssistant';

interface RecordDetailsPanelProps {
    patient: Patient;
    record: MedicalRecord;
    isOpen: boolean;
    onClose: () => void;
    onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onFileUpload: (files: FileList | null) => void;
    onDeleteDocument: (documentId: string) => void;
    onRenameDocument: (documentId: string, newName: string) => void;
    isEditing: boolean;
    doctors: Doctor[];
}

const RecordDetailsPanel: React.FC<RecordDetailsPanelProps> = ({
    patient,
    record,
    isOpen,
    onClose,
    onFormChange,
    onFileUpload,
    onDeleteDocument,
    onRenameDocument,
    isEditing,
    doctors,
}) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
    const [tempDocName, setTempDocName] = useState('');

    useEffect(() => {
        if (!isEditing) {
            setRenamingDocId(null);
            setTempDocName('');
        }
    }, [isEditing]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFileUpload(e.target.files);
        e.target.value = '';
    };

    const handleDragEvents = (e: React.DragEvent<HTMLElement>, isOver: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (isEditing) {
            setIsDraggingOver(isOver);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (isEditing && e.dataTransfer.files) {
            onFileUpload(e.dataTransfer.files);
        }
    };

    const startRenaming = (docId: string, currentName: string) => {
        setRenamingDocId(docId);
        setTempDocName(currentName);
    };

    const commitRename = (docId: string) => {
        if (tempDocName.trim() && tempDocName !== '') {
            onRenameDocument(docId, tempDocName.trim());
        }
        setRenamingDocId(null);
        setTempDocName('');
    };

    const cancelRename = () => {
        setRenamingDocId(null);
        setTempDocName('');
    };

    const getFileIcon = (type: 'pdf' | 'image') => {
        return type === 'pdf' ? 'picture_as_pdf' : 'image';
    };

    const doctorName = doctors.find(d => d.id === record.doctorId)?.name || 'Unknown Doctor';

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop - visible on all screen sizes */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-30 z-40"
                onClick={onClose}
            />
            
            {/* Slide-out Panel */}
            <div 
                className={`fixed inset-y-0 right-0 w-full lg:w-[600px] bg-surface-light dark:bg-surface-dark shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} overflow-hidden flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl">medical_information</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-text-light dark:text-text-dark">Visit Details</h2>
                            <p className="text-sm text-subtle-light dark:text-subtle-dark">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark rounded-lg transition-colors"
                        aria-label="Close panel"
                    >
                        <span className="material-symbols-outlined text-2xl text-subtle-light dark:text-subtle-dark">close</span>
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Doctor & Date Info */}
                    <div className="bg-surface-hover-light dark:bg-surface-hover-dark rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="material-symbols-outlined text-primary-500">person</span>
                            <div className="flex-1">
                                <label className="text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wide">Doctor</label>
                                {isEditing ? (
                                    <select
                                        name="doctorId"
                                        value={record.doctorId}
                                        onChange={onFormChange}
                                        className="mt-1 w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    >
                                        {doctors.map(doctor => (
                                            <option key={doctor.id} value={doctor.id}>
                                                {doctor.name} - {doctor.specialty}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="text-base font-medium text-text-light dark:text-text-dark">{doctorName}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary-500">calendar_today</span>
                            <div className="flex-1">
                                <label className="text-xs font-medium text-subtle-light dark:text-subtle-dark uppercase tracking-wide">Date</label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="date"
                                        value={record.date}
                                        onChange={onFormChange}
                                        className="mt-1 w-full px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                    />
                                ) : (
                                    <p className="text-base font-medium text-text-light dark:text-text-dark">
                                        {new Date(record.date).toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Complaint */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-text-light dark:text-text-dark">
                            <span className="material-symbols-outlined text-warning-500">report</span>
                            Chief Complaint
                        </label>
                        {isEditing ? (
                            <textarea
                                name="complaint"
                                value={record.complaint}
                                onChange={onFormChange}
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                placeholder="Describe the main symptoms or concerns..."
                            />
                        ) : (
                            <p className="text-base text-text-light dark:text-text-dark bg-surface-hover-light dark:bg-surface-hover-dark rounded-lg p-4">
                                {record.complaint || <em className="text-subtle-light dark:text-subtle-dark">No complaint recorded</em>}
                            </p>
                        )}
                    </div>

                    {/* Investigations */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-text-light dark:text-text-dark">
                            <span className="material-symbols-outlined text-info-500">science</span>
                            Investigations
                        </label>
                        {isEditing ? (
                            <textarea
                                name="investigations"
                                value={record.investigations}
                                onChange={onFormChange}
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                placeholder="Tests and examinations performed..."
                            />
                        ) : (
                            <p className="text-base text-text-light dark:text-text-dark bg-surface-hover-light dark:bg-surface-hover-dark rounded-lg p-4">
                                {record.investigations || <em className="text-subtle-light dark:text-subtle-dark">No investigations recorded</em>}
                            </p>
                        )}
                    </div>

                    {/* Diagnosis */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-text-light dark:text-text-dark">
                            <span className="material-symbols-outlined text-error-500">health_and_safety</span>
                            Diagnosis
                        </label>
                        {isEditing ? (
                            <textarea
                                name="diagnosis"
                                value={record.diagnosis}
                                onChange={onFormChange}
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                placeholder="Medical diagnosis..."
                            />
                        ) : (
                            <p className="text-base text-text-light dark:text-text-dark bg-surface-hover-light dark:bg-surface-hover-dark rounded-lg p-4">
                                {record.diagnosis || <em className="text-subtle-light dark:text-subtle-dark">No diagnosis recorded</em>}
                            </p>
                        )}
                    </div>

                    {/* Prescription */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-text-light dark:text-text-dark">
                            <span className="material-symbols-outlined text-success-500">medication</span>
                            Prescription
                        </label>
                        {isEditing ? (
                            <textarea
                                name="prescription"
                                value={record.prescription}
                                onChange={onFormChange}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                                placeholder="Medications prescribed..."
                            />
                        ) : (
                            <div className="text-base text-text-light dark:text-text-dark bg-surface-hover-light dark:bg-surface-hover-dark rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
                                {record.prescription || <em className="text-subtle-light dark:text-subtle-dark not-italic">No prescription recorded</em>}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-semibold text-text-light dark:text-text-dark">
                            <span className="material-symbols-outlined text-primary-500">note</span>
                            Additional Notes
                        </label>
                        {isEditing ? (
                            <textarea
                                name="notes"
                                value={record.notes}
                                onChange={onFormChange}
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                                placeholder="Additional observations or instructions..."
                            />
                        ) : (
                            <p className="text-base text-text-light dark:text-text-dark bg-surface-hover-light dark:bg-surface-hover-dark rounded-lg p-4">
                                {record.notes || <em className="text-subtle-light dark:text-subtle-dark">No additional notes</em>}
                            </p>
                        )}
                    </div>

                    {/* Documents Section */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-text-light dark:text-text-dark">
                            <span className="material-symbols-outlined text-secondary-500">attach_file</span>
                            Attached Documents
                            <span className="ml-auto text-xs font-normal text-subtle-light dark:text-subtle-dark">
                                {record.documents.length} file{record.documents.length !== 1 ? 's' : ''}
                            </span>
                        </label>

                        {isEditing && (
                            <div
                                onDragEnter={(e) => handleDragEvents(e, true)}
                                onDragOver={(e) => handleDragEvents(e, true)}
                                onDragLeave={(e) => handleDragEvents(e, false)}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                                    isDraggingOver
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-border-light dark:border-border-dark bg-surface-hover-light dark:bg-surface-hover-dark'
                                }`}
                            >
                                <input
                                    type="file"
                                    id="fileUpload"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="pointer-events-none">
                                    <span className="material-symbols-outlined text-5xl text-primary-500 mb-2">cloud_upload</span>
                                    <p className="text-sm font-medium text-text-light dark:text-text-dark mb-1">
                                        Drop files here or click to browse
                                    </p>
                                    <p className="text-xs text-subtle-light dark:text-subtle-dark">
                                        PDF, JPG, PNG up to 10MB
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {record.documents.length > 0 ? (
                                record.documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center gap-3 p-3 bg-surface-hover-light dark:bg-surface-hover-dark rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
                                    >
                                        <span className={`material-symbols-outlined text-2xl ${doc.type === 'pdf' ? 'text-error-500' : 'text-info-500'}`}>
                                            {getFileIcon(doc.type)}
                                        </span>
                                        {isEditing && renamingDocId === doc.id ? (
                                            <input
                                                type="text"
                                                value={tempDocName}
                                                onChange={(e) => setTempDocName(e.target.value)}
                                                onBlur={() => commitRename(doc.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') commitRename(doc.id);
                                                    if (e.key === 'Escape') cancelRename();
                                                }}
                                                className="flex-1 px-2 py-1 rounded border border-primary-500 bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark focus:outline-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <>
                                                <a
                                                    href={doc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 text-sm font-medium text-text-light dark:text-text-dark hover:text-primary-500 transition-colors truncate"
                                                >
                                                    {doc.name}
                                                </a>
                                                {isEditing && (
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => startRenaming(doc.id, doc.name)}
                                                            className="p-1.5 hover:bg-info-100 dark:hover:bg-info-900/30 rounded transition-colors"
                                                            title="Rename"
                                                        >
                                                            <span className="material-symbols-outlined text-base text-info-500">edit</span>
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteDocument(doc.id)}
                                                            className="p-1.5 hover:bg-error-100 dark:hover:bg-error-900/30 rounded transition-colors"
                                                            title="Delete"
                                                        >
                                                            <span className="material-symbols-outlined text-base text-error-500">delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-subtle-light dark:text-subtle-dark text-center py-4 italic">
                                    No documents attached
                                </p>
                            )}
                        </div>
                    </div>

                    {/* AI Assistant */}
                    {!isEditing && (
                        <div className="pt-4 border-t border-border-light dark:border-border-dark">
                            <AIAssistant
                                record={record}
                                history={patient.medicalHistory}
                                patient={patient}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default RecordDetailsPanel;
