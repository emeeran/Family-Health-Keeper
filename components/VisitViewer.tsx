import React, { useState, useEffect } from 'react';
import { FileText, Brain, Download, Share2, Calendar, User, Stethoscope } from 'lucide-react';
import { MedicalRecord, Doctor, Document } from '../types';
import { MedicalRecordParser, VisitOverview } from '../services/medicalRecordParser';
import VisitOverviewComponent from './VisitOverview';

interface VisitViewerProps {
  record: MedicalRecord;
  doctor?: Doctor;
  documents?: Document[];
  patientName?: string;
  patientId?: string;
  onEdit?: () => void;
  onPrint?: () => void;
  onUpdateRecord?: (patientId: string, recordId: string, updates: Partial<MedicalRecord>) => Promise<void>;
}

const VisitViewer: React.FC<VisitViewerProps> = ({
  record,
  doctor,
  documents = [],
  patientName,
  patientId,
  onEdit,
  onPrint,
  onUpdateRecord,
}) => {
  const [visitOverview, setVisitOverview] = useState<VisitOverview | null>(null);
  const [isGeneratingOverview, setIsGeneratingOverview] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'documents'>('overview');

  // Check for existing AI overview on mount
  useEffect(() => {
    if (record.aiOverview) {
      setVisitOverview(record.aiOverview);
    } else {
      generateVisitOverview();
    }
  }, [record, documents]);

  const generateVisitOverview = async () => {
    setIsGeneratingOverview(true);
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Combine record text with document data
      let combinedText = `
        C/C: ${record.complaint}
        Ix: ${record.investigations}
        D/Dx: ${record.diagnosis}
        R/X: ${record.prescription}
        Notes: ${record.notes}
      `;

      // If there are documents, process them too
      if (documents.length > 0) {
        const documentData = MedicalRecordParser.processMultipleDocuments(documents);
        const parsedData = MedicalRecordParser.parseMedicalRecord(combinedText);

        // Merge data from documents
        parsedData.chiefComplaints = [
          ...new Set([...parsedData.chiefComplaints, ...documentData.chiefComplaints]),
        ];
        parsedData.investigations = [
          ...new Set([...parsedData.investigations, ...documentData.investigations]),
        ];
        parsedData.diagnoses = [...new Set([...parsedData.diagnoses, ...documentData.diagnoses])];
        parsedData.prescriptions = [
          ...new Set([...parsedData.prescriptions, ...documentData.prescriptions]),
        ];
        parsedData.notes = [...new Set([...parsedData.notes, ...documentData.notes])];

        const overview = MedicalRecordParser.generateVisitOverview(parsedData, record);
        setVisitOverview(overview);

        // Save the AI overview to the record for persistence
        if (onUpdateRecord && patientId) {
          try {
            await onUpdateRecord(patientId, record.id, { aiOverview: overview });
          } catch (error) {
            console.error('Failed to save AI overview:', error);
          }
        }
      } else {
        const parsedData = MedicalRecordParser.parseMedicalRecord(combinedText);
        const overview = MedicalRecordParser.generateVisitOverview(parsedData, record);
        setVisitOverview(overview);

        // Save the AI overview to the record for persistence
        if (onUpdateRecord && patientId) {
          try {
            await onUpdateRecord(patientId, record.id, { aiOverview: overview });
          } catch (error) {
            console.error('Failed to save AI overview:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error generating visit overview:', error);
    } finally {
      setIsGeneratingOverview(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Medical Record - ${formatDate(record.date)}`,
          text: `Medical visit summary for ${patientName || 'Patient'} on ${formatDate(record.date)}`,
          // url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const handleExportPDF = () => {
    // This would integrate with a PDF generation library
    window.print();
  };

  return (
    <div className='max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl text-white'>
        <div className='flex items-start justify-between'>
          <div>
            <div className='flex items-center gap-3 mb-2'>
              <div className='w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center'>
                <FileText className='h-6 w-6' />
              </div>
              <div>
                <h2 className='text-2xl font-bold'>Medical Visit</h2>
                <p className='text-blue-100'>{formatDate(record.date)}</p>
              </div>
            </div>

            <div className='flex flex-wrap gap-4 mt-4 text-sm'>
              {patientName && (
                <div className='flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg'>
                  <User className='h-4 w-4' />
                  <span>{patientName}</span>
                </div>
              )}
              {doctor && (
                <div className='flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg'>
                  <Stethoscope className='h-4 w-4' />
                  <span>Dr. {doctor.name}</span>
                  <span className='text-blue-200'>({doctor.specialty})</span>
                </div>
              )}
              <div className='flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg'>
                <Calendar className='h-4 w-4' />
                <span>{formatDate(record.date)}</span>
              </div>
            </div>
          </div>

          <div className='flex gap-2'>
            {/* Persistent Generate Insights Button */}
            <button
              onClick={generateVisitOverview}
              disabled={isGeneratingOverview}
              className='flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50'
              title='Generate AI Insights'
            >
              <Brain className='h-4 w-4' />
              <span className='text-sm font-medium'>
                {isGeneratingOverview ? 'Generating...' : 'Generate Insights'}
              </span>
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className='p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors'
                title='Edit Record'
              >
                <FileText className='h-5 w-5' />
              </button>
            )}
            <button
              onClick={handleShare}
              className='p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors'
              title='Share'
            >
              <Share2 className='h-5 w-5' />
            </button>
            <button
              onClick={handleExportPDF}
              className='p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors'
              title='Export PDF'
            >
              <Download className='h-5 w-5' />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className='border-b border-gray-200 dark:border-gray-700'>
        <nav className='flex space-x-8 px-6'>
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className='flex items-center gap-2'>
              <Brain className='h-4 w-4' />
              Overview of this Visit
            </div>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className='flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              Clinical Details
            </div>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className='flex items-center gap-2'>
              <FileText className='h-4 w-4' />
              Documents ({documents.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className='p-6'>
        {activeTab === 'overview' && (
          <div>
            {isGeneratingOverview ? (
              <div className='flex flex-col items-center justify-center py-12'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4'></div>
                <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                  Generating AI Overview
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Analyzing medical record and documents...
                </p>
              </div>
            ) : visitOverview ? (
              <VisitOverviewComponent
                overview={visitOverview}
                patientName={patientName}
                doctorName={doctor?.name}
                visitDate={record.date}
              />
            ) : (
              <div className='text-center py-12'>
                <Brain className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                  Overview Unavailable
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Unable to generate AI overview for this visit.
                </p>
                <button
                  onClick={generateVisitOverview}
                  className='mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <div className='space-y-6'>
            {/* Chief Complaint */}
            <div className='bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800'>
              <h3 className='text-sm font-semibold text-red-900 dark:text-red-100 mb-2'>
                Chief Complaint
              </h3>
              <p className='text-gray-700 dark:text-gray-300'>{record.complaint}</p>
            </div>

            {/* Investigations */}
            {record.investigations && (
              <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800'>
                <h3 className='text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2'>
                  Investigations
                </h3>
                <p className='text-gray-700 dark:text-gray-300'>{record.investigations}</p>
              </div>
            )}

            {/* Diagnosis */}
            <div className='bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800'>
              <h3 className='text-sm font-semibold text-green-900 dark:text-green-100 mb-2'>
                Diagnosis
              </h3>
              <p className='text-gray-700 dark:text-gray-300'>{record.diagnosis}</p>
            </div>

            {/* Prescription */}
            {record.prescription && (
              <div className='bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800'>
                <h3 className='text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2'>
                  Prescription
                </h3>
                <p className='text-gray-700 dark:text-gray-300 whitespace-pre-line'>
                  {record.prescription}
                </p>
              </div>
            )}

            {/* Notes */}
            {record.notes && (
              <div className='bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800'>
                <h3 className='text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2'>
                  Additional Notes
                </h3>
                <p className='text-gray-700 dark:text-gray-300 whitespace-pre-line'>
                  {record.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            {documents.length > 0 ? (
              <div className='grid gap-4'>
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800'
                  >
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center'>
                        {doc.type === 'pdf' ? (
                          <FileText className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                        ) : (
                          <FileText className='h-5 w-5 text-green-600 dark:text-green-400' />
                        )}
                      </div>
                      <div>
                        <h4 className='font-medium text-gray-900 dark:text-gray-100'>{doc.name}</h4>
                        <p className='text-sm text-gray-500 dark:text-gray-400 capitalize'>
                          {doc.type}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => window.open(doc.url, '_blank')}
                      className='px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <FileText className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                  No Documents
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  No documents have been attached to this medical record.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitViewer;
