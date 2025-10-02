import React, { memo, useState, useCallback } from 'react';
import { useOptimizedPatientData } from '../../hooks/useOptimizedPatientData';
import { useOptimizedApp } from '../../contexts/OptimizedAppContext';
import { useToast } from '../../hooks/useToast';
import { ShareWithDoctor } from '../ShareWithDoctor';
import RecordFormModal from '../modals/RecordFormModal';
import { databaseService } from '../../services/databaseService';
import { generatePatientPdf } from '../../services/pdfService';
import AIAssistant from '../AIAssistant';
import type { MedicalRecord } from '../../types';
import './EHRDashboard.css';

interface QuickActionProps {
  icon: string;
  label: string;
  onClick: () => void;
  color?: string;
  disabled?: boolean;
}

const QuickAction = memo(({ icon, label, onClick, color = '#3b82f6', disabled = false }: QuickActionProps) => (
  <button
    className={`quick-action-btn ${disabled ? 'disabled' : ''}`}
    onClick={onClick}
    disabled={disabled}
    style={{ '--action-color': color } as React.CSSProperties}
  >
    <span className="material-symbols-outlined action-icon">{icon}</span>
    <span className="action-label">{label}</span>
  </button>
));

QuickAction.displayName = 'QuickAction';

interface VitalCardProps {
  icon: string;
  label: string;
  value: string;
  status: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  lastUpdated?: string;
}

const VitalCard = memo(({ icon, label, value, status, trend, lastUpdated }: VitalCardProps) => {
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'normal': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (t?: string) => {
    switch (t) {
      case 'up': return 'trending_up';
      case 'down': return 'trending_down';
      case 'stable': return 'trending_flat';
      default: return null;
    }
  };

  return (
    <div className="vital-card">
      <div className="vital-header">
        <span className="material-symbols-outlined vital-icon" style={{ color: getStatusColor(status) }}>
          {icon}
        </span>
        {trend && (
          <span className="material-symbols-outlined trend-icon" style={{ color: getStatusColor(status) }}>
            {getTrendIcon(trend)}
          </span>
        )}
      </div>
      <div className="vital-content">
        <div className="vital-value" style={{ color: getStatusColor(status) }}>
          {value}
        </div>
        <div className="vital-label">{label}</div>
        {lastUpdated && (
          <div className="vital-timestamp">Updated {lastUpdated}</div>
        )}
      </div>
    </div>
  );
});

VitalCard.displayName = 'VitalCard';

export const EHRDashboard = memo(function EHRDashboard() {
  const {
    currentPatient,
    patientStats,
    activeMedications,
    upcomingReminders,
    recentRecords,
    criticalReminders
  } = useOptimizedPatientData();

  const { state, actions } = useOptimizedApp();
  const { showSuccess, showError } = useToast();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);

  const handleShareRecords = useCallback(() => {
    if (!currentPatient) {
      showError('Please select a patient first');
      return;
    }
    setShowShareModal(true);
  }, [currentPatient, showError]);

  const handleExportPDF = useCallback(async () => {
    if (!currentPatient) {
      showError('Please select a patient first');
      return;
    }
    try {
      await generatePatientPdf(currentPatient, state.doctors);
      showSuccess('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError('Failed to export PDF');
    }
  }, [currentPatient, state.doctors, showSuccess, showError]);

  const handleAddRecord = useCallback(() => {
    if (!currentPatient) {
      showError('Please select a patient first');
      return;
    }
    setEditingRecord(null);
    setShowRecordModal(true);
  }, [currentPatient, showError]);

  const handleEditRecord = useCallback((record: MedicalRecord) => {
    setEditingRecord(record);
    setShowRecordModal(true);
  }, []);

  const handleSaveRecord = useCallback(async (recordData: any, files?: File[]) => {
    if (!currentPatient) return;

    try {
      const recordToSave = {
        ...recordData,
        patientId: currentPatient.id,
        updatedAt: new Date().toISOString()
      };

      if (editingRecord) {
        // Update existing record
        const updatedRecord = {
          ...editingRecord,
          ...recordToSave
        };
        await databaseService.saveMedicalRecord(updatedRecord);
        showSuccess('Medical record updated successfully');
      } else {
        // Create new record
        const newRecord = {
          ...recordToSave,
          id: `rec-${Date.now()}`,
          documents: [],
          createdAt: new Date().toISOString()
        };
        await databaseService.saveMedicalRecord(newRecord);
        showSuccess('Medical record added successfully');
      }

      setShowRecordModal(false);
      setEditingRecord(null);
    } catch (error) {
      console.error('Error saving medical record:', error);
      showError('Failed to save medical record');
    }
  }, [currentPatient, editingRecord, showSuccess, showError]);

  const handleAddMedication = useCallback(() => {
    if (!currentPatient) {
      showError('Please select a patient first');
      return;
    }
    // This would open medication modal
    showSuccess('Add medication functionality');
  }, [currentPatient, showError]);

  const handleScheduleAppointment = useCallback(() => {
    if (!currentPatient) {
      showError('Please select a patient first');
      return;
    }
    // This would open appointment modal
    showSuccess('Schedule appointment functionality');
  }, [currentPatient, showError]);

  if (!currentPatient || !patientStats) {
    return (
      <div className="ehr-dashboard empty">
        <div className="empty-state">
          <span className="material-symbols-outlined empty-icon">person_search</span>
          <h3>No Patient Selected</h3>
          <p>Please select a family member from the sidebar to view their health dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ehr-dashboard">
      {/* Patient Profile Header */}
      <div className="patient-profile-header">
        <div className="profile-left">
          <div className="patient-avatar-large">
            <img src={currentPatient.avatarUrl || `https://picsum.photos/seed/${currentPatient.id}/80/80`} alt={currentPatient.name} />
          </div>
          <div className="patient-info">
            <h1 className="patient-name">{currentPatient.name}</h1>
            <div className="patient-details">
              <span className="detail-item">
                <span className="material-symbols-outlined detail-icon">cake</span>
                {patientStats.age} years
              </span>
              <span className="detail-item">
                <span className="material-symbols-outlined detail-icon">wc</span>
                {currentPatient.gender}
              </span>
              <span className="detail-item">
                <span className="material-symbols-outlined detail-icon">bloodtype</span>
                {currentPatient.bloodType}
              </span>
            </div>
            <div className="patient-contact">
              <span className="contact-item">
                <span className="material-symbols-outlined">phone</span>
                {currentPatient.contactInfo?.phone || 'No phone'}
              </span>
              <span className="contact-item">
                <span className="material-symbols-outlined">email</span>
                {currentPatient.contactInfo?.email || 'No email'}
              </span>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <button className="action-btn primary" onClick={handleShareRecords}>
            <span className="material-symbols-outlined">share</span>
            Share
          </button>
          <button className="action-btn secondary" onClick={handleExportPDF}>
            <span className="material-symbols-outlined">picture_as_pdf</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* Medical Alert Banner */}
      {(currentPatient.allergies && currentPatient.allergies.length > 0) && (
        <div className="medical-alert">
          <span className="material-symbols-outlined alert-icon">warning</span>
          <div className="alert-content">
            <strong>Medical Alert:</strong> Allergies - {currentPatient.allergies.join(', ')}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          <QuickAction
            icon="add_chart"
            label="Add Record"
            onClick={handleAddRecord}
            color="#3b82f6"
          />
          <QuickAction
            icon="medication"
            label="Add Medication"
            onClick={handleAddMedication}
            color="#10b981"
          />
          <QuickAction
            icon="calendar_month"
            label="Schedule Appointment"
            onClick={handleScheduleAppointment}
            color="#f59e0b"
          />
          <QuickAction
            icon="upload_file"
            label="Upload Document"
            onClick={() => showSuccess('Upload functionality')}
            color="#8b5cf6"
          />
        </div>
      </div>

      {/* Vital Signs */}
      <div className="vital-signs-section">
        <h2>Vital Signs</h2>
        <div className="vital-signs-grid">
          <VitalCard
            icon="favorite"
            label="Blood Pressure"
            value="120/80"
            status="normal"
            trend="stable"
            lastUpdated="2 hours ago"
          />
          <VitalCard
            icon="monitor_heart"
            label="Heart Rate"
            value="72 bpm"
            status="normal"
            trend="stable"
            lastUpdated="2 hours ago"
          />
          <VitalCard
            icon="thermostat"
            label="Temperature"
            value="98.6°F"
            status="normal"
            trend="stable"
            lastUpdated="1 hour ago"
          />
          <VitalCard
            icon="monitor_weight"
            label="Weight"
            value="165 lbs"
            status="normal"
            trend="down"
            lastUpdated="1 day ago"
          />
        </div>
      </div>

      {/* Health Overview Grid */}
      <div className="health-overview-grid">
        {/* Current Medications */}
        <div className="overview-card medications-card">
          <div className="card-header">
            <h3>
              <span className="material-symbols-outlined card-icon">medication</span>
              Current Medications
            </h3>
            <span className="card-count">{activeMedications.length}</span>
          </div>
          <div className="card-content">
            {activeMedications.length === 0 ? (
              <p className="empty-message">No active medications</p>
            ) : (
              <div className="medications-list">
                {activeMedications.slice(0, 3).map(med => (
                  <div key={med.id} className="medication-item">
                    <div className="med-name">{med.name}</div>
                    <div className="med-dosage">{med.dosage} • {med.frequency}</div>
                  </div>
                ))}
                {activeMedications.length > 3 && (
                  <div className="more-items">+{activeMedications.length - 3} more</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="overview-card reminders-card">
          <div className="card-header">
            <h3>
              <span className="material-symbols-outlined card-icon">notifications</span>
              Upcoming Reminders
            </h3>
            <span className="card-count">{upcomingReminders.length}</span>
          </div>
          <div className="card-content">
            {upcomingReminders.length === 0 ? (
              <p className="empty-message">No upcoming reminders</p>
            ) : (
              <div className="reminders-list">
                {upcomingReminders.slice(0, 3).map(reminder => (
                  <div key={reminder.id} className="reminder-item">
                    <div className="reminder-title">{reminder.title}</div>
                    <div className="reminder-time">
                      {new Date(`${reminder.date} ${reminder.time}`).toLocaleString()}
                    </div>
                  </div>
                ))}
                {upcomingReminders.length > 3 && (
                  <div className="more-items">+{upcomingReminders.length - 3} more</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Records */}
        <div className="overview-card records-card">
          <div className="card-header">
            <h3>
              <span className="material-symbols-outlined card-icon">medical_information</span>
              Recent Records
            </h3>
            <span className="card-count">{recentRecords.length}</span>
          </div>
          <div className="card-content">
            {recentRecords.length === 0 ? (
              <p className="empty-message">No medical records yet</p>
            ) : (
              <div className="records-list">
                {recentRecords.slice(0, 3).map(record => (
                  <div key={record.id} className="record-item">
                    <div className="record-content">
                      <div className="record-date">
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                      <div className="record-diagnosis">{record.diagnosis}</div>
                    </div>
                    <button
                      className="record-edit-btn"
                      onClick={() => handleEditRecord(record)}
                      title="Edit Record"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                ))}
                {recentRecords.length > 3 && (
                  <div className="more-items">+{recentRecords.length - 3} more</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Medical History Summary */}
        <div className="overview-card history-card">
          <div className="card-header">
            <h3>
              <span className="material-symbols-outlined card-icon">history</span>
              Medical History
            </h3>
          </div>
          <div className="card-content">
            {currentPatient.medicalHistory ? (
              <p className="history-text">{currentPatient.medicalHistory}</p>
            ) : (
              <p className="empty-message">No medical history recorded</p>
            )}
          </div>
        </div>

        {/* AI Insights */}
        <div className="overview-card ai-card">
          <div className="card-header">
            <h3>
              <span className="material-symbols-outlined card-icon">smart_toy</span>
              AI Health Insights
            </h3>
          </div>
          <div className="card-content">
            {recentRecords.length > 0 ? (
              <AIAssistant
                record={recentRecords[0]}
                history={currentPatient.medicalHistory || ''}
                patient={currentPatient}
              />
            ) : (
              <p className="empty-message">Add medical records to get AI insights</p>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareWithDoctor
          patient={currentPatient}
          doctors={state.doctors}
          className=""
        />
      )}

      {/* Record Modal */}
      {showRecordModal && (
        <RecordFormModal
          isOpen={showRecordModal}
          onClose={() => {
            setShowRecordModal(false);
            setEditingRecord(null);
          }}
          onSave={handleSaveRecord}
          editData={editingRecord}
          doctors={state.doctors}
        />
      )}
    </div>
  );
});

EHRDashboard.displayName = 'EHRDashboard';