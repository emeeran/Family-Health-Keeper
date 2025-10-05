import React, { useMemo, useState } from 'react';
import type { Patient, MedicalRecord, Medication, Reminder, Doctor, Appointment } from '../types';
import AppointmentManager from '../src/components/AppointmentManager';
import AIAssistant from './AIAssistant';
import HealthInsights from './HealthInsights';
import CurrentMedications from './CurrentMedications';
import { EyeCareModule } from './EyeCareModule';
import ProfessionalDiabetesModule from './ProfessionalDiabetesModule';

interface DashboardProps {
  patient: Patient;
  onViewDetails: () => void;
  doctors?: Doctor[];
  onAddAppointment?: (
    patientId: string,
    appointment: Omit<Appointment, 'id' | 'createdAt'>,
  ) => void;
  onUpdateAppointment?: (
    patientId: string,
    appointmentId: string,
    updates: Partial<Appointment>,
  ) => void;
  onDeleteAppointment?: (patientId: string, appointmentId: string) => void;
  onCreateReminderFromAppointment?: (patientId: string, appointmentId: string) => void;
  onAddMedication?: (patientId: string, medication: Omit<Medication, 'id'>) => void;
  onUpdateMedication?: (patientId: string, medication: Medication) => void;
  onDeleteMedication?: (patientId: string, medicationId: string) => void;
}

const AccessibleDashboard: React.FC<DashboardProps> = ({
  patient,
  onViewDetails,
  doctors = [],
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onCreateReminderFromAppointment,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
}) => {
  // Accessibility state management
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [focusedWidget, setFocusedWidget] = useState<string | null>(null);

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
      .filter(r => !r.completed && new Date(`${r.date}T${r.time}`) > new Date())
      .sort(
        (a, b) =>
          new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime(),
      )
      .slice(0, 3);

    return {
      totalMedications,
      activeReminders,
      uniqueDiagnoses,
      recentVisits,
      upcomingReminders,
    };
  }, [patient]);

  // Group medications by adherence
  const medicationStats = useMemo(() => {
    const medicationsNeedingRefill = patient.currentMedications.filter(m => {
      if (!m.endDate) return false;
      const daysUntilEnd = Math.ceil(
        (new Date(m.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysUntilEnd <= 7;
    });

    return {
      total: patient.currentMedications.length,
      needingRefill: medicationsNeedingRefill.length,
      active: patient.currentMedications.filter(m => !m.endDate || new Date(m.endDate) > new Date())
        .length,
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
        icon: 'calendar_month',
        action: 'Schedule appointment',
      });
    } else if (healthMetrics.recentVisits.length >= 3) {
      insights.push({
        type: 'success',
        title: 'Regular Care',
        description: 'Good follow-up on medical care with multiple recent visits.',
        icon: 'check_circle',
        action: null,
      });
    }

    // Medication adherence insight
    if (medicationStats.needingRefill > 0) {
      insights.push({
        type: 'warning',
        title: 'Medication Refill Needed',
        description: `${medicationStats.needingRefill} medication${medicationStats.needingRefill > 1 ? 's' : ''} need${medicationStats.needingRefill > 1 ? '' : 's'} refill soon.`,
        icon: 'medication',
        action: 'Order refills',
      });
    }

    // Reminder management insight
    if (healthMetrics.activeReminders > 5) {
      insights.push({
        type: 'info',
        title: 'Active Reminders',
        description: `You have ${healthMetrics.activeReminders} active reminders. Stay on top of your health schedule!`,
        icon: 'notifications',
        action: 'Manage reminders',
      });
    }

    // Chronic conditions insight
    const chronicConditions = healthMetrics.uniqueDiagnoses.filter(
      diagnosis =>
        diagnosis.toLowerCase().includes('diabetes') ||
        diagnosis.toLowerCase().includes('hypertension') ||
        diagnosis.toLowerCase().includes('asthma') ||
        diagnosis.toLowerCase().includes('heart') ||
        diagnosis.toLowerCase().includes('cholesterol'),
    );

    if (chronicConditions.length > 0) {
      insights.push({
        type: 'info',
        title: 'Chronic Condition Management',
        description: `Managing ${chronicConditions.length} chronic condition${chronicConditions.length > 1 ? 's' : ''}. Regular monitoring is important.`,
        icon: 'monitor_heart',
        action: 'View care plan',
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
        doctor: 'Dr. ' + record.doctorId, // This would need to be resolved from doctors array
      }));
  }, [patient.records]);

  // Accessibility helpers
  const getInsightIconColor = (type: string) => {
    const baseColors = {
      success: highContrastMode ? 'text-green-800' : 'text-green-600',
      warning: highContrastMode ? 'text-yellow-800' : 'text-yellow-600',
      info: highContrastMode ? 'text-blue-800' : 'text-blue-600',
      error: highContrastMode ? 'text-red-800' : 'text-red-600',
    };
    return baseColors[type as keyof typeof baseColors] || 'text-gray-600';
  };

  const getInsightBgColor = (type: string) => {
    const baseColors = {
      success: highContrastMode
        ? 'bg-green-100 border-green-400'
        : 'bg-green-50 dark:bg-green-900/20 border-green-200',
      warning: highContrastMode
        ? 'bg-yellow-100 border-yellow-400'
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200',
      info: highContrastMode
        ? 'bg-blue-100 border-blue-400'
        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200',
      error: highContrastMode
        ? 'bg-red-100 border-red-400'
        : 'bg-red-50 dark:bg-red-900/20 border-red-200',
    };
    return (
      baseColors[type as keyof typeof baseColors] ||
      'bg-gray-50 dark:bg-gray-900/20 border-gray-200'
    );
  };

  const announceToScreenReader = (message: string) => {
    // Create or update live region for screen reader announcements
    let announcement = document.getElementById('sr-announcements');
    if (!announcement) {
      announcement = document.createElement('div');
      announcement.id = 'sr-announcements';
      announcement.setAttribute('aria-live', 'polite');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      document.body.appendChild(announcement);
    }
    announcement.textContent = message;
  };

  const handleSectionFocus = (sectionName: string) => {
    setSelectedSection(sectionName);
    announceToScreenReader(`Focused on ${sectionName} section`);
  };

  const keyboardNavigationHandler = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <div className='min-h-screen bg-background-light dark:bg-background-dark'>
      {/* Screen reader announcements */}
      <div id='sr-announcements' className='sr-only' aria-live='polite' aria-atomic='true'></div>

      {/* Skip to main content link */}
      <a
        href='#main-content'
        className='skip-link'
        onClick={e => {
          e.preventDefault();
          const mainContent = document.getElementById('main-content');
          mainContent?.focus();
          mainContent?.scrollIntoView();
        }}
      >
        Skip to main content
      </a>

      {/* Accessibility Controls */}
      <div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-lg font-semibold mb-3'>Accessibility Options</h2>
          <div className='flex flex-wrap gap-4'>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={highContrastMode}
                onChange={e => {
                  setHighContrastMode(e.target.checked);
                  announceToScreenReader(
                    `High contrast mode ${e.target.checked ? 'enabled' : 'disabled'}`,
                  );
                }}
                className='w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
              />
              <span className='text-sm'>High Contrast</span>
            </label>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={reducedMotion}
                onChange={e => {
                  setReducedMotion(e.target.checked);
                  announceToScreenReader(
                    `Reduced motion ${e.target.checked ? 'enabled' : 'disabled'}`,
                  );
                }}
                className='w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500'
              />
              <span className='text-sm'>Reduced Motion</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main id='main-content' className='max-w-7xl mx-auto p-6 space-y-6' tabIndex={-1}>
        {/* Header */}
        <header
          className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'
          onFocus={() => handleSectionFocus('header')}
          role='banner'
        >
          <div>
            <h1 className='text-3xl font-bold text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1'>
              Health Dashboard
            </h1>
            <p className='text-subtle-light dark:text-subtle-dark mt-1'>
              {patient.name}'s health overview and insights
            </p>
          </div>
          <button
            onClick={onViewDetails}
            className='flex items-center gap-2 px-6 py-3 bg-primary-DEFAULT text-white rounded-lg hover:bg-primary-dark transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 font-medium'
            aria-label='View full medical records'
          >
            <span className='material-symbols-outlined' aria-hidden='true'>
              medical_information
            </span>
            View Full Records
          </button>
        </header>

        {/* Quick Navigation */}
        <nav
          aria-label='Dashboard navigation'
          className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm'
        >
          <h2 className='sr-only'>Quick Navigation</h2>
          <div className='flex flex-wrap gap-2 justify-center'>
            <button
              onClick={() => {
                const element = document.getElementById('medications-section');
                element?.scrollIntoView({ behavior: 'smooth' });
                element?.focus();
                announceToScreenReader('Navigated to medications section');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                focusedWidget === 'medications'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
              onFocus={() => setFocusedWidget('medications')}
              onBlur={() => setFocusedWidget(null)}
            >
              <span className='material-symbols-outlined' aria-hidden='true'>
                medication
              </span>
              Medications
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('appointments-section');
                element?.scrollIntoView({ behavior: 'smooth' });
                element?.focus();
                announceToScreenReader('Navigated to appointments section');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                focusedWidget === 'appointments'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
              onFocus={() => setFocusedWidget('appointments')}
              onBlur={() => setFocusedWidget(null)}
            >
              <span className='material-symbols-outlined' aria-hidden='true'>
                calendar_month
              </span>
              Appointments
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('insights-section');
                element?.scrollIntoView({ behavior: 'smooth' });
                element?.focus();
                announceToScreenReader('Navigated to health insights section');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                focusedWidget === 'insights'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
              onFocus={() => setFocusedWidget('insights')}
              onBlur={() => setFocusedWidget(null)}
            >
              <span className='material-symbols-outlined' aria-hidden='true'>
                insights
              </span>
              Health Insights
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('eye-care-section');
                element?.scrollIntoView({ behavior: 'smooth' });
                element?.focus();
                announceToScreenReader('Navigated to eye care section');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                focusedWidget === 'eye-care'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
              onFocus={() => setFocusedWidget('eye-care')}
              onBlur={() => setFocusedWidget(null)}
            >
              <span className='material-symbols-outlined' aria-hidden='true'>
                visibility
              </span>
              Eye Care
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('diabetes-section');
                element?.scrollIntoView({ behavior: 'smooth' });
                element?.focus();
                announceToScreenReader('Navigated to diabetes management section');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                focusedWidget === 'diabetes'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
              onFocus={() => setFocusedWidget('diabetes')}
              onBlur={() => setFocusedWidget(null)}
            >
              <span className='material-symbols-outlined' aria-hidden='true'>
                monitor_heart
              </span>
              Diabetes
            </button>

            <button
              onClick={() => {
                const element = document.getElementById('ai-assistant-section');
                element?.scrollIntoView({ behavior: 'smooth' });
                element?.focus();
                announceToScreenReader('Navigated to AI assistant section');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                focusedWidget === 'ai-assistant'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-400'
                  : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
              }`}
              onFocus={() => setFocusedWidget('ai-assistant')}
              onBlur={() => setFocusedWidget(null)}
            >
              <span className='material-symbols-outlined' aria-hidden='true'>
                smart_toy
              </span>
              AI Assistant
            </button>
          </div>
        </nav>

        {/* Quick Stats */}
        <section aria-labelledby='stats-heading' onFocus={() => handleSectionFocus('quick stats')}>
          <h2 id='stats-heading' className='sr-only'>
            Quick Health Statistics
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div
              className={`bg-white dark:bg-gray-800 p-6 rounded-lg border ${
                highContrastMode
                  ? 'border-2 border-gray-600'
                  : 'border-gray-200 dark:border-gray-700'
              } focus-within:ring-2 focus-within:ring-primary-500 focus-within:outline-none`}
              tabIndex={0}
              role='article'
              aria-label={`Current active medications: ${medicationStats.active}`}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-subtle-light dark:text-subtle-dark'>
                    Current Medications
                  </p>
                  <p
                    className='text-2xl font-bold text-text-light dark:text-text-dark'
                    aria-live='polite'
                  >
                    {medicationStats.active}
                  </p>
                </div>
                <span
                  className='material-symbols-outlined text-3xl text-green-600'
                  aria-hidden='true'
                >
                  medication
                </span>
              </div>
            </div>

            <div
              className={`bg-white dark:bg-gray-800 p-6 rounded-lg border ${
                highContrastMode
                  ? 'border-2 border-gray-600'
                  : 'border-gray-200 dark:border-gray-700'
              } focus-within:ring-2 focus-within:ring-primary-500 focus-within:outline-none`}
              tabIndex={0}
              role='article'
              aria-label={`Active reminders: ${healthMetrics.activeReminders}`}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-subtle-light dark:text-subtle-dark'>
                    Active Reminders
                  </p>
                  <p
                    className='text-2xl font-bold text-text-light dark:text-text-dark'
                    aria-live='polite'
                  >
                    {healthMetrics.activeReminders}
                  </p>
                </div>
                <span
                  className='material-symbols-outlined text-3xl text-purple-600'
                  aria-hidden='true'
                >
                  notifications
                </span>
              </div>
            </div>

            <div
              className={`bg-white dark:bg-gray-800 p-6 rounded-lg border ${
                highContrastMode
                  ? 'border-2 border-gray-600'
                  : 'border-gray-200 dark:border-gray-700'
              } focus-within:ring-2 focus-within:ring-primary-500 focus-within:outline-none`}
              tabIndex={0}
              role='article'
              aria-label={`Recent visits in last 6 months: ${healthMetrics.recentVisits.length}`}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-subtle-light dark:text-subtle-dark'>
                    Recent Visits
                  </p>
                  <p
                    className='text-2xl font-bold text-text-light dark:text-text-dark'
                    aria-live='polite'
                  >
                    {healthMetrics.recentVisits.length}
                  </p>
                </div>
                <span
                  className='material-symbols-outlined text-3xl text-orange-600'
                  aria-hidden='true'
                >
                  calendar_month
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Health Insights */}
        <section
          id='insights-section'
          aria-labelledby='insights-heading'
          onFocus={() => handleSectionFocus('health insights')}
          tabIndex={-1}
        >
          <h2 id='insights-heading' className='text-xl font-semibold mb-4'>
            Health Insights
          </h2>
          <div className='space-y-4'>
            {healthInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border focus-within:ring-2 focus-within:ring-primary-500 focus-within:outline-none ${getInsightBgColor(insight.type)}`}
                role='article'
                tabIndex={0}
                aria-labelledby={`insight-title-${index}`}
                aria-describedby={`insight-desc-${index}`}
              >
                <div className='flex items-start gap-3'>
                  <span
                    className={`material-symbols-outlined text-xl ${getInsightIconColor(insight.type)}`}
                    aria-hidden='true'
                  >
                    {insight.icon}
                  </span>
                  <div className='flex-1'>
                    <h3
                      id={`insight-title-${index}`}
                      className='font-semibold text-text-light dark:text-text-dark'
                    >
                      {insight.title}
                    </h3>
                    <p
                      id={`insight-desc-${index}`}
                      className='text-sm text-text-light dark:text-text-dark mt-1'
                    >
                      {insight.description}
                    </p>
                    {insight.action && (
                      <button
                        className='mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1'
                        onClick={() =>
                          announceToScreenReader(`Action triggered: ${insight.action}`)
                        }
                      >
                        {insight.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Current Medications */}
          {onAddMedication && onUpdateMedication && onDeleteMedication && (
            <section
              id='medications-section'
              aria-labelledby='medications-heading'
              onFocus={() => handleSectionFocus('medications')}
              tabIndex={-1}
            >
              <h2 id='medications-heading' className='text-xl font-semibold mb-4'>
                Current Medications
              </h2>
              <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500 focus-within:outline-none'>
                <CurrentMedications
                  patient={patient}
                  onAddMedication={onAddMedication}
                  onUpdateMedication={onUpdateMedication}
                  onDeleteMedication={onDeleteMedication}
                  onRequestReminder={medicationData => {
                    // Handle reminder request for medication
                    console.log('Reminder requested for medication:', medicationData);
                  }}
                />
              </div>
            </section>
          )}

          {/* Appointments */}
          {onAddAppointment && onUpdateAppointment && onDeleteAppointment && (
            <section
              id='appointments-section'
              aria-labelledby='appointments-heading'
              onFocus={() => handleSectionFocus('appointments')}
              tabIndex={-1}
            >
              <h2 id='appointments-heading' className='text-xl font-semibold mb-4'>
                Appointments
              </h2>
              <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500 focus-within:outline-none'>
                <AppointmentManager
                  patient={patient}
                  doctors={doctors}
                  onAddAppointment={appointment => onAddAppointment?.(patient.id, appointment)}
                  onUpdateAppointment={(appointmentId, updates) =>
                    onUpdateAppointment?.(patient.id, appointmentId, updates)
                  }
                  onDeleteAppointment={appointmentId =>
                    onDeleteAppointment?.(patient.id, appointmentId)
                  }
                  onCreateReminder={appointmentId =>
                    onCreateReminderFromAppointment?.(patient.id, appointmentId)
                  }
                />
              </div>
            </section>
          )}
        </div>

        {/* Specialized Modules */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Eye Care Module */}
          <section
            id='eye-care-section'
            aria-labelledby='eye-care-heading'
            onFocus={() => handleSectionFocus('eye care')}
            tabIndex={-1}
          >
            <h2 id='eye-care-heading' className='text-xl font-semibold mb-4'>
              Eye Care
            </h2>
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500 focus-within:outline-none'>
              <EyeCareModule
                eyeRecord={patient.eyeRecord}
                onUpdate={eyeRecord => {
                  // Handle eye record updates
                  announceToScreenReader('Eye care record updated');
                }}
              />
            </div>
          </section>

          {/* Diabetes Module */}
          <section
            id='diabetes-section'
            aria-labelledby='diabetes-heading'
            onFocus={() => handleSectionFocus('diabetes')}
            tabIndex={-1}
          >
            <h2 id='diabetes-heading' className='text-xl font-semibold mb-4'>
              Diabetes Management
            </h2>
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500 focus-within:outline-none'>
              <ProfessionalDiabetesModule patientId={patient.id} />
            </div>
          </section>
        </div>

        {/* AI Assistant */}
        <section
          id='ai-assistant-section'
          aria-labelledby='ai-assistant-heading'
          onFocus={() => handleSectionFocus('ai assistant')}
          tabIndex={-1}
        >
          <h2 id='ai-assistant-heading' className='text-xl font-semibold mb-4'>
            AI Health Assistant
          </h2>
          <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-primary-500 focus-within:outline-none'>
            <AIAssistant patient={patient} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 py-6'>
        <div className='max-w-7xl mx-auto px-6 text-center text-sm text-gray-600 dark:text-gray-400'>
          <p>
            Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
          <p className='mt-2'>
            This dashboard supports keyboard navigation and screen readers for accessibility. Press
            Tab to navigate, Enter to activate buttons, and use screen reader shortcuts for more
            options.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AccessibleDashboard;
