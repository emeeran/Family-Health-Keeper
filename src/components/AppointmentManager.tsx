import React, { useState, useMemo } from 'react';
import type { Appointment, Doctor, Patient } from '../../types';

interface AppointmentManagerProps {
  patient: Patient;
  doctors: Doctor[];
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => void;
  onUpdateAppointment: (appointmentId: string, updates: Partial<Appointment>) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onCreateReminder: (appointmentId: string) => void;
}

const AppointmentManager: React.FC<AppointmentManagerProps> = ({
  patient,
  doctors,
  onAddAppointment,
  onUpdateAppointment,
  onDeleteAppointment,
  onCreateReminder,
}) => {
  const [isAddingAppointment, setIsAddingAppointment] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | Appointment['status']>('all');
  const [viewMode, setViewMode] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const [formData, setFormData] = useState<Partial<Appointment>>({
    doctorId: '',
    date: '',
    time: '',
    duration: 30,
    type: 'consultation',
    status: 'scheduled',
    reason: '',
    notes: '',
    location: '',
    reminderSet: true,
    reminderTime: '1 day before',
  });

  const filteredAppointments = useMemo(() => {
    let appointments = patient.appointments || [];
    
    // Filter by status
    if (filterStatus !== 'all') {
      appointments = appointments.filter(apt => apt.status === filterStatus);
    }

    // Filter by view mode
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (viewMode === 'upcoming') {
      appointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= today && apt.status !== 'completed' && apt.status !== 'cancelled';
      });
    } else if (viewMode === 'past') {
      appointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate < today || apt.status === 'completed';
      });
    }

    // Sort by date and time
    return appointments.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [patient.appointments, filterStatus, viewMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.doctorId || !formData.date || !formData.time || !formData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingAppointmentId) {
      onUpdateAppointment(editingAppointmentId, formData);
      setEditingAppointmentId(null);
    } else {
      onAddAppointment({
        ...formData as Omit<Appointment, 'id' | 'createdAt'>,
        patientId: patient.id,
      });
    }

    resetForm();
    setIsAddingAppointment(false);
  };

  const handleEdit = (appointment: Appointment) => {
    setFormData(appointment);
    setEditingAppointmentId(appointment.id);
    setIsAddingAppointment(true);
  };

  const handleCancel = (appointmentId: string) => {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      onUpdateAppointment(appointmentId, { status: 'cancelled' });
    }
  };

  const handleComplete = (appointmentId: string) => {
    onUpdateAppointment(appointmentId, { status: 'completed' });
  };

  const resetForm = () => {
    setFormData({
      doctorId: '',
      date: '',
      time: '',
      duration: 30,
      type: 'consultation',
      status: 'scheduled',
      reason: '',
      notes: '',
      location: '',
      reminderSet: true,
      reminderTime: '1 day before',
    });
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? `${doctor.name} (${doctor.specialty})` : 'Unknown Doctor';
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: Appointment['type']) => {
    switch (type) {
      case 'consultation': return 'medical_services';
      case 'followup': return 'event_repeat';
      case 'procedure': return 'healing';
      case 'checkup': return 'monitor_heart';
      case 'emergency': return 'emergency';
      default: return 'event';
    }
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-card p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-2xl">calendar_month</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Appointments</h2>
            <p className="text-sm text-subtle-light dark:text-subtle-dark">Manage doctor appointments</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddingAppointment(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors shadow-button hover:shadow-button-hover"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>New Appointment</span>
        </button>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('upcoming')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'upcoming'
              ? 'bg-primary-500 text-white'
              : 'bg-surface-hover-light dark:bg-surface-hover-dark text-text-light dark:text-text-dark'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setViewMode('past')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'past'
              ? 'bg-primary-500 text-white'
              : 'bg-surface-hover-light dark:bg-surface-hover-dark text-text-light dark:text-text-dark'
          }`}
        >
          Past
        </button>
        <button
          onClick={() => setViewMode('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-surface-hover-light dark:bg-surface-hover-dark text-text-light dark:text-text-dark'
          }`}
        >
          All
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="rescheduled">Rescheduled</option>
        </select>
      </div>

      {/* Add/Edit Form Modal */}
      {isAddingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingAppointmentId ? 'Edit Appointment' : 'New Appointment'}
                </h3>
                <button
                  onClick={() => {
                    setIsAddingAppointment(false);
                    setEditingAppointmentId(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Doctor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Doctor *
                  </label>
                  <select
                    value={formData.doctorId}
                    onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Type and Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Appointment['type'] })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="consultation">Consultation</option>
                      <option value="followup">Follow-up</option>
                      <option value="procedure">Procedure</option>
                      <option value="checkup">Check-up</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      min="15"
                      step="15"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Visit *
                  </label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    required
                    placeholder="e.g., Regular checkup, Follow-up consultation"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Clinic/Hospital address"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional notes..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Reminder Settings */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.reminderSet}
                      onChange={(e) => setFormData({ ...formData, reminderSet: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Set Reminder</span>
                  </label>
                  {formData.reminderSet && (
                    <select
                      value={formData.reminderTime}
                      onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="15 minutes before">15 minutes before</option>
                      <option value="30 minutes before">30 minutes before</option>
                      <option value="1 hour before">1 hour before</option>
                      <option value="2 hours before">2 hours before</option>
                      <option value="1 day before">1 day before</option>
                      <option value="2 days before">2 days before</option>
                    </select>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingAppointment(false);
                      setEditingAppointmentId(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                  >
                    {editingAppointmentId ? 'Update' : 'Schedule'} Appointment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-subtle-light dark:text-subtle-dark">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">event_busy</span>
            <p>No appointments found</p>
          </div>
        ) : (
          filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-surface-hover-light dark:bg-surface-hover-dark rounded-xl p-4 border border-border-light dark:border-border-dark hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary-600 dark:text-primary-400">
                      {getTypeIcon(appointment.type)}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-text-light dark:text-text-dark">
                        {appointment.reason}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm text-subtle-light dark:text-subtle-dark">
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">person</span>
                        {getDoctorName(appointment.doctorId)}
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">schedule</span>
                        {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                        {appointment.duration && ` (${appointment.duration} min)`}
                      </p>
                      {appointment.location && (
                        <p className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base">location_on</span>
                          {appointment.location}
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="mt-2 text-xs italic">{appointment.notes}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {appointment.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleComplete(appointment.id)}
                        className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400"
                        title="Mark as completed"
                      >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </button>
                      <button
                        onClick={() => handleEdit(appointment)}
                        className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleCancel(appointment.id)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                        title="Cancel"
                      >
                        <span className="material-symbols-outlined text-lg">cancel</span>
                      </button>
                    </>
                  )}
                  {appointment.reminderSet && !appointment.completed && (
                    <button
                      onClick={() => onCreateReminder(appointment.id)}
                      className="p-2 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                      title="Create reminder"
                    >
                      <span className="material-symbols-outlined text-lg">notifications</span>
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteAppointment(appointment.id)}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                    title="Delete"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AppointmentManager;
