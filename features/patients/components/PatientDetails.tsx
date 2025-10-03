import React, { useState, useEffect, useCallback } from 'react';
import { useStableCallback } from '../../../hooks/usePerformance';
import type { Patient, MedicalRecord, Reminder, Medication, Doctor } from '../../../types';
import { summarizeMedicalHistory } from '../../../services/geminiService';
import CurrentMedications from './CurrentMedications';
import { LazyAIAssistant } from '../../../utils/lazyComponents';
import ReminderList from '../../../components/ReminderList';
import CustomInsights from '../../../components/CustomInsights';
import DrugInteractions from '../../../components/DrugInteractions';
import { EyeCareModule } from '../../../components/EyeCareModule';

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
  console.log('🏥 PatientDetails (features) rendering for patient:', patient.name, patient.id);
  const [historySummary, setHistorySummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);
  const [isSummaryRegenerating, setIsSummaryRegenerating] = useState<boolean>(false);
  const [reminderDefaults, setReminderDefaults] = useState<Partial<Omit<Reminder, 'id' | 'completed'>> | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [renamingDocId, setRenamingDocId] = useState<string | null>(null);
  const [tempDocName, setTempDocName] = useState('');

  const fetchSummary = useCallback(async () => {
    if (!patient) return;
    try {
      const result = await summarizeMedicalHistory(patient);
      setHistorySummary(result);
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      setHistorySummary('Failed to load patient history summary.');
    }
  }, [patient]);

  useEffect(() => {
    const loadSummary = async () => {
      if (!patient) return;
      setIsSummaryLoading(true);
      await fetchSummary();
      setIsSummaryLoading(false);
    };

    loadSummary();
  }, [patient, fetchSummary]);

  const handleRegenerateSummary = useStableCallback(async () => {
    if (!patient) return;
    setIsSummaryRegenerating(true);
    try {
      await fetchSummary();
    } finally {
      setIsSummaryRegenerating(false);
    }
  });

  useEffect(() => {
    if (!isEditing) {
      setRenamingDocId(null);
      setTempDocName('');
    }
  }, [isEditing]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFileUpload(e.target.files);
    e.target.value = '';
  }, [onFileUpload]);

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLElement>, isOver: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEditing) {
      setIsDraggingOver(isOver);
    }
  }, [isEditing]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
    handleDragEvents(e, false);
    if (isEditing) {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileUpload(files);
      }
    }
  }, [handleDragEvents, isEditing, onFileUpload]);

  const handleStartRename = useCallback((docId: string, docName: string) => {
    setRenamingDocId(docId);
    setTempDocName(docName);
  }, []);

  const handleCancelRename = useCallback(() => {
    setRenamingDocId(null);
    setTempDocName('');
  }, []);

  const handleSaveRename = useCallback(() => {
    if (renamingDocId && tempDocName.trim()) {
      onRenameDocument(renamingDocId, tempDocName.trim());
      handleCancelRename();
    }
  }, [renamingDocId, tempDocName, onRenameDocument, handleCancelRename]);

  const handleRequestReminderForMed = useCallback((medication: Omit<Medication, 'id'>) => {
    const startDate = medication.startDate ? new Date(`${medication.startDate}T00:00:00`) : new Date();
    const refillDate = new Date(startDate);
    refillDate.setDate(refillDate.getDate() + 28);

    setReminderDefaults({
      title: `Refill ${medication.name}`,
      type: 'medication',
      date: refillDate.toISOString().split('T')[0],
      dueDate: refillDate.toISOString().split('T')[0],
      priority: 'medium',
      time: '09:00',
    });
  }, []);

  const renderDocumentCard = useCallback((doc: any) => {
    const isRenaming = renamingDocId === doc.id;
    const fileExtension = doc.name.split('.').pop()?.toLowerCase() || '';

    return (
      <div key={doc.id} className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-all duration-200 hover:border-primary-DEFAULT/30">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {doc.type === 'image' ? (
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                </div>
              </a>
            ) : (
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block">
                <div className="w-12 h-12 rounded-md bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-red-500 dark:text-red-400 text-lg">picture_as_pdf</span>
                </div>
              </a>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {isRenaming && isEditing ? (
              <input
                type="text"
                value={tempDocName}
                onChange={(e) => setTempDocName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') handleCancelRename();
                }}
                className="w-full text-sm font-medium p-2 rounded-md border-primary-DEFAULT bg-white dark:bg-input-bg-dark ring-1 ring-primary-DEFAULT focus:outline-none"
                autoFocus
              />
            ) : (
              <div>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm text-gray-900 dark:text-gray-100 hover:text-primary-DEFAULT truncate block group-hover:underline" title={doc.name}>
                  {doc.name}
                </a>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                    doc.type === 'image'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {doc.type === 'image' ? 'IMAGE' : 'PDF'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {fileExtension?.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {isRenaming ? (
                <>
                  <button onClick={handleSaveRename} title="Save" aria-label="Save new document name" className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors">
                    <span className="material-symbols-outlined text-sm">done</span>
                  </button>
                  <button onClick={handleCancelRename} title="Cancel" aria-label="Cancel renaming document" className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleStartRename(doc.id, doc.name)} title="Rename" aria-label={`Rename document: ${doc.name}`} className="p-1 text-gray-600 hover:text-primary-DEFAULT hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button onClick={() => onDeleteDocument(doc.id)} title="Delete" aria-label={`Delete document: ${doc.name}`} className="p-1 text-gray-600 hover:text-red-600 hover:bg-gray-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }, [renamingDocId, tempDocName, isEditing, handleSaveRename, handleCancelRename, handleStartRename, onDeleteDocument]);

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-card flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-border-light dark:border-border-dark">
        <div className="flex items-center gap-4">
          <img alt={patient.name} className="w-16 h-16 rounded-full" src={patient.avatarUrl} />
          <div>
            <h3 className="text-2xl font-bold text-text-light dark:text-text-dark">{patient.name}</h3>
            <div className="text-subtle-light dark:text-subtle-dark mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {patient.hospitalIds && patient.hospitalIds.length > 0 ? (
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

      <div className="flex-1 overflow-y-auto space-y-6">
        <CustomInsights
          patient={patient}
          medications={patient.currentMedications}
          records={patient.records}
        />

        <DrugInteractions medications={patient.currentMedications} />

        
      <div className="space-y-2 pb-6 border-b border-border-light dark:border-border-dark">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold text-text-light dark:text-text-dark">Medical History Summary</h4>
          <div className="flex items-center gap-2">
            {(isSummaryLoading || isSummaryRegenerating) && (
              <div className="flex items-center gap-2 text-sm text-subtle-light dark:text-subtle-dark">
                <span>{isSummaryRegenerating ? 'Regenerating...' : 'Summarizing...'}</span>
                <div className="dot-flashing"></div>
              </div>
            )}
            <button
              onClick={handleRegenerateSummary}
              disabled={isSummaryLoading || isSummaryRegenerating}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Regenerate summary"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Regenerate</span>
            </button>
          </div>
        </div>
        <div className="text-subtle-light dark:text-subtle-dark min-h-[40px]">
          {isSummaryLoading ? (
            <div className="flex items-center justify-center h-10">
              <div className="dot-flashing"></div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {historySummary.split('\n').map((line, index) => (
                <p key={index} className="mb-2 last:mb-0">
                  {line || <br />}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <LazyAIAssistant
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
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-text-light dark:text-text-dark">Visit Details for {selectedRecord.date}</h4>
          {isEditing && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>Edit Mode</span>
            </div>
          )}
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6 flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="date">Date</label>
              <input
                readOnly={!isEditing}
                onChange={onFormChange}
                value={selectedRecord.date}
                className={`w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all ${isEditing ? 'border-blue-300 dark:border-blue-500' : 'read-only:bg-gray-100 dark:read-only:bg-gray-800/50'}`}
                id="date"
                type="date"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="doctorId">Attending Doctor</label>
              <select
                id="doctorId"
                value={selectedRecord.doctorId}
                onChange={onFormChange}
                disabled={!isEditing}
                className={`w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all ${isEditing ? 'border-blue-300 dark:border-blue-500' : 'disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:cursor-not-allowed'}`}
              >
                <option value="">-- Select a Doctor --</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>{doc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="complaint">Complaint</label>
            <input
              readOnly={!isEditing}
              onChange={onFormChange}
              value={selectedRecord.complaint}
              className={`w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all ${isEditing ? 'border-blue-300 dark:border-blue-500' : 'read-only:bg-gray-100 dark:read-only:bg-gray-800/50'}`}
              id="complaint"
              type="text"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="investigations">Investigations</label>
              <textarea
                readOnly={!isEditing}
                onChange={onFormChange}
                value={selectedRecord.investigations}
                className={`w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all resize-none ${isEditing ? 'border-blue-300 dark:border-blue-500' : 'read-only:bg-gray-100 dark:read-only:bg-gray-800/50'}`}
                id="investigations"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="diagnosis">Diagnosis</label>
              <textarea
                readOnly={!isEditing}
                onChange={onFormChange}
                value={selectedRecord.diagnosis}
                className={`w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all resize-none ${isEditing ? 'border-blue-300 dark:border-blue-500' : 'read-only:bg-gray-100 dark:read-only:bg-gray-800/50'}`}
                id="diagnosis"
                rows={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="prescription">Prescription</label>
            <textarea
              readOnly={!isEditing}
              onChange={onFormChange}
              value={selectedRecord.prescription}
              className={`w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all resize-none ${isEditing ? 'border-blue-300 dark:border-blue-500' : 'read-only:bg-gray-100 dark:read-only:bg-gray-800/50'}`}
              id="prescription"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark mb-1" htmlFor="notes">Notes</label>
            <textarea
              readOnly={!isEditing}
              onChange={onFormChange}
              value={selectedRecord.notes}
              className={`w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all resize-none ${isEditing ? 'border-blue-300 dark:border-blue-500' : 'read-only:bg-gray-100 dark:read-only:bg-gray-800/50'}`}
              id="notes"
              rows={2}
            />
          </div>
        </form>

        <div className="pt-6">
          <fieldset disabled={!isEditing} className="disabled:opacity-60">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-subtle-light dark:text-subtle-dark">
                Attach Documents
              </label>
              <span className="text-xs text-subtle-light dark:text-subtle-dark">
                Max file size: 10MB
              </span>
            </div>

            <div className="mt-2">
              <label
                htmlFor="file-upload"
                onDragEnter={(e) => handleDragEvents(e, true)}
                onDragLeave={(e) => handleDragEvents(e, false)}
                onDragOver={(e) => handleDragEvents(e, true)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-border-light dark:border-border-dark border-dashed rounded-lg transition-all duration-200 ${isEditing ? 'cursor-pointer' : 'cursor-default'} ${isDraggingOver ? 'border-primary-DEFAULT bg-primary-DEFAULT/5 scale-[1.01]' : 'bg-input-bg-light dark:bg-input-bg-dark hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <span className={`material-symbols-outlined w-10 h-10 mb-3 transition-colors ${isDraggingOver ? 'text-primary-DEFAULT' : 'text-subtle-light dark:text-subtle-dark'}`}>cloud_upload</span>
                  <p className="mb-2 text-sm text-subtle-light dark:text-subtle-dark">
                    <span className="font-semibold text-primary-DEFAULT">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-subtle-light dark:text-subtle-dark">Images (PNG, JPG) or PDF files</p>
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

          {selectedRecord.documents && selectedRecord.documents.length > 0 && (
            <div className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-subtle-light dark:text-subtle-dark">
                  Attached Documents ({selectedRecord.documents.length})
                </h5>
                <div className="flex items-center gap-2 text-xs text-subtle-light dark:text-subtle-dark">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Images
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    PDFs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedRecord.documents.map(renderDocumentCard)}
              </div>
            </div>
          )}

          {(!selectedRecord.documents || selectedRecord.documents.length === 0) && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                <span className="material-symbols-outlined text-2xl text-gray-400 dark:text-gray-500">description</span>
              </div>
              <p className="text-sm text-subtle-light dark:text-subtle-dark">
                No documents attached to this record yet.
              </p>
              {isEditing && (
                <p className="text-xs text-subtle-light dark:text-subtle-dark mt-1">
                  Upload images or PDFs to get started.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default React.memo(PatientDetails);