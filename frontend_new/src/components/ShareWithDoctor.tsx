import React, { useState, useEffect } from 'react';
import { WhatsAppShareService } from '../services/whatsappService';
import type { Patient, Doctor, MedicalRecord } from '../types';

interface ShareWithDoctorProps {
  patient: Patient;
  doctors: Doctor[];
  selectedRecordId?: string;
  className?: string;
}

interface ShareOptions {
  includeFullHistory: boolean;
  includeMedications: boolean;
  includeAllergies: boolean;
  includeRecentVisits: boolean;
  maxRecentVisits: number;
  customMessage: string;
}

export const ShareWithDoctor: React.FC<ShareWithDoctorProps> = ({
  patient,
  doctors,
  selectedRecordId,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    includeFullHistory: true,
    includeMedications: true,
    includeAllergies: true,
    includeRecentVisits: true,
    maxRecentVisits: 3,
    customMessage: ''
  });
  const [isSharing, setIsSharing] = useState(false);

  // Close panel on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
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
  }, [isOpen]);

  const handleShare = async (shareMode: 'whatsapp' | 'summary') => {
    if (!selectedDoctor && shareMode === 'whatsapp') {
      alert('Please select a doctor to share with.');
      return;
    }

    setIsSharing(true);

    try {
      const doctor = doctors.find(d => d.id === selectedDoctor);

      if (shareMode === 'whatsapp' && doctor) {
        WhatsAppShareService.shareWithDoctor(
          patient,
          doctor,
          selectedRecordId,
          shareOptions
        );
      } else if (shareMode === 'summary') {
        const message = WhatsAppShareService.generatePatientSummary(patient, shareOptions);
        WhatsAppShareService.shareWhatsApp(message);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share. Please try again.');
    } finally {
      setIsSharing(false);
      setIsOpen(false);
    }
  };

  const handleQuickShare = () => {
    const quickOptions: ShareOptions = {
      includeFullHistory: true,
      includeMedications: true,
      includeAllergies: true,
      includeRecentVisits: true,
      maxRecentVisits: 2,
      customMessage: 'Quick summary for consultation'
    };

    const message = WhatsAppShareService.generatePatientSummary(patient, quickOptions);
    WhatsAppShareService.shareWhatsApp(message);
  };

  const handleShareCurrentVisit = () => {
    if (!selectedRecordId) return;

    const record = patient.records.find(r => r.id === selectedRecordId);
    if (!record) return;

    const message = WhatsAppShareService.generateMedicalRecordSummary(patient, record);
    WhatsAppShareService.shareWhatsApp(message);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 shadow-sm"
        title="Share with Doctor"
      >
        <span className="material-symbols-outlined text-sm">share</span>
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Right Side Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-in Panel */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-surface-light dark:bg-surface-dark shadow-panel z-50 transform transition-all-300 ease-out animate-slide-in-right">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-light dark:border-border-dark bg-gradient-to-r from-secondary-50 to-transparent dark:from-secondary-900/10 dark:to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center shadow-lg">
                    <span className="material-symbols-outlined text-white">share</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
                      Share Medical Information
                    </h2>
                    <p className="text-sm text-subtle-light dark:text-subtle-dark">
                      {patient.name}'s medical details
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn-ghost p-2 rounded-xl hover-lift"
                  title="Close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Quick Share Options
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={handleQuickShare}
                      disabled={isSharing}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">send</span>
                      <div className="text-left">
                        <div className="font-medium">Quick Summary</div>
                        <div className="text-xs opacity-75">Essential information for any doctor</div>
                      </div>
                    </button>

                    {selectedRecordId && (
                      <button
                        onClick={handleShareCurrentVisit}
                        disabled={isSharing}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                        <div className="text-left">
                          <div className="font-medium">Current Visit Only</div>
                          <div className="text-xs opacity-75">Share today's visit details</div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Doctor Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Share with Specific Doctor
                  </h3>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a doctor...</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.name} - {doctor.specialization || 'General Practitioner'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Share Options */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Include Information
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareOptions.includeFullHistory}
                        onChange={(e) => setShareOptions(prev => ({
                          ...prev,
                          includeFullHistory: e.target.checked
                        }))}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Full Medical History
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareOptions.includeMedications}
                        onChange={(e) => setShareOptions(prev => ({
                          ...prev,
                          includeMedications: e.target.checked
                        }))}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Current Medications
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareOptions.includeAllergies}
                        onChange={(e) => setShareOptions(prev => ({
                          ...prev,
                          includeAllergies: e.target.checked
                        }))}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Allergies
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareOptions.includeRecentVisits}
                        onChange={(e) => setShareOptions(prev => ({
                          ...prev,
                          includeRecentVisits: e.target.checked
                        }))}
                        className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Recent Visits
                      </span>
                    </label>

                    {shareOptions.includeRecentVisits && (
                      <div className="ml-7">
                        <label className="text-xs text-gray-600 dark:text-gray-400">
                          Number of recent visits:
                        </label>
                        <select
                          value={shareOptions.maxRecentVisits}
                          onChange={(e) => setShareOptions(prev => ({
                            ...prev,
                            maxRecentVisits: parseInt(e.target.value)
                          }))}
                          className="mt-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={5}>5</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Custom Message */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Additional Message (Optional)
                    </label>
                    <textarea
                      value={shareOptions.customMessage}
                      onChange={(e) => setShareOptions(prev => ({
                        ...prev,
                        customMessage: e.target.value
                      }))}
                      placeholder="Add any specific concerns or questions..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Action Buttons */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleShare('summary')}
                    disabled={isSharing}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">summarize</span>
                    {isSharing ? 'Sharing...' : 'Share Summary'}
                  </button>

                  {selectedDoctor && (
                    <button
                      onClick={() => handleShare('whatsapp')}
                      disabled={isSharing}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">WhatsApp</span>
                      {isSharing ? 'Sharing...' : 'Share via WhatsApp'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};