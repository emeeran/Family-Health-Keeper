

import React, { useState, useEffect } from 'react';
import type { Patient, MedicalRecord, Document, Reminder, Medication, Doctor } from '../types';
import AIAssistant from './AIAssistant';
import ReminderList from './ReminderList';
import CurrentMedications from './CurrentMedications';
import { summarizeMedicalHistory } from '../services/geminiService';

interface PatientDetailsProps {
    patient: Patient;
    selectedRecord: MedicalRecord;
    onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onFileUpload: (files: FileList | null) => void;
    onDeleteDocument: (documentId: string) => void;
    onRenameDocument: (documentId: string, newName: string) => void;
    isEditing: boolean;
    onAddReminder: (patientId: string, reminder: Omit<Reminder, 'id' | 'completed'>) => void;
    onToggleReminder: (patientId: string, reminderId: string) => void;
    onDeleteReminder: (patientId: string, reminderId: string) => void;
    onAddMedication: (patientId: string, medication: Omit<Medication, 'id'>) => void;
    onUpdateMedication: (patientId: string, medication: Medication) => void;
    onDeleteMedication: (patientId: string, medicationId: string) => void;
    doctors: Doctor[];
}

const PatientDetails: React.FC<PatientDetailsProps> = ({
    patient,
    selectedRecord,
    onFormChange,
    onFileUpload,
    onDeleteDocument,
    onRenameDocument,
    isEditing,
    onAddReminder,
    onToggleReminder,
    onDeleteReminder,
    onAddMedication,
    onUpdateMedication,
    onDeleteMedication,
    doctors,
}) => {
    console.log('PatientDetails component mounted/updated:', {
        patientName: patient.name,
        selectedRecordId: selectedRecord.id,
        isEditing,
        isNewRecord: selectedRecord.id.startsWith('new-')
    });

    const [historySummary, setHistorySummary] = useState<string>('');
    const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);
    const [reminderDefaults, setReminderDefaults] = useState<Partial<Omit<Reminder, 'id'|'completed'>> | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
    const [tempDocName, setTempDocName] = useState('');

    useEffect(() => {
        const fetchSummary = async () => {
            if (!patient) return;
            setIsSummaryLoading(true);
            try {
                const result = await summarizeMedicalHistory(patient);
                setHistorySummary(result);
            } catch (error) {
                console.error("Failed to fetch summary:", error);
                setHistorySummary('Failed to load patient history summary.');
            } finally {
                setIsSummaryLoading(false);
            }
        };

        fetchSummary();
    }, [patient]);
    
    useEffect(() => {
        // When editing mode is turned off, cancel any active renaming
        if (!isEditing) {
            setRenamingDocId(null);
            setTempDocName('');
        }
    }, [isEditing]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onFileUpload(e.target.files);
        e.target.value = ''; // Allow uploading the same file again
    };

    const handleDragEvents = (e: React.DragEvent<HTMLElement>, isOver: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (isEditing) { // Only show feedback if editing
            setIsDraggingOver(isOver);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLElement>) => {
        handleDragEvents(e, false);
        if (isEditing) {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                onFileUpload(files);
            }
        }
    };

    const handleStartRename = (doc: Document) => {
        setRenamingDocId(doc.id);
        setTempDocName(doc.name);
    };

    const handleCancelRename = () => {
        setRenamingDocId(null);
        setTempDocName('');
    };

    const handleSaveRename = () => {
        if (renamingDocId && tempDocName.trim()) {
            onRenameDocument(renamingDocId, tempDocName.trim());
            handleCancelRename();
        }
    };


    const handleRequestReminderForMed = (medication: Omit<Medication, 'id'>) => {
        const startDate = medication.startDate ? new Date(`${medication.startDate}T00:00:00`) : new Date();
        const refillDate = new Date(startDate);
        refillDate.setDate(refillDate.getDate() + 28); // Default to 28 day refill cycle

        setReminderDefaults({
            title: `Refill ${medication.name}`,
            type: 'medication',
            date: refillDate.toISOString().split('T')[0], // Reminder date
            dueDate: refillDate.toISOString().split('T')[0], // Due date same as reminder
            priority: 'medium',
            time: '09:00',
        });
    };

    return (
      <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-card h-full overflow-y-auto">
            <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-4">
                        <img alt={patient.name} className="w-16 h-16 rounded-full" src={patient.avatarUrl} />
                        <div>
                            <h3 className="text-2xl font-bold text-text-light dark:text-text-dark">{patient.name}</h3>
                            <div className="text-subtle-light dark:text-subtle-dark mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                {(patient.hospitalIds && patient.hospitalIds.length > 0) ? (
                                    patient.hospitalIds.map((hid) => (
                                        <div key={hid.id} className="text-sm">
                                            <span className="font-semibold">{hid.hospitalName}:</span> {hid.patientId}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm italic">No hospital IDs on record.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <CurrentMedications
                patient={patient}
                onAddMedication={onAddMedication}
                onUpdateMedication={onUpdateMedication}
                onDeleteMedication={onDeleteMedication}
                onRequestReminder={handleRequestReminderForMed}
            />

            <div className="space-y-2 pb-6 border-b border-border-light dark:border-border-dark">
                <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-text-light dark:text-text-dark">Medical History Summary</h4>
                    {isSummaryLoading && (
                        <div className="flex items-center gap-2 text-sm text-subtle-light dark:text-subtle-dark">
                            <span>Summarizing...</span>
                            <div className="dot-flashing"></div>
                        </div>
                    )}
                </div>
                <p className="text-subtle-light dark:text-subtle-dark min-h-[40px]">
                    {isSummaryLoading ? 'Generating summary from patient records...' : historySummary}
                </p>
            </div>
            
            <AIAssistant 
                record={selectedRecord} 
                history={historySummary || patient.medicalHistory}
                patient={patient}
            />
            
            <ReminderList 
                patient={patient}
                onAddReminder={onAddReminder}
                onToggleReminder={onToggleReminder}
                onDeleteReminder={onDeleteReminder}
                reminderDefaults={reminderDefaults}
                onReminderDefaultsHandled={() => setReminderDefaults(null)}
            />

            <div className="pt-6 border-t border-border-light dark:border-border-dark">
                 <h4 className="text-lg font-semibold text-text-light dark:text-text-dark mb-4">Visit Details for {selectedRecord.date}</h4>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="date">Date</label>
                            <input readOnly={!isEditing} onChange={onFormChange} value={selectedRecord.date} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT read-only:bg-gray-100 dark:read-only:bg-gray-800/50" id="date" type="date" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="doctorId">Attending Doctor</label>
                             <select 
                                id="doctorId"
                                value={selectedRecord.doctorId} 
                                onChange={onFormChange} 
                                disabled={!isEditing}
                                className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed" 
                            >
                                <option value="">-- Select a Doctor --</option>
                                {doctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="complaint">Complaint</label>
                        <input readOnly={!isEditing} onChange={onFormChange} value={selectedRecord.complaint} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT read-only:bg-gray-100 dark:read-only:bg-gray-800/50" id="complaint" type="text" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="investigations">Investigations</label>
                            <textarea readOnly={!isEditing} onChange={onFormChange} value={selectedRecord.investigations} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT read-only:bg-gray-100 dark:read-only:bg-gray-800/50" id="investigations" rows={2}></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="diagnosis">Diagnosis</label>
                            <textarea readOnly={!isEditing} onChange={onFormChange} value={selectedRecord.diagnosis} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT read-only:bg-gray-100 dark:read-only:bg-gray-800/50" id="diagnosis" rows={2}></textarea>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="prescription">Prescription</label>
                        <textarea readOnly={!isEditing} onChange={onFormChange} value={selectedRecord.prescription} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT read-only:bg-gray-100 dark:read-only:bg-gray-800/50" id="prescription" rows={2}></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="notes">Notes</label>
                        <textarea readOnly={!isEditing} onChange={onFormChange} value={selectedRecord.notes} className="w-full rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-primary-DEFAULT read-only:bg-gray-100 dark:read-only:bg-gray-800/50" id="notes" rows={2}></textarea>
                    </div>
                </form>

                <div className="pt-6">
                    <fieldset disabled={!isEditing} className="disabled:opacity-60">
                        <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1">
                            Attach Documents
                        </label>
                        <div className="mt-2">
                            <label
                                htmlFor="file-upload"
                                onDragEnter={(e) => handleDragEvents(e, true)}
                                onDragLeave={(e) => handleDragEvents(e, false)}
                                onDragOver={(e) => handleDragEvents(e, true)}
                                onDrop={handleDrop}
                                className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-border-light dark:border-border-dark border-dashed rounded-lg transition-colors ${isEditing ? 'cursor-pointer' : 'cursor-default'} ${isDraggingOver ? 'border-primary-DEFAULT bg-primary-DEFAULT/10' : 'bg-input-bg-light dark:bg-input-bg-dark hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <span className="material-symbols-outlined w-8 h-8 mb-4 text-subtle-light dark:text-subtle-dark">cloud_upload</span>
                                    <p className="mb-2 text-sm text-subtle-light dark:text-subtle-dark">
                                        <span className="font-semibold text-primary-DEFAULT">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-subtle-light dark:text-subtle-dark">Images (PNG, JPG) or PDF files up to 10MB</p>
                                </div>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="sr-only"
                                    multiple
                                    accept="image/png, image/jpeg, application/pdf"
                                    onChange={handleFileChange}
                                    disabled={!isEditing}
                                />
                            </label>
                        </div>
                    </fieldset>
                    <div className="pt-6">
                        {selectedRecord.documents && selectedRecord.documents.length > 0 ? (
                            <ul className="space-y-3">
                                {selectedRecord.documents.map((doc: Document) => {
                                    const isRenaming = renamingDocId === doc.id;
                                    return (
                                        <li key={doc.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-lg gap-2">
                                            {doc.type === 'image' ? (
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" aria-label={`View document: ${doc.name}`} className="flex-shrink-0">
                                                    <img src={doc.url} alt={doc.name} className="w-10 h-10 object-cover rounded-md" />
                                                </a>
                                            ) : (
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-red-100 dark:bg-red-900/50 rounded-md">
                                                    <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                                                </a>
                                            )}
                                            
                                            <div className="flex-1 overflow-hidden">
                                                {isRenaming && isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={tempDocName}
                                                        onChange={(e) => setTempDocName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveRename();
                                                            if (e.key === 'Escape') handleCancelRename();
                                                        }}
                                                        className="w-full text-sm font-medium p-1 rounded-md border-primary-DEFAULT bg-white dark:bg-input-bg-dark ring-1 ring-primary-DEFAULT focus:outline-none"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm truncate block hover:underline" title={doc.name}>
                                                        {doc.name}
                                                    </a>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                {isEditing && (
                                                    isRenaming ? (
                                                        <>
                                                            <button onClick={handleSaveRename} title="Save" aria-label="Save new document name" className="p-1.5 text-subtle-light dark:text-subtle-dark hover:text-green-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                <span className="material-symbols-outlined text-base">done</span>
                                                            </button>
                                                            <button onClick={handleCancelRename} title="Cancel" aria-label="Cancel renaming document" className="p-1.5 text-subtle-light dark:text-subtle-dark hover:text-red-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                <span className="material-symbols-outlined text-base">close</span>
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleStartRename(doc)} title="Rename" aria-label={`Rename document: ${doc.name}`} className="p-1.5 text-subtle-light dark:text-subtle-dark hover:text-primary-DEFAULT rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                <span className="material-symbols-outlined text-base">edit</span>
                                                            </button>
                                                            <button onClick={() => onDeleteDocument(doc.id)} title="Delete" aria-label={`Delete document: ${doc.name}`} className="p-1.5 text-subtle-light dark:text-subtle-dark hover:text-red-600 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                                                                <span className="material-symbols-outlined text-base">delete</span>
                                                            </button>
                                                        </>
                                                    )
                                                )}
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <div className="mt-4 text-center text-sm text-subtle-light dark:text-subtle-dark py-6 border-2 border-dashed border-border-light dark:border-border-dark rounded-lg">
                                No documents attached to this record.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};

export default PatientDetails;
