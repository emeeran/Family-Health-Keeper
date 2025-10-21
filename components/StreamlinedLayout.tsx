import React, { useState, useEffect } from 'react';
import { Users, FileText, Activity, Settings, Plus, Search, Menu, X } from 'lucide-react';
import type { Patient, MedicalRecord } from '../types';
import { useSecureHealthStore } from '../stores/useSecureHealthStore';

interface StreamlinedLayoutProps {
  children: React.ReactNode;
}

const StreamlinedLayout: React.FC<StreamlinedLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'patients' | 'overview' | 'analytics'>('patients');

  const { patients, selectedPatientId, setSelectedPatient, theme } = useSecureHealthStore();

  // Filter patients based on search
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get recent records for overview
  const recentRecords = patients
    .flatMap(p => p.records.map(r => ({ ...r, patientName: p.name, patientId: p.id })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className={`min-h-screen bg-gray-50 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex-shrink-0`}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Patients</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Patient List */}
            <div className="flex-1 overflow-y-auto">
              {filteredPatients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatient(patient.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                    selectedPatientId === patient.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{patient.name}</div>
                  <div className="text-sm text-gray-500">
                    {patient.records.length} records • {patient.currentMedications.length} medications
                  </div>
                  {patient.latestVisitDate && (
                    <div className="text-xs text-gray-400 mt-1">
                      Last visit: {new Date(patient.latestVisitDate).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />
                Add Patient
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Navigation */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {selectedPatient ? selectedPatient.name : 'Family Health Keeper'}
                  </h1>
                  {selectedPatient && (
                    <span className="text-sm text-gray-500">
                      ({selectedPatient.records.length} records)
                    </span>
                  )}
                </div>
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('patients')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'patients' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-1" />
                  Patients
                </button>
                <button
                  onClick={() => setActiveView('overview')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Activity className="h-4 w-4 inline mr-1" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveView('analytics')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-1" />
                  Records
                </button>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default StreamlinedLayout;