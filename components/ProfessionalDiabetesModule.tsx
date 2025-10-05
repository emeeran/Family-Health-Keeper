import React, { useState, useMemo } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Pill,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Target,
  Droplet,
} from 'lucide-react';
import type {
  DiabetesRecord,
  HbA1cReading,
  BloodGlucoseReading,
  DiabetesMedication,
} from '../types';

interface ProfessionalDiabetesModuleProps {
  diabetesRecord?: DiabetesRecord;
  onUpdate?: (diabetesRecord: DiabetesRecord) => void;
}

const ProfessionalDiabetesModule: React.FC<ProfessionalDiabetesModuleProps> = ({
  diabetesRecord,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'hba1c' | 'glucose' | 'medications'>(
    'overview',
  );
  const [showHba1cForm, setShowHba1cForm] = useState(false);
  const [showGlucoseForm, setShowGlucoseForm] = useState(false);
  const [showMedicationForm, setShowMedicationForm] = useState(false);

  // Calculate diabetes management metrics
  const diabetesMetrics = useMemo(() => {
    if (!diabetesRecord) return null;

    // Latest HbA1c
    const latestHbA1c =
      diabetesRecord.hba1cReadings.length > 0
        ? diabetesRecord.hba1cReadings[diabetesRecord.hba1cReadings.length - 1]
        : null;

    // HbA1c trend (last 3 readings)
    const recentHbA1c = diabetesRecord.hba1cReadings.slice(-3);
    let hba1cTrend: 'improving' | 'stable' | 'worsening' | null = null;
    if (recentHbA1c.length >= 2) {
      const first = recentHbA1c[0].value;
      const last = recentHbA1c[recentHbA1c.length - 1].value;
      const change = last - first;
      if (Math.abs(change) < 0.3) hba1cTrend = 'stable';
      else if (change < 0) hba1cTrend = 'improving';
      else hba1cTrend = 'worsening';
    }

    // Average blood glucose by type
    const glucoseByType = diabetesRecord.bloodGlucoseReadings.reduce(
      (acc, reading) => {
        if (!acc[reading.type]) {
          acc[reading.type] = { total: 0, count: 0, readings: [] };
        }
        acc[reading.type].total += reading.value;
        acc[reading.type].count += 1;
        acc[reading.type].readings.push(reading);
        return acc;
      },
      {} as Record<string, { total: number; count: number; readings: BloodGlucoseReading[] }>,
    );

    // Calculate averages
    const averageGlucose = Object.entries(glucoseByType).reduce(
      (acc, [type, data]) => {
        acc[type] = {
          average: data.total / data.count,
          count: data.count,
          inRange: data.readings.filter(r => {
            const { min, max } = diabetesRecord.targetGlucoseRanges[type] || { min: 80, max: 130 };
            return r.value >= min && r.value <= max;
          }).length,
        };
        return acc;
      },
      {} as Record<string, { average: number; count: number; inRange: number }>,
    );

    // Time in range percentage
    const totalReadings = diabetesRecord.bloodGlucoseReadings.length;
    const inRangeReadings = Object.values(averageGlucose).reduce(
      (sum, data) => sum + data.inRange,
      0,
    );
    const timeInRange = totalReadings > 0 ? (inRangeReadings / totalReadings) * 100 : 0;

    // Recent readings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentGlucoseReadings = diabetesRecord.bloodGlucoseReadings.filter(
      reading => new Date(`${reading.date}T${reading.time}`) >= sevenDaysAgo,
    );

    // Active medications
    const activeMedications = diabetesRecord.medications.filter(
      med => !med.endDate || new Date(med.endDate) > new Date(),
    );

    // Check if targets are being met
    const targetsMet =
      latestHbA1c && diabetesRecord.targetHba1c
        ? latestHbA1c.value <= diabetesRecord.targetHba1c
        : null;

    return {
      latestHbA1c,
      hba1cTrend,
      averageGlucose,
      timeInRange,
      recentGlucoseCount: recentGlucoseReadings.length,
      activeMedationsCount: activeMedications.length,
      totalMedications: diabetesRecord.medications.length,
      targetsMet,
      totalGlucoseReadings: totalReadings,
      lastCheckup: diabetesRecord.lastCheckup,
      nextCheckup: diabetesRecord.nextCheckup,
    };
  }, [diabetesRecord]);

  const getHbA1cColor = (value: number) => {
    if (value < 5.7) return 'text-green-600';
    if (value < 6.5) return 'text-yellow-600';
    if (value < 8.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGlucoseColor = (value: number, type: string) => {
    const ranges = {
      fasting: { min: 80, max: 130 },
      postprandial: { min: 80, max: 180 },
      random: { min: 70, max: 140 },
      bedtime: { min: 100, max: 180 },
    };

    const range = ranges[type as keyof typeof ranges] || ranges.random;
    if (value >= range.min && value <= range.max) return 'text-green-600';
    if (value < range.min - 20) return 'text-blue-600'; // Too low
    return 'text-red-600'; // Too high
  };

  const getTimeInRangeColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className='h-4 w-4 text-green-600' />;
      case 'worsening':
        return <TrendingUp className='h-4 w-4 text-red-600' />;
      case 'stable':
        return <div className='w-4 h-4 bg-gray-400 rounded-full' />;
      default:
        return null;
    }
  };

  if (!diabetesRecord) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8'>
        <div className='text-center'>
          <Activity className='h-16 w-16 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
            No Diabetes Record
          </h3>
          <p className='text-gray-500 dark:text-gray-400'>
            Start tracking diabetes management by initializing your record.
          </p>
          <button className='mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'>
            Initialize Diabetes Record
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700'>
      {/* Header */}
      <div className='bg-gradient-to-r from-indigo-700 to-purple-800 p-6 rounded-t-xl'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <div className='w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20'>
              <Activity className='h-7 w-7 text-white' />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-white mb-1'>Diabetes Care Management</h2>
              <p className='text-indigo-200 text-sm'>
                Professional glycemic monitoring & treatment optimization
              </p>
            </div>
          </div>
          <div className='flex gap-2'>
            <button
              className='p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg transition-all border border-white/20'
              title='Export diabetes records'
            >
              <Download className='h-5 w-5 text-indigo-200' />
            </button>
            <button className='flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-800 rounded-lg hover:bg-indigo-50 transition-all font-medium shadow-sm'>
              <Plus className='h-5 w-5' />
              Add Reading
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {diabetesMetrics && (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20'>
              <div className='text-purple-100 text-sm'>Latest HbA1c</div>
              <div
                className={`text-2xl font-bold ${diabetesMetrics.latestHbA1c ? getHbA1cColor(diabetesMetrics.latestHbA1c.value) : 'text-white'}`}
              >
                {diabetesMetrics.latestHbA1c ? `${diabetesMetrics.latestHbA1c.value}%` : 'N/A'}
              </div>
              {diabetesMetrics.hba1cTrend && (
                <div className='flex items-center gap-1 mt-1'>
                  {getTrendIcon(diabetesMetrics.hba1cTrend)}
                  <span className='text-xs text-purple-200 capitalize'>
                    {diabetesMetrics.hba1cTrend}
                  </span>
                </div>
              )}
            </div>
            <div className='bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20'>
              <div className='text-purple-100 text-sm'>Time in Range</div>
              <div
                className={`text-2xl font-bold ${getTimeInRangeColor(diabetesMetrics.timeInRange)}`}
              >
                {diabetesMetrics.timeInRange.toFixed(0)}%
              </div>
            </div>
            <div className='bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20'>
              <div className='text-purple-100 text-sm'>Recent Readings</div>
              <div className='text-2xl font-bold text-white'>
                {diabetesMetrics.recentGlucoseCount}
              </div>
              <div className='text-xs text-purple-200'>Last 7 days</div>
            </div>
            <div className='bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20'>
              <div className='text-purple-100 text-sm'>Active Meds</div>
              <div className='text-2xl font-bold text-white'>
                {diabetesMetrics.activeMedationsCount}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className='border-b border-gray-200 dark:border-gray-700'>
        <nav className='flex space-x-8 px-6'>
          {['overview', 'hba1c', 'glucose', 'medications'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize ${
                activeTab === tab
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'hba1c' ? 'HbA1c' : tab}
            </button>
          ))}
        </nav>
      </div>

      <div className='p-6'>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className='space-y-6'>
            {/* HbA1c Status */}
            {diabetesMetrics?.latestHbA1c && (
              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>HbA1c Status</h3>
                  {diabetesMetrics.hba1cTrend && (
                    <div className='flex items-center gap-2'>
                      {getTrendIcon(diabetesMetrics.hba1cTrend)}
                      <span className='text-sm font-medium capitalize'>
                        {diabetesMetrics.hba1cTrend}
                      </span>
                    </div>
                  )}
                </div>
                <div className='flex items-baseline gap-4'>
                  <span
                    className={`text-4xl font-bold ${getHbA1cColor(diabetesMetrics.latestHbA1c.value)}`}
                  >
                    {diabetesMetrics.latestHbA1c.value}%
                  </span>
                  <div className='text-sm text-gray-600'>
                    <div>Target: ≤{diabetesRecord.targetHba1c}%</div>
                    <div>{new Date(diabetesMetrics.latestHbA1c.date).toLocaleDateString()}</div>
                  </div>
                </div>
                {diabetesMetrics.targetsMet !== null && (
                  <div
                    className={`mt-3 flex items-center gap-2 text-sm ${
                      diabetesMetrics.targetsMet ? 'text-green-700' : 'text-orange-700'
                    }`}
                  >
                    {diabetesMetrics.targetsMet ? (
                      <CheckCircle className='h-4 w-4' />
                    ) : (
                      <AlertTriangle className='h-4 w-4' />
                    )}
                    <span>
                      {diabetesMetrics.targetsMet
                        ? 'Target achieved - excellent control!'
                        : 'Above target - consider treatment adjustments'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Glucose Statistics */}
            {Object.keys(diabetesMetrics?.averageGlucose || {}).length > 0 && (
              <div className='bg-green-50 p-6 rounded-xl border border-green-200'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                  Average Glucose by Type
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  {Object.entries(diabetesMetrics.averageGlucose).map(([type, stats]) => (
                    <div key={type} className='bg-white p-4 rounded-lg border border-green-200'>
                      <h4 className='font-medium text-gray-900 capitalize'>{type}</h4>
                      <div
                        className={`text-2xl font-bold mt-1 ${getGlucoseColor(stats.average, type)}`}
                      >
                        {Math.round(stats.average)}
                      </div>
                      <div className='text-xs text-gray-600 mt-1'>
                        {stats.inRange}/{stats.count} in range
                      </div>
                      <div className='mt-2 bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-green-500 h-2 rounded-full transition-all'
                          style={{ width: `${(stats.inRange / stats.count) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Time in Range */}
            <div className='bg-purple-50 p-6 rounded-xl border border-purple-200'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>Time in Range</h3>
                <Target className='h-5 w-5 text-purple-600' />
              </div>
              <div className='flex items-baseline gap-4'>
                <span
                  className={`text-4xl font-bold ${getTimeInRangeColor(diabetesMetrics?.timeInRange || 0)}`}
                >
                  {diabetesMetrics?.timeInRange.toFixed(0)}%
                </span>
                <div className='text-sm text-gray-600'>
                  <div>Target: ≥70%</div>
                  <div>{diabetesMetrics?.totalGlucoseReadings} total readings</div>
                </div>
              </div>
              <div className='mt-4 bg-gray-200 rounded-full h-4'>
                <div
                  className={`h-4 rounded-full transition-all ${
                    (diabetesMetrics?.timeInRange || 0) >= 70
                      ? 'bg-green-500'
                      : (diabetesMetrics?.timeInRange || 0) >= 50
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${diabetesMetrics?.timeInRange || 0}%` }}
                />
              </div>
            </div>

            {/* Active Medications */}
            {diabetesMetrics?.activeMedationsCount > 0 && (
              <div className='bg-orange-50 p-6 rounded-xl border border-orange-200'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Current Medications</h3>
                <div className='space-y-3'>
                  {diabetesRecord.medications
                    .filter(med => !med.endDate || new Date(med.endDate) > new Date())
                    .map((medication, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200'
                      >
                        <div>
                          <h4 className='font-medium text-gray-900'>{medication.name}</h4>
                          <p className='text-sm text-gray-600'>
                            {medication.dosage} • {medication.frequency}
                          </p>
                          <p className='text-xs text-gray-500'>
                            Started: {new Date(medication.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              medication.type === 'insulin'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}
                          >
                            {medication.type}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Alert for follow-up */}
            {diabetesMetrics?.nextCheckup &&
              new Date(diabetesMetrics.nextCheckup) <= new Date() && (
                <div className='bg-amber-50 border border-amber-200 rounded-xl p-6'>
                  <div className='flex items-start gap-3'>
                    <AlertTriangle className='h-5 w-5 text-amber-600 mt-1' />
                    <div>
                      <h3 className='text-lg font-semibold text-amber-900'>Follow-up Needed</h3>
                      <p className='text-amber-800 mt-1'>
                        Your next diabetes check-up was scheduled for{' '}
                        {new Date(diabetesMetrics.nextCheckup).toLocaleDateString()}. Please
                        schedule an appointment with your healthcare provider.
                      </p>
                      <button className='mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium'>
                        Schedule Appointment
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* HbA1c Tab */}
        {activeTab === 'hba1c' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>HbA1c History</h3>
              <button
                onClick={() => setShowHba1cForm(true)}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
              >
                <Plus className='h-4 w-4' />
                Add HbA1c
              </button>
            </div>
            {diabetesRecord.hba1cReadings.length === 0 ? (
              <div className='text-center py-8'>
                <Activity className='h-12 w-12 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-500'>No HbA1c readings recorded</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {diabetesRecord.hba1cReadings
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((reading, index) => (
                    <div
                      key={index}
                      className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          <span className={`text-2xl font-bold ${getHbA1cColor(reading.value)}`}>
                            {reading.value}%
                          </span>
                          <div>
                            <div className='font-medium text-gray-900'>
                              {new Date(reading.date).toLocaleDateString()}
                            </div>
                            <div className='text-sm text-gray-600'>
                              {reading.method && `Method: ${reading.method}`}
                              {reading.doctorId && ` • Doctor ID: ${reading.doctorId}`}
                            </div>
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <button className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'>
                            <Edit className='h-4 w-4' />
                          </button>
                          <button className='p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600'>
                            <Trash2 className='h-4 w-4' />
                          </button>
                        </div>
                      </div>
                      {reading.notes && (
                        <p className='text-sm text-gray-600 mt-2'>{reading.notes}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Glucose Tab */}
        {activeTab === 'glucose' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>Blood Glucose Readings</h3>
              <button
                onClick={() => setShowGlucoseForm(true)}
                className='flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors'
              >
                <Droplet className='h-4 w-4' />
                Add Reading
              </button>
            </div>
            {diabetesRecord.bloodGlucoseReadings.length === 0 ? (
              <div className='text-center py-8'>
                <Droplet className='h-12 w-12 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-500'>No glucose readings recorded</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {diabetesRecord.bloodGlucoseReadings
                  .sort(
                    (a, b) =>
                      new Date(`${b.date}T${b.time}`).getTime() -
                      new Date(`${a.date}T${a.time}`).getTime(),
                  )
                  .slice(0, 20) // Show last 20 readings
                  .map((reading, index) => (
                    <div
                      key={index}
                      className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-4'>
                          <span
                            className={`text-2xl font-bold ${getGlucoseColor(reading.value, reading.type)}`}
                          >
                            {reading.value}
                          </span>
                          <div>
                            <div className='font-medium text-gray-900'>
                              {new Date(reading.date).toLocaleDateString()} at {reading.time}
                            </div>
                            <div className='text-sm text-gray-600 capitalize'>
                              {reading.type}
                              {reading.context && ` • ${reading.context}`}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getGlucoseColor(reading.value, reading.type) === 'text-green-600'
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : getGlucoseColor(reading.value, reading.type) === 'text-blue-600'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {getGlucoseColor(reading.value, reading.type) === 'text-green-600'
                              ? 'In Range'
                              : getGlucoseColor(reading.value, reading.type) === 'text-blue-600'
                                ? 'Low'
                                : 'High'}
                          </span>
                        </div>
                      </div>
                      {reading.notes && (
                        <p className='text-sm text-gray-600 mt-2'>{reading.notes}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>Diabetes Medications</h3>
              <button
                onClick={() => setShowMedicationForm(true)}
                className='flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors'
              >
                <Pill className='h-4 w-4' />
                Add Medication
              </button>
            </div>
            {diabetesRecord.medications.length === 0 ? (
              <div className='text-center py-8'>
                <Pill className='h-12 w-12 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-500'>No medications recorded</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {diabetesRecord.medications.map((medication, index) => (
                  <div
                    key={index}
                    className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-3 mb-2'>
                          <h4 className='font-medium text-gray-900'>{medication.name}</h4>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              medication.type === 'insulin'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : medication.type === 'oral'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {medication.type}
                          </span>
                          {!medication.endDate || new Date(medication.endDate) > new Date() ? (
                            <span className='px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full border border-green-200'>
                              Active
                            </span>
                          ) : (
                            <span className='px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full border border-gray-200'>
                              Ended
                            </span>
                          )}
                        </div>
                        <div className='text-sm text-gray-600'>
                          <div>
                            {medication.dosage} • {medication.frequency}
                          </div>
                          <div>
                            Started: {new Date(medication.startDate).toLocaleDateString()}
                            {medication.endDate &&
                              ` • Ended: ${new Date(medication.endDate).toLocaleDateString()}`}
                          </div>
                        </div>
                        {medication.notes && (
                          <p className='text-sm text-gray-800 mt-2'>{medication.notes}</p>
                        )}
                      </div>
                      <div className='flex gap-2'>
                        <button className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'>
                          <Edit className='h-4 w-4' />
                        </button>
                        <button className='p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600'>
                          <Trash2 className='h-4 w-4' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDiabetesModule;
