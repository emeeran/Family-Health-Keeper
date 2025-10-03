import React, { useState, useMemo } from 'react';
import { useAppStore } from '../stores/useAppStore';
import type { HbA1cReading, BloodGlucoseReading, DiabetesMedication } from '../types';

interface DiabetesModuleProps {
  patientId: string;
}

export const DiabetesModule: React.FC<DiabetesModuleProps> = ({ patientId }) => {
  const { theme, patients } = useAppStore();
  const patient = patients.find(p => p.id === patientId);
  const diabetesRecord = patient?.diabetesRecord;

  const [activeTab, setActiveTab] = useState<'hba1c' | 'glucose' | 'medications'>('hba1c');
  const [showHba1cForm, setShowHba1cForm] = useState(false);
  const [showGlucoseForm, setShowGlucoseForm] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);

  const isDark = theme === 'dark';

  // Initialize diabetes record if it doesn't exist
  React.useEffect(() => {
    if (patient && !diabetesRecord) {
      // TODO: Initialize diabetes record
      console.log('Initializing diabetes record for patient:', patientId);
    }
  }, [patient, diabetesRecord, patientId]);

  // HbA1c trend calculation
  const hba1cTrend = useMemo(() => {
    if (!diabetesRecord?.hba1cReadings || diabetesRecord.hba1cReadings.length < 2) {
      return null;
    }

    const readings = [...diabetesRecord.hba1cReadings].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const latest = readings[readings.length - 1];
    const previous = readings[readings.length - 2];

    const change = latest.value - previous.value;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return {
      latest: latest.value,
      previous: previous.value,
      change: Math.abs(change),
      trend,
      percentageChange: previous.value ? (change / previous.value) * 100 : 0
    };
  }, [diabetesRecord?.hba1cReadings]);

  // HbA1c status color
  const getHba1cStatus = (value: number) => {
    if (value < 5.7) return { color: 'text-green-600', bg: 'bg-green-50', status: 'Normal' };
    if (value < 6.5) return { color: 'text-yellow-600', bg: 'bg-yellow-50', status: 'Prediabetes' };
    return { color: 'text-red-600', bg: 'bg-red-50', status: 'Diabetes' };
  };

  const handleAddHba1c = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const reading: Omit<HbA1cReading, 'id'> = {
      date: formData.get('date') as string,
      value: parseFloat(formData.get('value') as string),
      method: formData.get('method') as 'lab' | 'home' | 'cgm',
      notes: formData.get('notes') as string || undefined,
      doctorId: formData.get('doctorId') as string || undefined,
    };

    // TODO: Add to store
    console.log('Adding HbA1c reading:', reading);
    setShowHba1cForm(false);
    e.currentTarget.reset();
  };

  const handleAddGlucose = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const reading: Omit<BloodGlucoseReading, 'id'> = {
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      value: parseFloat(formData.get('value') as string),
      type: formData.get('type') as 'fasting' | 'postprandial' | 'random' | 'bedtime',
      context: formData.get('context') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    // TODO: Add to store
    console.log('Adding glucose reading:', reading);
    setShowGlucoseForm(false);
    e.currentTarget.reset();
  };

  const handleAddMedication = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const medication: Omit<DiabetesMedication, 'id'> = {
      name: formData.get('name') as string,
      type: formData.get('type') as 'insulin' | 'oral' | 'injectable',
      dosage: formData.get('dosage') as string,
      frequency: formData.get('frequency') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    // TODO: Add to store
    console.log('Adding diabetes medication:', medication);
    setShowMedicationForm(false);
    e.currentTarget.reset();
  };

  return (
    <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`} style={{ minHeight: '200px' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">monitor_heart</span>
          Diabetes Management
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-300 dark:border-gray-600">
        <button
          onClick={() => setActiveTab('hba1c')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'hba1c'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          HbA1c ({diabetesRecord?.hba1cReadings?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('glucose')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'glucose'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Blood Glucose ({diabetesRecord?.bloodGlucoseReadings?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('medications')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'medications'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Medications ({diabetesRecord?.medications?.length || 0})
        </button>
      </div>

      {/* HbA1c Tab */}
      {activeTab === 'hba1c' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">HbA1c Trends</h3>
            <button
              onClick={() => setShowHba1cForm(!showHba1cForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add Reading
            </button>
          </div>

          {/* HbA1c Trend Summary */}
          {hba1cTrend && (
            <div className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Latest</span>
                      <div className="text-2xl font-bold">{hba1cTrend.latest}%</div>
                      <div className={`text-sm px-2 py-1 rounded ${getHba1cStatus(hba1cTrend.latest).bg} ${getHba1cStatus(hba1cTrend.latest).color}`}>
                        {getHba1cStatus(hba1cTrend.latest).status}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Trend</span>
                      <div className={`text-lg font-semibold flex items-center gap-1 ${
                        hba1cTrend.trend === 'up' ? 'text-red-600' :
                        hba1cTrend.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        <span className="material-symbols-outlined">
                          {hba1cTrend.trend === 'up' ? 'trending_up' :
                           hba1cTrend.trend === 'down' ? 'trending_down' : 'trending_flat'}
                        </span>
                        {hba1cTrend.trend}
                      </div>
                      <div className="text-xs text-gray-500">
                        {hba1cTrend.percentageChange > 0 ? '+' : ''}{hba1cTrend.percentageChange.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HbA1c Form */}
          {showHba1cForm && (
            <form onSubmit={handleAddHba1c} className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Date</label>
                  <input type="date" name="date" required className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">HbA1c Value (%)</label>
                  <input type="number" step="0.1" name="value" required placeholder="e.g., 6.5" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Method</label>
                  <select name="method" required className="w-full p-2 rounded border dark:bg-gray-800">
                    <option value="lab">Lab Test</option>
                    <option value="home">Home Test</option>
                    <option value="cgm">CGM</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Doctor ID</label>
                  <input type="text" name="doctorId" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div className="col-span-2">
                  <label className="block mb-2 font-medium">Notes</label>
                  <textarea name="notes" rows={2} className="w-full p-2 rounded border dark:bg-gray-800"></textarea>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Save Reading
                </button>
                <button type="button" onClick={() => setShowHba1cForm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* HbA1c Readings List */}
          <div className="space-y-3">
            {diabetesRecord?.hba1cReadings?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((reading) => {
              const status = getHba1cStatus(reading.value);
              return (
                <div key={reading.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{new Date(reading.date).toLocaleDateString()}</span>
                        <span className={`text-lg font-bold ${status.color}`}>{reading.value}%</span>
                        <span className={`text-xs px-2 py-1 rounded ${status.bg} ${status.color}`}>
                          {status.status}
                        </span>
                        <span className="text-xs text-gray-500">{reading.method}</span>
                      </div>
                      {reading.notes && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reading.notes}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Blood Glucose Tab */}
      {activeTab === 'glucose' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Blood Glucose Readings</h3>
            <button
              onClick={() => setShowGlucoseForm(!showGlucoseForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add Reading
            </button>
          </div>

          {showGlucoseForm && (
            <form onSubmit={handleAddGlucose} className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Date</label>
                  <input type="date" name="date" required className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Time</label>
                  <input type="time" name="time" required className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Glucose (mg/dL)</label>
                  <input type="number" name="value" required placeholder="e.g., 120" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Type</label>
                  <select name="type" required className="w-full p-2 rounded border dark:bg-gray-800">
                    <option value="fasting">Fasting</option>
                    <option value="postprandial">Postprandial</option>
                    <option value="random">Random</option>
                    <option value="bedtime">Bedtime</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block mb-2 font-medium">Context (optional)</label>
                  <input type="text" name="context" placeholder="e.g., before exercise, after meal" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div className="col-span-2">
                  <label className="block mb-2 font-medium">Notes</label>
                  <textarea name="notes" rows={2} className="w-full p-2 rounded border dark:bg-gray-800"></textarea>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Save Reading
                </button>
                <button type="button" onClick={() => setShowGlucoseForm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {diabetesRecord?.bloodGlucoseReadings?.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()).map((reading) => (
              <div key={reading.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{new Date(reading.date).toLocaleDateString()} {reading.time}</span>
                      <span className="text-lg font-bold">{reading.value} mg/dL</span>
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {reading.type}
                      </span>
                    </div>
                    {reading.context && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Context: {reading.context}</div>}
                    {reading.notes && <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reading.notes}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications Tab */}
      {activeTab === 'medications' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Diabetes Medications</h3>
            <button
              onClick={() => setShowMedicationForm(!showMedicationForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add Medication
            </button>
          </div>

          {showMedicationForm && (
            <form onSubmit={handleAddMedication} className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Medication Name</label>
                  <input type="text" name="name" required placeholder="e.g., Metformin" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Type</label>
                  <select name="type" required className="w-full p-2 rounded border dark:bg-gray-800">
                    <option value="oral">Oral Medication</option>
                    <option value="insulin">Insulin</option>
                    <option value="injectable">Other Injectable</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Dosage</label>
                  <input type="text" name="dosage" required placeholder="e.g., 500mg" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Frequency</label>
                  <input type="text" name="frequency" required placeholder="e.g., twice daily" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Start Date</label>
                  <input type="date" name="startDate" required className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">End Date (optional)</label>
                  <input type="date" name="endDate" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div className="col-span-2">
                  <label className="block mb-2 font-medium">Notes</label>
                  <textarea name="notes" rows={2} className="w-full p-2 rounded border dark:bg-gray-800"></textarea>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Save Medication
                </button>
                <button type="button" onClick={() => setShowMedicationForm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {diabetesRecord?.medications?.map((medication) => (
              <div key={medication.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">{medication.name}</h4>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        {medication.type}
                      </span>
                      <span className="text-sm">{medication.dosage} - {medication.frequency}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <div>Started: {new Date(medication.startDate).toLocaleDateString()}</div>
                      {medication.endDate && <div>Ended: {new Date(medication.endDate).toLocaleDateString()}</div>}
                    </div>
                    {medication.notes && <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">{medication.notes}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};