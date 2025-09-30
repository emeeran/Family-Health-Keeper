import React, { useMemo } from 'react';
import type { Patient, Medication, MedicalRecord } from '../types';

interface CustomInsightsProps {
  patient: Patient;
  medications: Medication[];
  records: MedicalRecord[];
}

interface Insight {
  type: 'warning' | 'info' | 'success' | 'alert';
  title: string;
  description: string;
  action?: string;
}

const CustomInsights: React.FC<CustomInsightsProps> = ({ patient, medications, records }) => {
  const insights = useMemo<Insight[]>(() => {
    const insightsList: Insight[] = [];

    // Age-based insights
    if (patient.dateOfBirth) {
      const birthDate = new Date(patient.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age >= 65) {
        insightsList.push({
          type: 'info',
          title: 'Senior Health Monitoring',
          description: `Patient is ${age} years old. Consider regular health screenings and medication reviews.`,
          action: 'Schedule annual checkup'
        });
      }

      if (age >= 50 && age < 65) {
        insightsList.push({
          type: 'info',
          title: 'Preventive Care',
          description: `Patient is ${age} years old. Recommended screenings: cholesterol, blood pressure, colon cancer.`,
          action: 'Review preventive care schedule'
        });
      }
    }

    // Medication insights
    if (medications.length > 0) {
      // High medication count
      if (medications.length >= 5) {
        insightsList.push({
          type: 'warning',
          title: 'Polypharmacy Alert',
          description: `Patient is taking ${medications.length} medications. Consider reviewing for potential interactions and simplification.`,
          action: 'Review medication regimen'
        });
      }

      // Blood thinners
      const hasBloodThinners = medications.some(med =>
        med.name.toLowerCase().includes('warfarin') ||
        med.name.toLowerCase().includes('coumadin') ||
        med.name.toLowerCase().includes('aspirin') ||
        med.name.toLowerCase().includes('clopidogrel') ||
        med.name.toLowerCase().includes('elixquis') ||
        med.name.toLowerCase().includes('xarelto')
      );

      if (hasBloodThinners) {
        insightsList.push({
          type: 'alert',
          title: 'Anticoagulant Therapy',
          description: 'Patient is on blood thinners. Monitor for bleeding and bruising. Regular INR checks may be needed.',
          action: 'Schedule INR monitoring'
        });
      }

      // Diabetes medications
      const hasDiabetesMeds = medications.some(med =>
        med.name.toLowerCase().includes('metformin') ||
        med.name.toLowerCase().includes('insulin') ||
        med.name.toLowerCase().includes('glipizide') ||
        med.name.toLowerCase().includes('glyburide')
      );

      if (hasDiabetesMeds) {
        insightsList.push({
          type: 'info',
          title: 'Diabetes Management',
          description: 'Patient is on diabetes medication. Regular glucose monitoring and HbA1c tests recommended.',
          action: 'Schedule HbA1c test'
        });
      }

      // Blood pressure medications
      const hasBPMeds = medications.some(med =>
        med.name.toLowerCase().includes('lisinopril') ||
        med.name.toLowerCase().includes('atenolol') ||
        med.name.toLowerCase().includes('metoprolol') ||
        med.name.toLowerCase().includes('amlodipine') ||
        med.name.toLowerCase().includes('losartan')
      );

      if (hasBPMeds) {
        insightsList.push({
          type: 'info',
          title: 'Hypertension Management',
          description: 'Patient is on blood pressure medication. Regular BP monitoring recommended.',
          action: 'Check BP at next visit'
        });
      }
    }

    // Allergies alert
    if (patient.allergies && patient.allergies.length > 0) {
      const severeAllergies = patient.allergies.filter(allergy =>
        allergy.toLowerCase().includes('penicillin') ||
        allergy.toLowerCase().includes('sulfa') ||
        allergy.toLowerCase().includes('latex') ||
        allergy.toLowerCase().includes('nuts') ||
        allergy.toLowerCase().includes('shellfish')
      );

      if (severeAllergies.length > 0) {
        insightsList.push({
          type: 'alert',
          title: 'Severe Allergies',
          description: `Patient has severe allergies: ${severeAllergies.join(', ')}. Ensure this is prominently displayed in medical records.`,
          action: 'Verify allergy documentation'
        });
      }
    }

    // Chronic conditions
    if (patient.conditions && patient.conditions.length > 0) {
      const chronicConditions = patient.conditions.filter(condition =>
        condition.toLowerCase().includes('diabetes') ||
        condition.toLowerCase().includes('hypertension') ||
        condition.toLowerCase().includes('heart disease') ||
        condition.toLowerCase().includes('copd') ||
        condition.toLowerCase().includes('asthma') ||
        condition.toLowerCase().includes('arthritis')
      );

      if (chronicConditions.length > 0) {
        insightsList.push({
          type: 'info',
          title: 'Chronic Condition Management',
          description: `Patient has chronic conditions: ${chronicConditions.join(', ')}. Regular monitoring and follow-up recommended.`,
          action: 'Review disease management plan'
        });
      }
    }

    // Recent visits pattern
    const recentVisits = records.filter(record => {
      const recordDate = new Date(record.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return recordDate >= thirtyDaysAgo;
    });

    if (recentVisits.length >= 3) {
      insightsList.push({
        type: 'info',
        title: 'Frequent Recent Visits',
        description: `Patient has had ${recentVisits.length} medical visits in the last 30 days. Consider if additional support or care coordination is needed.`,
        action: 'Assess care needs'
      });
    }

    // No recent visits
    const noRecentVisits = records.filter(record => {
      const recordDate = new Date(record.date);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return recordDate >= oneYearAgo;
    });

    if (noRecentVisits.length === 0 && records.length > 0) {
      insightsList.push({
        type: 'warning',
        title: 'No Recent Care',
        description: 'Patient has not had a medical visit in over a year. Consider reaching out for preventive care.',
        action: 'Schedule checkup'
      });
    }

    return insightsList;
  }, [patient, medications, records]);

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'alert':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'success':
        return '✅';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'alert':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  if (insights.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Custom Insights</h3>
        <p className="text-gray-600 dark:text-gray-400">No specific insights available at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Custom Insights</h3>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`border-l-4 p-4 rounded-r-lg ${getInsightColor(insight.type)}`}
          >
            <div className="flex items-start">
              <span className="text-xl mr-3">{getInsightIcon(insight.type)}</span>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{insight.title}</h4>
                <p className="text-sm mt-1 opacity-90">{insight.description}</p>
                {insight.action && (
                  <p className="text-xs mt-2 font-medium opacity-75">
                    💡 Suggested action: {insight.action}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomInsights;