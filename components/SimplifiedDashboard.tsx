import React from 'react';
import { Activity, Users, FileText, Pill, Calendar, TrendingUp, Clock, AlertTriangle, Plus } from 'lucide-react';
import type { Patient, MedicalRecord } from '../types';

interface SimplifiedDashboardProps {
  patients: Patient[];
  selectedPatient?: Patient;
  onSelectPatient: (patientId: string) => void;
  onAddPatient: () => void;
  onAddRecord: (patientId: string) => void;
}

const SimplifiedDashboard: React.FC<SimplifiedDashboardProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  onAddPatient,
  onAddRecord,
}) => {
  // Calculate health metrics
  const totalPatients = patients.length;
  const totalRecords = patients.reduce((sum, p) => sum + p.records.length, 0);
  const totalMedications = patients.reduce((sum, p) => sum + p.currentMedications.length, 0);

  // Get recent activity
  const recentRecords = patients
    .flatMap(p => p.records.map(r => ({ ...r, patientName: p.name, patientId: p.id })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Patients with recent visits (last 30 days)
  const recentPatients = patients.filter(patient => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return patient.records.some(record => new Date(record.date) >= thirtyDaysAgo);
  });

  return (
    <div className="p-6 space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalPatients}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalRecords}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Medications</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalMedications}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Pill className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{recentPatients.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Patients
              </h2>
            </div>
            <div className="p-6">
              {patients.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Yet</h3>
                  <p className="text-gray-500 mb-4">Add your first patient to get started</p>
                  <button
                    onClick={onAddPatient}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Patient
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {patients.slice(0, 5).map(patient => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => onSelectPatient(patient.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {patient.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{patient.name}</h3>
                          <p className="text-sm text-gray-500">
                            {patient.records.length} records • {patient.age} years old
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {patient.records.length > 0 && (
                          <span className="text-xs text-gray-500">
                            Last visit: {new Date(patient.latestVisitDate || '').toLocaleDateString()}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddRecord(patient.id);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {patients.length > 5 && (
                    <div className="text-center pt-4">
                      <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                        View all {patients.length} patients →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </h2>
            </div>
            <div className="p-6">
              {recentRecords.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRecords.map(record => (
                    <div key={record.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {record.complaint}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.patientName} • {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onAddPatient}
            className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Add New Patient</h3>
              <p className="text-sm text-blue-700">Register a new family member</p>
            </div>
          </button>

          <button
            onClick={() => selectedPatient && onAddRecord(selectedPatient.id)}
            disabled={!selectedPatient}
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">Add Medical Record</h3>
              <p className="text-sm text-green-700">
                {selectedPatient ? `Add record for ${selectedPatient.name}` : 'Select a patient first'}
              </p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-purple-900">Schedule Appointment</h3>
              <p className="text-sm text-purple-700">Set up upcoming visits</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedDashboard;