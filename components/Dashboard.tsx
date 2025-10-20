import React, { useMemo, useState } from 'react';
import type { Patient, MedicalRecord, Medication, Reminder, Doctor, Appointment } from '../types';
import AppointmentManager from '../src/components/AppointmentManager';
import AIAssistant from './AIAssistant';
import HealthInsights from './HealthInsights';
import CurrentMedications from './CurrentMedications';
import DataSearchPanel from './DataSearchPanel';
import { EyeCareModule } from './EyeCareModule';
import { DiabetesModule } from './DiabetesModule';

interface DashboardProps {
    patient: Patient;
    onViewDetails: () => void;
    doctors?: Doctor[];
    onAddAppointment?: (patientId: string, appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
    onUpdateAppointment?: (patientId: string, appointmentId: string, updates: Partial<Appointment>) => void;
    onDeleteAppointment?: (patientId: string, appointmentId: string) => void;
    onCreateReminderFromAppointment?: (patientId: string, appointmentId: string) => void;
    onAddMedication?: (patientId: string, medication: Omit<Medication, 'id'>) => void;
    onAddBulkMedications?: (patientId: string, medications: Omit<Medication, 'id'>[]) => void;
    onUpdateMedication?: (patientId: string, medication: Medication) => void;
    onDeleteMedication?: (patientId: string, medicationId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    patient,
    onViewDetails,
    doctors = [],
    onAddAppointment,
    onUpdateAppointment,
    onDeleteAppointment,
    onCreateReminderFromAppointment,
    onAddMedication,
    onAddBulkMedications,
    onUpdateMedication,
    onDeleteMedication,
}) => {
    // Calculate health metrics and insights
    const healthMetrics = useMemo(() => {
                const totalMedications = patient.currentMedications.length;
        const activeReminders = patient.reminders.filter(r => !r.completed).length;

        // Get unique diagnoses from records
        const uniqueDiagnoses = [...new Set(patient.records.map(r => r.diagnosis).filter(Boolean))];

        // Get recent visits (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recentVisits = patient.records.filter(r => new Date(r.date) >= sixMonthsAgo);

        // Get upcoming reminders
        const upcomingReminders = patient.reminders
            .filter(r => !r.completed && new Date(r.dateTime) > new Date())
            .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
            .slice(0, 3);

        return {
            totalMedications,
            activeReminders,
            uniqueDiagnoses,
            recentVisits,
            upcomingReminders
        };
    }, [patient]);

    // Group medications by adherence
    const medicationStats = useMemo(() => {
        const medicationsNeedingRefill = patient.currentMedications.filter(m => {
            if (!m.endDate) return false;
            const daysUntilEnd = Math.ceil((new Date(m.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilEnd <= 7;
        });

        return {
            total: patient.currentMedications.length,
            needingRefill: medicationsNeedingRefill.length,
            active: patient.currentMedications.filter(m => !m.endDate || new Date(m.endDate) > new Date()).length
        };
    }, [patient]);

    // Generate health insights
    const healthInsights = useMemo(() => {
        const insights = [];

        // Visit frequency insight
        if (healthMetrics.recentVisits.length === 0) {
            insights.push({
                type: 'warning',
                title: 'No Recent Visits',
                description: 'No medical visits in the last 6 months. Consider scheduling a check-up.',
                icon: 'calendar_month'
            });
        } else if (healthMetrics.recentVisits.length >= 3) {
            insights.push({
                type: 'success',
                title: 'Regular Care',
                description: 'Good follow-up on medical care with multiple recent visits.',
                icon: 'check_circle'
            });
        }

        // Medication adherence insight
        if (medicationStats.needingRefill > 0) {
            insights.push({
                type: 'warning',
                title: 'Medication Refill Needed',
                description: `${medicationStats.needingRefill} medication${medicationStats.needingRefill > 1 ? 's' : ''} need${medicationStats.needingRefill > 1 ? '' : 's'} refill soon.`,
                icon: 'medication'
            });
        }

        // Reminder management insight
        if (healthMetrics.activeReminders > 5) {
            insights.push({
                type: 'info',
                title: 'Active Reminders',
                description: `You have ${healthMetrics.activeReminders} active reminders. Stay on top of your health schedule!`,
                icon: 'notifications'
            });
        }

        // Chronic conditions insight
        const chronicConditions = healthMetrics.uniqueDiagnoses.filter(diagnosis =>
            diagnosis.toLowerCase().includes('diabetes') ||
            diagnosis.toLowerCase().includes('hypertension') ||
            diagnosis.toLowerCase().includes('asthma') ||
            diagnosis.toLowerCase().includes('heart') ||
            diagnosis.toLowerCase().includes('cholesterol')
        );

        if (chronicConditions.length > 0) {
            insights.push({
                type: 'info',
                title: 'Chronic Condition Management',
                description: `Managing ${chronicConditions.length} chronic condition${chronicConditions.length > 1 ? 's' : ''}. Regular monitoring is important.`,
                icon: 'monitor_heart'
            });
        }

        return insights;
    }, [healthMetrics, medicationStats]);

    // Get recent medical history
    const recentHistory = useMemo(() => {
        return patient.records
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(record => ({
                id: record.id,
                date: record.date,
                complaint: record.complaint,
                diagnosis: record.diagnosis,
                doctor: 'Dr. ' + record.doctorId // This would need to be resolved from doctors array
            }));
    }, [patient.records]);

    const getInsightIconColor = (type: string) => {
        switch (type) {
            case 'success': return 'text-green-600';
            case 'warning': return 'text-yellow-600';
            case 'info': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    const getInsightBgColor = (type: string) => {
        switch (type) {
            case 'success': return 'bg-green-50 dark:bg-green-900/20';
            case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20';
            case 'info': return 'bg-blue-50 dark:bg-blue-900/20';
            default: return 'bg-gray-50 dark:bg-gray-900/20';
        }
    };

    // State for active tab in combined container
    const [activeTab, setActiveTab] = useState<'medications' | 'insights'>('medications');

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-light dark:text-text-dark">
                        Health Dashboard
                    </h1>
                    <p className="text-subtle-light dark:text-subtle-dark mt-1">
                        {patient.name}'s health overview and insights
                    </p>
                </div>
                <button
                    onClick={onViewDetails}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-DEFAULT text-white rounded-md hover:bg-primary-dark transition-colors"
                >
                    <span className="material-symbols-outlined">medical_information</span>
                    View Full Records
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-subtle-light dark:text-subtle-dark">Current Medications</p>
                            <p className="text-2xl font-bold text-text-light dark:text-text-dark">{medicationStats.active}</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-green-600">medication</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-subtle-light dark:text-subtle-dark">Active Reminders</p>
                            <p className="text-2xl font-bold text-text-light dark:text-text-dark">{healthMetrics.activeReminders}</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-purple-600">notifications</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-subtle-light dark:text-subtle-dark">Recent Visits</p>
                            <p className="text-2xl font-bold text-text-light dark:text-text-dark">{healthMetrics.recentVisits.length}</p>
                        </div>
                        <span className="material-symbols-outlined text-3xl text-orange-600">calendar_month</span>
                    </div>
                </div>
            </div>

            {/* Medical Data Search */}
            <DataSearchPanel patientId={patient.id} patientName={patient.name} />

            {/* Combined Current Medications and Health Insights - Full Width */}
            {onAddMedication && onUpdateMedication && onDeleteMedication && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    {/* Tab Navigation */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveTab('medications')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        activeTab === 'medications'
                                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <span className="material-symbols-outlined align-middle mr-2">medication</span>
                                    Current Medications
                                </button>
                                <button
                                    onClick={() => setActiveTab('insights')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        activeTab === 'insights'
                                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <span className="material-symbols-outlined align-middle mr-2">insights</span>
                                    Health Insights
                                    {healthInsights.length > 0 && (
                                        <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                                            {healthInsights.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-0">
                        {activeTab === 'medications' && (
                            <div>
                                <CurrentMedications
                                    patient={patient}
                                    doctors={doctors}
                                    onAddMedication={onAddMedication}
                                    onAddBulkMedications={onAddBulkMedications}
                                    onUpdateMedication={onUpdateMedication}
                                    onDeleteMedication={onDeleteMedication}
                                />
                            </div>
                        )}

                        {activeTab === 'insights' && (
                            <div className="p-4">
                                {healthInsights.length > 0 ? (
                                    <div className="space-y-3">
                                        {healthInsights.map((insight, index) => (
                                            <div key={index} className={`p-3 rounded-md ${getInsightBgColor(insight.type)}`}>
                                                <div className="flex items-start gap-3">
                                                    <span className={`material-symbols-outlined ${getInsightIconColor(insight.type)}`}>
                                                        {insight.icon}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-text-light dark:text-text-dark">{insight.title}</p>
                                                        <p className="text-sm text-subtle-light dark:text-subtle-dark">{insight.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">insights</span>
                                        <p className="text-subtle-light dark:text-subtle-dark">
                                            No specific insights at this time
                                        </p>
                                        <p className="text-xs text-subtle-light dark:text-subtle-dark mt-1">
                                            Insights will appear here based on medications and health data
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* HealthGemma AI Insights */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-text-light dark:text-text-dark flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary-600">psychology</span>
                        HealthGemma AI Insights
                    </h2>
                </div>
                <div className="p-4">
                    <AIAssistant
                        record={patient.records[0]}
                        history={patient.medicalHistory}
                        patient={patient}
                    />
                </div>
            </div>

            {/* Recent Medical History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold text-text-light dark:text-text-dark flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-600">history</span>
                        Recent Medical History
                    </h2>
                </div>
                <div className="p-4">
                    {recentHistory.length > 0 ? (
                        <div className="space-y-3">
                            {recentHistory.map((record) => (
                                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0">
                                                <p className="text-sm font-medium text-subtle-light dark:text-subtle-dark">{record.date}</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-text-light dark:text-text-dark">{record.complaint}</p>
                                                <p className="text-sm text-subtle-light dark:text-subtle-dark">
                                                    <span className="font-medium">Diagnosis:</span> {record.diagnosis}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-subtle-light dark:text-subtle-dark">{record.doctor}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-subtle-light dark:text-subtle-dark text-center py-8">
                            No medical records available
                        </p>
                    )}
                </div>
            </div>

            {/* Upcoming Reminders */}
            {healthMetrics.upcomingReminders.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-text-light dark:text-text-dark flex items-center gap-2">
                            <span className="material-symbols-outlined text-purple-600">upcoming</span>
                            Upcoming Reminders
                        </h2>
                    </div>
                    <div className="p-4">
                        <div className="space-y-3">
                            {healthMetrics.upcomingReminders.map((reminder) => (
                                <div key={reminder.id} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                                    <div>
                                        <p className="font-medium text-text-light dark:text-text-dark">{reminder.title}</p>
                                        <p className="text-sm text-subtle-light dark:text-subtle-dark">
                                            {new Date(reminder.dateTime).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-purple-600">schedule</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Appointments */}
            {onAddAppointment && onUpdateAppointment && onDeleteAppointment && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <AppointmentManager
                        patient={patient}
                        doctors={doctors}
                        onAddAppointment={onAddAppointment}
                        onUpdateAppointment={onUpdateAppointment}
                        onDeleteAppointment={onDeleteAppointment}
                        onCreateReminderFromAppointment={onCreateReminderFromAppointment}
                    />
                </div>
            )}

            {/* Eye Care Module */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <EyeCareModule patientId={patient.id} />
            </div>

            {/* Diabetes Module */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <DiabetesModule patientId={patient.id} />
            </div>
        </div>
    );
};

export default Dashboard;