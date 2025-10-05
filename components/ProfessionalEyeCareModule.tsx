import React, { useState, useMemo } from 'react';
import {
  Eye,
  Droplet,
  Activity,
  AlertTriangle,
  Calendar,
  FileText,
  Plus,
  Edit,
  Trash2,
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import type { EyeRecord, EyePrescription, EyeTest, EyeCondition } from '../types';

interface ProfessionalEyeCareModuleProps {
  eyeRecord?: EyeRecord;
  onUpdate?: (eyeRecord: EyeRecord) => void;
}

const ProfessionalEyeCareModule: React.FC<ProfessionalEyeCareModuleProps> = ({
  eyeRecord,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'prescriptions' | 'tests' | 'conditions'>(
    'overview',
  );
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [showConditionForm, setShowConditionForm] = useState(false);

  // Calculate eye health metrics
  const eyeHealthMetrics = useMemo(() => {
    if (!eyeRecord) return null;

    const latestPrescription = eyeRecord.prescriptions[eyeRecord.prescriptions.length - 1];
    const latestTest = eyeRecord.tests[eyeRecord.tests.length - 1];
    const activeConditions = eyeRecord.conditions.filter(c => c.status === 'active');
    const lastCheckup = eyeRecord.lastCheckup ? new Date(eyeRecord.lastCheckup) : null;

    const daysSinceLastCheckup = lastCheckup
      ? Math.floor((new Date().getTime() - lastCheckup.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Check for follow-up needs
    const needsFollowUp = daysSinceLastCheckup ? daysSinceLastCheckup > 365 : true;

    // Check for progressive conditions
    const progressiveConditions = activeConditions.filter(
      c => c.severity === 'moderate' || c.severity === 'severe',
    );

    return {
      latestPrescription,
      latestTest,
      activeConditionsCount: activeConditions.length,
      totalConditionsCount: eyeRecord.conditions.length,
      daysSinceLastCheckup,
      needsFollowUp,
      progressiveConditionsCount: progressiveConditions.length,
      prescriptionCount: eyeRecord.prescriptions.length,
      testCount: eyeRecord.tests.length,
    };
  }, [eyeRecord]);

  const formatSphere = (sphere: string) => {
    const num = parseFloat(sphere);
    if (isNaN(num)) return sphere;
    return `${num > 0 ? '+' : ''}${sphere}`;
  };

  const getConditionSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'mild':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'moderate':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'severe':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'routine':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'glaucoma':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'retina':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'cataract':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'lasik-screening':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!eyeRecord) {
    return (
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8'>
        <div className='text-center'>
          <Eye className='h-16 w-16 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
            No Eye Care Record
          </h3>
          <p className='text-gray-500 dark:text-gray-400'>
            Start tracking eye health by adding your first eye examination.
          </p>
          <button className='mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'>
            Initialize Eye Care Record
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden'>
      {/* Professional Header */}
      <div className='bg-gradient-to-r from-slate-700 to-slate-900 p-6 rounded-t-xl'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-3'>
            <div className='w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20'>
              <Eye className='h-7 w-7 text-white' />
            </div>
            <div>
              <h2 className='text-2xl font-bold text-white mb-1'>Ophthalmic Care Management</h2>
              <p className='text-slate-300 text-sm'>
                Professional vision health monitoring & treatment tracking
              </p>
            </div>
          </div>
          <div className='flex gap-2'>
            <button
              className='p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg transition-all border border-white/20'
              title='Export eye care records'
            >
              <Download className='h-5 w-5 text-slate-200' />
            </button>
            <button
              onClick={() => setShowPrescriptionForm(true)}
              className='flex items-center gap-2 px-4 py-2.5 bg-white text-slate-800 rounded-lg hover:bg-slate-100 transition-all font-medium shadow-sm'
            >
              <Plus className='h-5 w-5' />
              New Record
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {eyeHealthMetrics && (
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20'>
              <div className='text-teal-100 text-sm'>Prescriptions</div>
              <div className='text-2xl font-bold text-white'>
                {eyeHealthMetrics.prescriptionCount}
              </div>
            </div>
            <div className='bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20'>
              <div className='text-teal-100 text-sm'>Tests</div>
              <div className='text-2xl font-bold text-white'>{eyeHealthMetrics.testCount}</div>
            </div>
            <div className='bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20'>
              <div className='text-teal-100 text-sm'>Active Conditions</div>
              <div className='text-2xl font-bold text-white'>
                {eyeHealthMetrics.activeConditionsCount}
              </div>
            </div>
            <div className='bg-white/10 backdrop-blur rounded-lg p-3 border border-white/20'>
              <div className='text-teal-100 text-sm'>Last Checkup</div>
              <div className='text-lg font-bold text-white'>
                {eyeHealthMetrics.daysSinceLastCheckup !== null
                  ? `${eyeHealthMetrics.daysSinceLastCheckup} days ago`
                  : 'Never'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className='border-b border-gray-200 dark:border-gray-700'>
        <nav className='flex space-x-8 px-6'>
          {['overview', 'prescriptions', 'tests', 'conditions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize ${
                activeTab === tab
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <div className='p-6'>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className='space-y-6'>
            {/* Current Prescription */}
            {eyeHealthMetrics?.latestPrescription && (
              <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>Current Prescription</h3>
                  <span className='text-sm text-gray-500'>
                    {new Date(eyeHealthMetrics.latestPrescription.date).toLocaleDateString()}
                  </span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Right Eye */}
                  <div className='bg-white p-4 rounded-lg border border-blue-200'>
                    <h4 className='font-medium text-gray-900 mb-3 flex items-center gap-2'>
                      <Eye className='h-4 w-4' />
                      Right Eye (OD)
                    </h4>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Sphere:</span>
                        <span className='font-medium'>
                          {formatSphere(eyeHealthMetrics.latestPrescription.rightEye.sphere)}
                        </span>
                      </div>
                      {eyeHealthMetrics.latestPrescription.rightEye.cylinder && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Cylinder:</span>
                          <span className='font-medium'>
                            {eyeHealthMetrics.latestPrescription.rightEye.cylinder}
                          </span>
                        </div>
                      )}
                      {eyeHealthMetrics.latestPrescription.rightEye.axis && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Axis:</span>
                          <span className='font-medium'>
                            {eyeHealthMetrics.latestPrescription.rightEye.axis}°
                          </span>
                        </div>
                      )}
                      {eyeHealthMetrics.latestPrescription.rightEye.visualAcuity && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Visual Acuity:</span>
                          <span className='font-medium'>
                            {eyeHealthMetrics.latestPrescription.rightEye.visualAcuity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Left Eye */}
                  <div className='bg-white p-4 rounded-lg border border-blue-200'>
                    <h4 className='font-medium text-gray-900 mb-3 flex items-center gap-2'>
                      <Eye className='h-4 w-4' />
                      Left Eye (OS)
                    </h4>
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600'>Sphere:</span>
                        <span className='font-medium'>
                          {formatSphere(eyeHealthMetrics.latestPrescription.leftEye.sphere)}
                        </span>
                      </div>
                      {eyeHealthMetrics.latestPrescription.leftEye.cylinder && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Cylinder:</span>
                          <span className='font-medium'>
                            {eyeHealthMetrics.latestPrescription.leftEye.cylinder}
                          </span>
                        </div>
                      )}
                      {eyeHealthMetrics.latestPrescription.leftEye.axis && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Axis:</span>
                          <span className='font-medium'>
                            {eyeHealthMetrics.latestPrescription.leftEye.axis}°
                          </span>
                        </div>
                      )}
                      {eyeHealthMetrics.latestPrescription.leftEye.visualAcuity && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Visual Acuity:</span>
                          <span className='font-medium'>
                            {eyeHealthMetrics.latestPrescription.leftEye.visualAcuity}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className='mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                  {eyeHealthMetrics.latestPrescription.pupillaryDistance && (
                    <div>
                      <span className='text-gray-600'>PD:</span>
                      <span className='font-medium ml-2'>
                        {eyeHealthMetrics.latestPrescription.pupillaryDistance}
                      </span>
                    </div>
                  )}
                  {eyeHealthMetrics.latestPrescription.lensType && (
                    <div>
                      <span className='text-gray-600'>Lens Type:</span>
                      <span className='font-medium ml-2 capitalize'>
                        {eyeHealthMetrics.latestPrescription.lensType}
                      </span>
                    </div>
                  )}
                  {eyeHealthMetrics.latestPrescription.prescribedFor && (
                    <div>
                      <span className='text-gray-600'>For:</span>
                      <span className='font-medium ml-2 capitalize'>
                        {eyeHealthMetrics.latestPrescription.prescribedFor}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Latest Test Results */}
            {eyeHealthMetrics?.latestTest && (
              <div className='bg-green-50 p-6 rounded-xl border border-green-200'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Latest Test Results</h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <span className='text-sm text-gray-600'>Test Type:</span>
                    <span
                      className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getTestTypeColor(eyeHealthMetrics.latestTest.type)}`}
                    >
                      {eyeHealthMetrics.latestTest.type}
                    </span>
                  </div>
                  <div>
                    <span className='text-sm text-gray-600'>Date:</span>
                    <span className='ml-2 font-medium'>
                      {new Date(eyeHealthMetrics.latestTest.date).toLocaleDateString()}
                    </span>
                  </div>
                  {eyeHealthMetrics.latestTest.iop && (
                    <>
                      <div>
                        <span className='text-sm text-gray-600'>IOP Right:</span>
                        <span className='ml-2 font-medium'>
                          {eyeHealthMetrics.latestTest.iop.rightEye} mmHg
                        </span>
                      </div>
                      <div>
                        <span className='text-sm text-gray-600'>IOP Left:</span>
                        <span className='ml-2 font-medium'>
                          {eyeHealthMetrics.latestTest.iop.leftEye} mmHg
                        </span>
                      </div>
                    </>
                  )}
                </div>
                {eyeHealthMetrics.latestTest.findings && (
                  <div className='mt-4'>
                    <span className='text-sm text-gray-600'>Findings:</span>
                    <p className='mt-1 text-gray-800'>{eyeHealthMetrics.latestTest.findings}</p>
                  </div>
                )}
                {eyeHealthMetrics.latestTest.diagnosis && (
                  <div className='mt-3'>
                    <span className='text-sm text-gray-600'>Diagnosis:</span>
                    <p className='mt-1 font-medium text-gray-900'>
                      {eyeHealthMetrics.latestTest.diagnosis}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Active Conditions */}
            {eyeHealthMetrics?.activeConditionsCount > 0 && (
              <div className='bg-orange-50 p-6 rounded-xl border border-orange-200'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4'>Active Conditions</h3>
                <div className='space-y-3'>
                  {eyeRecord.conditions
                    .filter(c => c.status === 'active')
                    .map((condition, index) => (
                      <div
                        key={index}
                        className='flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200'
                      >
                        <div>
                          <h4 className='font-medium text-gray-900'>{condition.name}</h4>
                          <p className='text-sm text-gray-600'>
                            Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getConditionSeverityColor(condition.severity)}`}
                          >
                            {condition.severity || 'unknown'}
                          </span>
                          <span className='text-xs text-gray-500 capitalize'>
                            {condition.affectedEye} eye
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Follow-up Recommendations */}
            {eyeHealthMetrics?.needsFollowUp && (
              <div className='bg-amber-50 border border-amber-200 rounded-xl p-6'>
                <div className='flex items-start gap-3'>
                  <AlertTriangle className='h-5 w-5 text-amber-600 mt-1' />
                  <div>
                    <h3 className='text-lg font-semibold text-amber-900'>Follow-up Recommended</h3>
                    <p className='text-amber-800 mt-1'>
                      {eyeHealthMetrics.daysSinceLastCheckup
                        ? `It's been ${eyeHealthMetrics.daysSinceLastCheckup} days since your last eye examination. Regular check-ups are important for maintaining eye health.`
                        : 'No recent eye examinations found. Schedule an appointment with your eye care specialist.'}
                    </p>
                    <button className='mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium'>
                      Schedule Eye Exam
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>Prescriptions</h3>
              <button
                onClick={() => setShowPrescriptionForm(true)}
                className='flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
              >
                <Plus className='h-4 w-4' />
                Add Prescription
              </button>
            </div>
            {eyeRecord.prescriptions.length === 0 ? (
              <div className='text-center py-8'>
                <FileText className='h-12 w-12 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-500'>No prescriptions recorded</p>
              </div>
            ) : (
              eyeRecord.prescriptions.map((prescription, index) => (
                <div
                  key={index}
                  className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
                >
                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <h4 className='font-medium text-gray-900'>
                        {new Date(prescription.date).toLocaleDateString()}
                      </h4>
                      <p className='text-sm text-gray-600'>
                        {prescription.lensType && `Type: ${prescription.lensType}`}
                        {prescription.prescribedFor && ` • For: ${prescription.prescribedFor}`}
                      </p>
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
                  {/* Prescription details would go here */}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>Eye Tests</h3>
              <button
                onClick={() => setShowTestForm(true)}
                className='flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors'
              >
                <Plus className='h-4 w-4' />
                Add Test
              </button>
            </div>
            {eyeRecord.tests.length === 0 ? (
              <div className='text-center py-8'>
                <Activity className='h-12 w-12 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-500'>No eye tests recorded</p>
              </div>
            ) : (
              eyeRecord.tests.map((test, index) => (
                <div
                  key={index}
                  className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
                >
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-3'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getTestTypeColor(test.type)}`}
                      >
                        {test.type}
                      </span>
                      <h4 className='font-medium text-gray-900'>
                        {new Date(test.date).toLocaleDateString()}
                      </h4>
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
                  {test.findings && <p className='text-sm text-gray-600 mb-2'>{test.findings}</p>}
                  {test.diagnosis && (
                    <p className='text-sm font-medium text-gray-900'>{test.diagnosis}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Conditions Tab */}
        {activeTab === 'conditions' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>Eye Conditions</h3>
              <button
                onClick={() => setShowConditionForm(true)}
                className='flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors'
              >
                <Plus className='h-4 w-4' />
                Add Condition
              </button>
            </div>
            {eyeRecord.conditions.length === 0 ? (
              <div className='text-center py-8'>
                <CheckCircle className='h-12 w-12 text-gray-400 mx-auto mb-3' />
                <p className='text-gray-500'>No eye conditions recorded</p>
              </div>
            ) : (
              eyeRecord.conditions.map((condition, index) => (
                <div
                  key={index}
                  className='border border-gray-200 dark:border-gray-700 rounded-lg p-4'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <h4 className='font-medium text-gray-900'>{condition.name}</h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getConditionSeverityColor(condition.severity)}`}
                        >
                          {condition.severity || 'unknown'}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            condition.status === 'active'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : condition.status === 'resolved'
                                ? 'bg-green-100 text-green-800 border-green-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          {condition.status}
                        </span>
                      </div>
                      <p className='text-sm text-gray-600'>
                        Diagnosed: {new Date(condition.diagnosedDate).toLocaleDateString()} •
                        {condition.affectedEye} eye
                      </p>
                      {condition.treatment && (
                        <p className='text-sm text-gray-800 mt-1'>
                          Treatment: {condition.treatment}
                        </p>
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
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalEyeCareModule;
