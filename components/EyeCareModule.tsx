// @ts-nocheck
import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import type { EyePrescription, EyeTest, EyeCondition } from '../types';

interface EyeCareModuleProps {
  patientId: string;
}

export const EyeCareModule: React.FC<EyeCareModuleProps> = ({ patientId }) => {
  console.log('🔍 EyeCareModule rendering for patient:', patientId);
  const { theme, patients, initializeEyeRecord, addEyePrescription, addEyeTest, addEyeCondition, setCurrentGlasses, deleteEyePrescription, deleteEyeTest, deleteEyeCondition } = useAppStore();
  const patient = patients.find(p => p.id === patientId);
  const eyeRecord = patient?.eyeRecord;
  console.log('👁️ Eye record:', eyeRecord, 'Patient:', patient?.name);

  const [activeTab, setActiveTab] = useState<'prescriptions' | 'tests' | 'conditions'>('prescriptions');
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [showConditionForm, setShowConditionForm] = useState(false);

  // Initialize eye record if it doesn't exist
  React.useEffect(() => {
    if (patient && !eyeRecord) {
      initializeEyeRecord(patientId);
    }
  }, [patient, eyeRecord, patientId, initializeEyeRecord]);

  const handleAddPrescription = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const prescription: Omit<EyePrescription, 'id'> = {
      date: formData.get('date') as string,
      doctorId: formData.get('doctorId') as string || undefined,
      rightEye: {
        sphere: formData.get('rightSphere') as string,
        cylinder: formData.get('rightCylinder') as string || undefined,
        axis: formData.get('rightAxis') as string || undefined,
        visualAcuity: formData.get('rightVA') as string || undefined,
      },
      leftEye: {
        sphere: formData.get('leftSphere') as string,
        cylinder: formData.get('leftCylinder') as string || undefined,
        axis: formData.get('leftAxis') as string || undefined,
        visualAcuity: formData.get('leftVA') as string || undefined,
      },
      pupillaryDistance: formData.get('pd') as string || undefined,
      lensType: formData.get('lensType') as any || undefined,
      prescribedFor: formData.get('prescribedFor') as any || undefined,
      notes: formData.get('notes') as string || undefined,
      nextCheckup: formData.get('nextCheckup') as string || undefined,
    };

    addEyePrescription(patientId, prescription);
    setShowPrescriptionForm(false);
    e.currentTarget.reset();
  };

  const handleAddTest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const test: Omit<EyeTest, 'id'> = {
      date: formData.get('date') as string,
      doctorId: formData.get('doctorId') as string || undefined,
      type: formData.get('type') as any,
      iop: {
        rightEye: formData.get('iopRight') as string || undefined,
        leftEye: formData.get('iopLeft') as string || undefined,
      },
      findings: formData.get('findings') as string,
      diagnosis: formData.get('diagnosis') as string || undefined,
      recommendations: formData.get('recommendations') as string || undefined,
      nextTestDate: formData.get('nextTestDate') as string || undefined,
    };

    addEyeTest(patientId, test);
    setShowTestForm(false);
    e.currentTarget.reset();
  };

  const handleAddCondition = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const condition: Omit<EyeCondition, 'id'> = {
      name: formData.get('name') as string,
      diagnosedDate: formData.get('diagnosedDate') as string,
      severity: formData.get('severity') as any || undefined,
      affectedEye: formData.get('affectedEye') as any,
      treatment: formData.get('treatment') as string || undefined,
      status: formData.get('status') as any,
      notes: formData.get('notes') as string || undefined,
    };

    addEyeCondition(patientId, condition);
    setShowConditionForm(false);
    e.currentTarget.reset();
  };

  const isDark = theme === 'dark';

  console.log('🎨 Rendering with theme:', theme, 'isDark:', isDark);

  return (
    <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`} style={{ minHeight: '200px' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">visibility</span>
          Eye Care Records
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-300 dark:border-gray-600">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'prescriptions'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Prescriptions ({eyeRecord?.prescriptions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'tests'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Tests ({eyeRecord?.tests?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('conditions')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'conditions'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : isDark ? 'text-gray-400' : 'text-gray-600'
          }`}
        >
          Conditions ({eyeRecord?.conditions?.length || 0})
        </button>
      </div>

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Eye Prescriptions</h3>
            <button
              onClick={() => setShowPrescriptionForm(!showPrescriptionForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add Prescription
            </button>
          </div>

          {showPrescriptionForm && (
            <form onSubmit={handleAddPrescription} className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Date</label>
                  <input type="date" name="date" required className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Doctor ID</label>
                  <input type="text" name="doctorId" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                
                <div className="col-span-2">
                  <h4 className="font-semibold mb-2">Right Eye (OD)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block mb-1 text-sm">Sphere</label>
                      <input type="text" name="rightSphere" required placeholder="e.g., -2.50" className="w-full p-2 rounded border dark:bg-gray-800" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm">Cylinder</label>
                      <input type="text" name="rightCylinder" placeholder="e.g., -0.75" className="w-full p-2 rounded border dark:bg-gray-800" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm">Axis</label>
                      <input type="text" name="rightAxis" placeholder="e.g., 180" className="w-full p-2 rounded border dark:bg-gray-800" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm">Visual Acuity</label>
                      <input type="text" name="rightVA" placeholder="e.g., 20/20" className="w-full p-2 rounded border dark:bg-gray-800" />
                    </div>
                  </div>
                </div>

                <div className="col-span-2">
                  <h4 className="font-semibold mb-2">Left Eye (OS)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block mb-1 text-sm">Sphere</label>
                      <input type="text" name="leftSphere" required placeholder="e.g., -2.50" className="w-full p-2 rounded border dark:bg-gray-800" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm">Cylinder</label>
                      <input type="text" name="leftCylinder" placeholder="e.g., -0.75" className="w-full p-2 rounded border dark:bg-gray-800" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm">Axis</label>
                      <input type="text" name="leftAxis" placeholder="e.g., 180" className="w-full p-2 rounded border dark:bg-gray-800" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm">Visual Acuity</label>
                      <input type="text" name="leftVA" placeholder="e.g., 20/20" className="w-full p-2 rounded border dark:bg-gray-800" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium">PD (mm)</label>
                  <input type="text" name="pd" placeholder="e.g., 63" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Lens Type</label>
                  <select name="lensType" className="w-full p-2 rounded border dark:bg-gray-800">
                    <option value="">Select...</option>
                    <option value="single-vision">Single Vision</option>
                    <option value="bifocal">Bifocal</option>
                    <option value="progressive">Progressive</option>
                    <option value="reading">Reading</option>
                    <option value="distance">Distance</option>
                    <option value="contact">Contact Lenses</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Prescribed For</label>
                  <select name="prescribedFor" className="w-full p-2 rounded border dark:bg-gray-800">
                    <option value="">Select...</option>
                    <option value="glasses">Glasses</option>
                    <option value="contact-lenses">Contact Lenses</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Next Checkup</label>
                  <input type="date" name="nextCheckup" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div className="col-span-2">
                  <label className="block mb-2 font-medium">Notes</label>
                  <textarea name="notes" rows={2} className="w-full p-2 rounded border dark:bg-gray-800"></textarea>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Save Prescription
                </button>
                <button type="button" onClick={() => setShowPrescriptionForm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {eyeRecord?.prescriptions?.map((rx) => (
              <div key={rx.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold">Date: {new Date(rx.date).toLocaleDateString()}</span>
                    {rx.lensType && <span className="ml-4 text-sm px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">{rx.lensType}</span>}
                  </div>
                  <div className="flex gap-2">
                    {rx.id === eyeRecord.currentGlasses && (
                      <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Current</span>
                    )}
                    <button
                      onClick={() => setCurrentGlasses(patientId, rx.id)}
                      className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Set as Current
                    </button>
                    <button
                      onClick={() => deleteEyePrescription(patientId, rx.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <strong>Right Eye (OD):</strong> SPH {rx.rightEye.sphere}
                    {rx.rightEye.cylinder && ` CYL ${rx.rightEye.cylinder}`}
                    {rx.rightEye.axis && ` AXIS ${rx.rightEye.axis}`}
                    {rx.rightEye.visualAcuity && ` (VA: ${rx.rightEye.visualAcuity})`}
                  </div>
                  <div>
                    <strong>Left Eye (OS):</strong> SPH {rx.leftEye.sphere}
                    {rx.leftEye.cylinder && ` CYL ${rx.leftEye.cylinder}`}
                    {rx.leftEye.axis && ` AXIS ${rx.leftEye.axis}`}
                    {rx.leftEye.visualAcuity && ` (VA: ${rx.leftEye.visualAcuity})`}
                  </div>
                </div>
                {rx.pupillaryDistance && <div className="mt-2"><strong>PD:</strong> {rx.pupillaryDistance}</div>}
                {rx.notes && <div className="mt-2 text-sm"><strong>Notes:</strong> {rx.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Eye Tests</h3>
            <button
              onClick={() => setShowTestForm(!showTestForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add Test
            </button>
          </div>

          {showTestForm && (
            <form onSubmit={handleAddTest} className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Date</label>
                  <input type="date" name="date" required className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Test Type</label>
                  <select name="type" required className="w-full p-2 rounded border dark:bg-gray-800">
                    <option value="routine">Routine Checkup</option>
                    <option value="glaucoma">Glaucoma Test</option>
                    <option value="retina">Retina Exam</option>
                    <option value="cataract">Cataract Screening</option>
                    <option value="lasik-screening">LASIK Screening</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">IOP Right Eye (mmHg)</label>
                  <input type="text" name="iopRight" placeholder="e.g., 15" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">IOP Left Eye (mmHg)</label>
                  <input type="text" name="iopLeft" placeholder="e.g., 14" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div className="col-span-2">
                  <label className="block mb-2 font-medium">Findings</label>
                  <textarea name="findings" required rows={3} className="w-full p-2 rounded border dark:bg-gray-800"></textarea>
                </div>
                <div className="col-span-2">
                  <label className="block mb-2 font-medium">Diagnosis</label>
                  <textarea name="diagnosis" rows={2} className="w-full p-2 rounded border dark:bg-gray-800"></textarea>
                </div>
                <div className="col-span-2">
                  <label className="block mb-2 font-medium">Recommendations</label>
                  <textarea name="recommendations" rows={2} className="w-full p-2 rounded border dark:bg-gray-800"></textarea>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Next Test Date</label>
                  <input type="date" name="nextTestDate" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Save Test
                </button>
                <button type="button" onClick={() => setShowTestForm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {eyeRecord?.tests?.map((test) => (
              <div key={test.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-semibold">{new Date(test.date).toLocaleDateString()}</span>
                    <span className="ml-4 text-sm px-2 py-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      {test.type}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteEyeTest(patientId, test.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                {test.iop && (test.iop.rightEye || test.iop.leftEye) && (
                  <div className="mb-2">
                    <strong>IOP:</strong> OD: {test.iop.rightEye || 'N/A'} mmHg, OS: {test.iop.leftEye || 'N/A'} mmHg
                  </div>
                )}
                <div><strong>Findings:</strong> {test.findings}</div>
                {test.diagnosis && <div className="mt-2"><strong>Diagnosis:</strong> {test.diagnosis}</div>}
                {test.recommendations && <div className="mt-2"><strong>Recommendations:</strong> {test.recommendations}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conditions Tab */}
      {activeTab === 'conditions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Eye Conditions</h3>
            <button
              onClick={() => setShowConditionForm(!showConditionForm)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add Condition
            </button>
          </div>

          {showConditionForm && (
            <form onSubmit={handleAddCondition} className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Condition Name</label>
                  <input type="text" name="name" required placeholder="e.g., Myopia, Glaucoma" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Diagnosed Date</label>
                  <input type="date" name="diagnosedDate" required className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Severity</label>
                  <select name="severity" className="w-full p-2 rounded border dark:bg-gray-800">
                    <option value="">Select...</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Affected Eye</label>
                  <select name="affectedEye" required className="w-full p-2 rounded border dark:bg-gray-800">
                    <option value="both">Both Eyes</option>
                    <option value="right">Right Eye</option>
                    <option value="left">Left Eye</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Status</label>
                  <select name="status" required className="w-full p-2 rounded border dark:bg-gray-800">
                    <option value="active">Active</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Treatment</label>
                  <input type="text" name="treatment" placeholder="Current treatment" className="w-full p-2 rounded border dark:bg-gray-800" />
                </div>
                <div className="col-span-2">
                  <label className="block mb-2 font-medium">Notes</label>
                  <textarea name="notes" rows={2} className="w-full p-2 rounded border dark:bg-gray-800"></textarea>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Save Condition
                </button>
                <button type="button" onClick={() => setShowConditionForm(false)} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {eyeRecord?.conditions?.map((condition) => (
              <div key={condition.id} className={`p-4 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-lg">{condition.name}</h4>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        condition.status === 'active' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                        condition.status === 'monitoring' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                        'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      }`}>
                        {condition.status}
                      </span>
                      {condition.severity && (
                        <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600">
                          {condition.severity}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEyeCondition(patientId, condition.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
                <div className="mt-2 text-sm">
                  <div><strong>Affected Eye:</strong> {condition.affectedEye === 'both' ? 'Both Eyes' : condition.affectedEye === 'right' ? 'Right Eye' : 'Left Eye'}</div>
                  <div><strong>Diagnosed:</strong> {new Date(condition.diagnosedDate).toLocaleDateString()}</div>
                  {condition.treatment && <div><strong>Treatment:</strong> {condition.treatment}</div>}
                  {condition.notes && <div className="mt-2"><strong>Notes:</strong> {condition.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
