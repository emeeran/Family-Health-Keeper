import React, { useState, useMemo, useEffect } from 'react';
import type { Patient, MedicalRecord, Doctor } from '../types';
import { useDebounce } from '../hooks/useDebounce';

interface SidebarProps {
    patients: Patient[];
    selectedPatient: Patient | null;
    selectedRecordId: string | null;
    onNewPatient: () => void;
    onNewRecord: () => void;
    onSelectPatient: (id: string) => void;
    onSelectRecord: (id: string) => void;
    onEditPatient: () => void;
    onDeletePatient: () => void;
    onExportPatient: (id: string) => void;
    onExportPatientPdf: (id: string) => void;
    onEditRecord: () => void;
    onSaveRecord: () => void;
    onDeleteRecord: () => void;
    isEditing: boolean;
    isFormDirty: boolean;
    isRecordSelected: boolean;
    doctors: Doctor[];
    onOpenDoctorModal: (doctor: Doctor | null) => void;
    onDeleteDoctor: (id: string) => void;
    onEditRecordModal: (record: MedicalRecord) => void;
    onDeleteRecordDirect: (recordId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    patients,
    selectedPatient,
    selectedRecordId,
    onNewPatient,
    onNewRecord,
    onSelectPatient,
    onSelectRecord,
    onEditPatient,
    onDeletePatient,
    onExportPatient,
    onExportPatientPdf,
    onEditRecord,
    onSaveRecord,
    onDeleteRecord,
    isEditing,
    isFormDirty,
    isRecordSelected,
    doctors,
    onOpenDoctorModal,
    onDeleteDoctor,
    onEditRecordModal,
    onDeleteRecordDirect,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
    const debouncedDoctorSearchQuery = useDebounce(doctorSearchQuery, 300);
    const [recordSearchQuery, setRecordSearchQuery] = useState('');
    const debouncedRecordSearchQuery = useDebounce(recordSearchQuery, 300);
    const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());

    const filteredPatients = useMemo(() => {
        if (!debouncedSearchQuery) {
            return patients;
        }
        return patients.filter(patient =>
            patient.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
    }, [patients, debouncedSearchQuery]);

    const filteredDoctors = useMemo(() => {
        if (!debouncedDoctorSearchQuery) {
            return doctors;
        }
        return doctors.filter(doctor =>
            doctor.name.toLowerCase().includes(debouncedDoctorSearchQuery.toLowerCase()) ||
            doctor.specialty.toLowerCase().includes(debouncedDoctorSearchQuery.toLowerCase())
        );
    }, [doctors, debouncedDoctorSearchQuery]);

    const filterRecords = (records: MedicalRecord[]) => {
        if (!debouncedRecordSearchQuery) {
            return records;
        }
        const query = debouncedRecordSearchQuery.toLowerCase();
        return records.filter(record =>
            record.complaint.toLowerCase().includes(query) ||
            record.diagnosis.toLowerCase().includes(query) ||
            record.date.toLowerCase().includes(query) ||
            (record.investigations && record.investigations.toLowerCase().includes(query)) ||
            (record.prescription && record.prescription.toLowerCase().includes(query)) ||
            (record.notes && record.notes.toLowerCase().includes(query))
        );
    };

    const groupedRecords = useMemo(() => {
        if (!selectedPatient?.records) return {};

        const filteredRecords = filterRecords(selectedPatient.records);

        const groups = filteredRecords.reduce((acc, record) => {
            const year = new Date(record.date).getFullYear().toString();
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(record);
            return acc;
        }, {} as Record<string, MedicalRecord[]>);

        // Sort records within each year group by date, descending
        for (const year in groups) {
            groups[year].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        return groups;
    }, [selectedPatient?.records, debouncedRecordSearchQuery]);

    // --- Record Navigation Logic ---
    const sortedRecords = useMemo(() => {
        if (!selectedPatient?.records) return [];
        // Create a sorted copy for navigation
        return [...selectedPatient.records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedPatient?.records]);

    const currentRecordIndex = useMemo(() => {
        if (!selectedRecordId) return -1;
        return sortedRecords.findIndex(r => r.id === selectedRecordId);
    }, [selectedRecordId, sortedRecords]);

    const hasPreviousRecord = currentRecordIndex > 0;
    const hasNextRecord = currentRecordIndex !== -1 && currentRecordIndex < sortedRecords.length - 1;

    const handlePreviousRecord = () => {
        if (hasPreviousRecord) {
            onSelectRecord(sortedRecords[currentRecordIndex - 1].id);
        }
    };

    const handleNextRecord = () => {
        if (hasNextRecord) {
            onSelectRecord(sortedRecords[currentRecordIndex + 1].id);
        }
    };
    // --- End Record Navigation Logic ---

    useEffect(() => {
        // When patient changes, expand the most recent year
        if (selectedPatient?.records && selectedPatient.records.length > 0) {
            const latestYear = new Date(selectedPatient.records[0].date).getFullYear().toString();
            setExpandedYears(new Set([latestYear]));
        } else {
            setExpandedYears(new Set());
        }
    }, [selectedPatient]);
    
    useEffect(() => {
        // When a record is selected, ensure its year is expanded
        if (selectedRecordId && selectedPatient) {
            const record = selectedPatient.records.find(r => r.id === selectedRecordId);
            if (record) {
                const year = new Date(record.date).getFullYear().toString();
                if (!expandedYears.has(year)) {
                    setExpandedYears(prev => new Set(prev).add(year));
                }
            }
        }
    }, [selectedRecordId, selectedPatient, expandedYears]);

    const toggleYear = (year: string) => {
        setExpandedYears(prev => {
            const newSet = new Set(prev);
            if (newSet.has(year)) {
                newSet.delete(year);
            } else {
                newSet.add(year);
            }
            return newSet;
        });
    };

    const recordYears = Object.keys(groupedRecords).sort((a, b) => Number(b) - Number(a));

    const selectedRecord = selectedPatient?.records.find(r => r.id === selectedRecordId);
    const selectedDoctor = doctors.find(d => d.id === selectedRecord?.doctorId);

    return (
        <aside className="w-80 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col shrink-0 h-screen overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined text-3xl text-primary-DEFAULT">health_and_safety</span>
                <h1 className="text-xl font-bold text-text-light dark:text-text-dark">Family Health Keeper</h1>
            </div>

            {/* Top Actions */}
            <div className="p-4 space-y-3 shrink-0 border-b border-border-light dark:border-border-dark">
                <button onClick={onNewPatient} aria-label="Add a new family member" className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors">
                    <span className="material-symbols-outlined text-base">person_add</span>
                    <span>Add Person</span>
                </button>
                <button onClick={onNewRecord} disabled={!selectedPatient} aria-label="Add a new medical record for the selected person" className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-text-light dark:text-text-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="material-symbols-outlined text-base">add</span>
                    <span>Add Record</span>
                </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Patients */}
                <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-sm font-semibold text-subtle-light dark:text-subtle-dark uppercase">Family Members</h2>
                        <div className="flex items-center gap-1">
                            <button onClick={onEditPatient} disabled={!selectedPatient} title="Edit Person" aria-label="Edit details for selected person" className="p-1 disabled:opacity-50 disabled:cursor-not-allowed text-subtle-light dark:text-subtle-dark hover:text-primary-DEFAULT">
                                <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                             <button onClick={() => selectedPatient && onExportPatient(selectedPatient.id)} disabled={!selectedPatient} title="Export as JSON" aria-label="Export selected person's data as a JSON file" className="p-1 disabled:opacity-50 disabled:cursor-not-allowed text-subtle-light dark:text-subtle-dark hover:text-primary-DEFAULT">
                                <span className="material-symbols-outlined text-base">download</span>
                            </button>
                             <button onClick={() => selectedPatient && onExportPatientPdf(selectedPatient.id)} disabled={!selectedPatient} title="Export as PDF" aria-label="Export selected person's data as a PDF document" className="p-1 disabled:opacity-50 disabled:cursor-not-allowed text-subtle-light dark:text-subtle-dark hover:text-primary-DEFAULT">
                                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                            </button>
                             <button onClick={onDeletePatient} disabled={!selectedPatient} title="Delete Person" aria-label="Delete selected person and all their records" className="p-1 disabled:opacity-50 disabled:cursor-not-allowed text-subtle-light dark:text-subtle-dark hover:text-red-600">
                                <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                        </div>
                    </div>
                    <div className="relative mb-3">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtle-light dark:text-subtle-dark text-base pointer-events-none">search</span>
                        <input
                            type="search"
                            placeholder="Search family members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                            aria-label="Search family members"
                        />
                    </div>
                    <ul className="space-y-1">
                        {filteredPatients.length > 0 ? filteredPatients.map(patient => {
                            const hasNewRecords = patient.records.some(r => r.isNew);
                            return (
                                <li key={patient.id}>
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); onSelectPatient(patient.id); }}
                                        aria-current={selectedPatient?.id === patient.id ? 'page' : undefined}
                                        className={`flex items-center gap-3 p-2 rounded-md transition-colors text-sm font-medium ${selectedPatient?.id === patient.id ? 'bg-primary-DEFAULT/10 text-primary-DEFAULT' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                    >
                                        <img alt={patient.name} className="w-7 h-7 rounded-full" src={patient.avatarUrl} />
                                        <span className="flex-1">{patient.name}</span>
                                        {hasNewRecords && <span className="w-2.5 h-2.5 bg-secondary rounded-full" title="New Records"></span>}
                                    </a>
                                </li>
                            );
                        }) : (
                             <p className="text-sm text-subtle-light dark:text-subtle-dark p-2 text-center">No family members found.</p>
                        )}
                    </ul>
                </div>

                {/* Records */}
                {selectedPatient && (
                    <div className="p-4 border-t border-border-light dark:border-border-dark">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-sm font-semibold text-subtle-light dark:text-subtle-dark uppercase">Records</h2>
                        </div>
                        <div className="relative mb-3">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtle-light dark:text-subtle-dark text-base pointer-events-none">search</span>
                            <input
                                type="search"
                                placeholder="Search records..."
                                value={recordSearchQuery}
                                onChange={(e) => setRecordSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                                aria-label="Search records"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <button
                                onClick={handlePreviousRecord}
                                disabled={!hasPreviousRecord}
                                className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-text-light dark:text-text-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Previous Record"
                                aria-label="Navigate to the previous record"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                                <span>Prev</span>
                            </button>
                            <button
                                onClick={handleNextRecord}
                                disabled={!hasNextRecord}
                                className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-text-light dark:text-text-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Next Record"
                                aria-label="Navigate to the next record"
                            >
                                <span>Next</span>
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                         <div className="flex items-center gap-2 mb-3">
                             <button onClick={onEditRecord} disabled={isEditing || !isRecordSelected} className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-text-light dark:text-text-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Edit Record" aria-label="Edit the selected medical record">
                                <span className="material-symbols-outlined text-sm">edit</span>
                                <span>Edit</span>
                            </button>
                             <button onClick={onDeleteRecord} disabled={!isRecordSelected} className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-red-700 rounded-md hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Delete Record" aria-label="Delete the selected medical record">
                                <span className="material-symbols-outlined text-sm">delete</span>
                                <span>Delete</span>
                            </button>
                        </div>
                        {/* Persistent Save Button */}
                        {(isFormDirty || isEditing) && (
                            <div className="mb-3">
                                <button onClick={onSaveRecord} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-DEFAULT rounded-md hover:bg-primary-hover transition-colors" title="Save Record" aria-label="Save changes to the current medical record">
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    <span>Save</span>
                                </button>
                            </div>
                        )}
                        <ul className="space-y-1">
                           {recordYears.length > 0 ? recordYears.map(year => {
                               const isExpanded = expandedYears.has(year);
                               return (
                                   <li key={year}>
                                       <button
                                           onClick={() => toggleYear(year)}
                                           className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-DEFAULT"
                                           aria-expanded={isExpanded}
                                           aria-controls={`records-${year}`}
                                       >
                                           <span className="font-semibold text-sm text-text-light dark:text-text-dark">{year}</span>
                                           <span className={`material-symbols-outlined text-subtle-light dark:text-subtle-dark transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                               expand_more
                                           </span>
                                       </button>
                                       <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
                                            <ul id={`records-${year}`} className="pl-3 pt-2 space-y-2 border-l-2 border-border-light dark:border-border-dark ml-2">
                                                {groupedRecords[year].map(record => (
                                                    <li key={record.id}>
                                                        <a
                                                            href="#"
                                                            onClick={(e) => { e.preventDefault(); onSelectRecord(record.id); }}
                                                            aria-current={selectedRecordId === record.id ? 'page' : undefined}
                                                            className={`flex items-center gap-3 p-2 rounded-md transition-colors text-sm relative group ${
                                                                selectedRecordId === record.id
                                                                    ? 'bg-primary-DEFAULT/10'
                                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                            }`}
                                                        >
                                                            {selectedRecordId === record.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-DEFAULT rounded-r-full"></div>}
                                                            <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${selectedRecordId === record.id ? 'bg-primary-DEFAULT/20 text-primary-DEFAULT' : 'bg-gray-200 dark:bg-gray-700 text-subtle-light dark:text-subtle-dark'}`}>
                                                                <span className="material-symbols-outlined text-base">receipt_long</span>
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className={`font-semibold ${selectedRecordId === record.id ? 'text-primary-DEFAULT dark:text-indigo-400' : 'text-text-light dark:text-text-dark'}`}>
                                                                    {record.date}
                                                                </p>
                                                                <p className="truncate text-subtle-light dark:text-subtle-dark text-xs">
                                                                    {record.complaint || 'No complaint listed'}
                                                                </p>
                                                            </div>
                                                            {record.isNew && <span className="w-2 h-2 mr-1 bg-secondary rounded-full" title="New Record"></span>}
                                                        </a>
                                                    </li>
                                                ))}
                                           </ul>
                                       </div>
                                   </li>
                               )
                           }) : (
                                <p className="text-sm text-subtle-light dark:text-subtle-dark p-2 text-center">No records for this person.</p>
                           )}
                        </ul>
                    </div>
                )}
                 {/* Doctors Section */}
                <div className="p-4 border-t border-border-light dark:border-border-dark">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-sm font-semibold text-subtle-light dark:text-subtle-dark uppercase">Doctors</h2>
                    </div>
                    <button onClick={() => onOpenDoctorModal(null)} aria-label="Add a new doctor" className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-text-light dark:text-text-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors mb-3">
                        <span className="material-symbols-outlined text-base">person_add</span>
                        <span>Add Doctor</span>
                    </button>
                    <div className="relative mb-3">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-subtle-light dark:text-subtle-dark text-base pointer-events-none">search</span>
                        <input
                            type="search"
                            placeholder="Search doctors..."
                            value={doctorSearchQuery}
                            onChange={(e) => setDoctorSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT"
                            aria-label="Search doctors"
                        />
                    </div>
                    <ul className="space-y-1 max-h-48 overflow-y-auto">
                        {filteredDoctors.length > 0 ? filteredDoctors.map(doctor => (
                            <li key={doctor.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                                <div className="flex-1 truncate">
                                    <p className="text-sm font-medium">{doctor.name}</p>
                                    <p className="text-xs text-subtle-light dark:text-subtle-dark truncate">{doctor.specialty}</p>
                                </div>
                                <div className="flex items-center shrink-0">
                                    <button onClick={() => onOpenDoctorModal(doctor)} title="Edit Doctor" aria-label={`Edit ${doctor.name}`} className="p-1 text-subtle-light dark:text-subtle-dark hover:text-primary-DEFAULT">
                                        <span className="material-symbols-outlined text-base">edit</span>
                                    </button>
                                    <button onClick={() => onDeleteDoctor(doctor.id)} title="Delete Doctor" aria-label={`Delete ${doctor.name}`} className="p-1 text-subtle-light dark:text-subtle-dark hover:text-red-600">
                                        <span className="material-symbols-outlined text-base">delete</span>
                                    </button>
                                </div>
                            </li>
                        )) : (
                            <p className="text-sm text-subtle-light dark:text-subtle-dark p-2 text-center">No doctors found.</p>
                        )}
                    </ul>
                </div>
            </div>

            {/* Footer/Selected Doctor */}
            <div className="p-4 border-t border-border-light dark:border-border-dark flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-3">
                    <img
                        alt={selectedDoctor ? selectedDoctor.name : "No doctor selected"}
                        className="w-9 h-9 rounded-full"
                        src={selectedDoctor ? `https://picsum.photos/id/${selectedDoctor.id}/200/200` : "https://picsum.photos/id/1011/200/200"}
                    />
                    <div>
                        <p className="font-semibold text-sm">
                            {selectedDoctor ? `Dr. ${selectedDoctor.name}` : "No Doctor Selected"}
                        </p>
                        <p className="text-xs text-subtle-light dark:text-subtle-dark">
                            {selectedDoctor ? selectedDoctor.specialty : "Select a record to view doctor"}
                        </p>
                    </div>
                </div>
                {selectedDoctor && (
                    <button
                        onClick={() => onOpenDoctorModal(selectedDoctor)}
                        className="p-1 text-subtle-light dark:text-subtle-dark hover:text-primary-DEFAULT rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Edit doctor details"
                    >
                        <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;