import React, { useState, useEffect, memo } from 'react';
import { generateSimpleHealthInsights } from '../services/simpleHealthInsights';
import type { Patient, Document } from '../types';

interface HealthInsightsProps {
  patient: Patient;
  documents: Document[];
}

interface HealthInsightData {
  summary: string;
  riskFactors: string[];
  recommendations: string[];
  medicationInsights: string;
  preventiveCare: string[];
  lifestyleSuggestions: string[];
  followUpCare: string;
  disclaimer: string;
}

const HealthInsights: React.FC<HealthInsightsProps> = memo(({ patient, documents }) => {
  const [insights, setInsights] = useState<HealthInsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'risks' | 'medications' | 'lifestyle' | 'followup'>('overview');

  useEffect(() => {
    if (patient && !insights && !loading) {
      // Auto-generate insights on first load
      generateInsights();
    }
  }, [patient]);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    console.log('Generating health insights for patient:', patient?.name);
    console.log('Documents count:', documents?.length);

    try {
      const healthInsights = await generateSimpleHealthInsights(patient, documents);
      console.log('Generated insights:', healthInsights);
      setInsights(healthInsights);
    } catch (err) {
      console.error('Health insights error:', err);
      setError('Failed to generate health insights. Please try again.');

      // Fallback insights for testing
      setInsights({
        summary: `Health analysis for ${patient?.name || 'patient'}. Based on available data, including ${patient?.records?.length || 0} medical records and ${patient?.currentMedications?.length || 0} current medications.`,
        riskFactors: patient?.conditions?.length > 0 ? patient.conditions : ['No specific risk factors identified'],
        recommendations: ['Continue regular medical check-ups', 'Maintain current medication schedule', 'Follow up with healthcare provider'],
        medicationInsights: patient?.currentMedications?.length > 0
          ? `Currently taking ${patient.currentMedications.length} medications. Please consult with your doctor about any questions or concerns.`
          : 'No current medications on record.',
        preventiveCare: ['Regular health screenings', 'Maintain healthy lifestyle', 'Monitor any changes in health'],
        lifestyleSuggestions: ['Balanced diet', 'Regular exercise', 'Adequate sleep', 'Stress management'],
        followUpCare: 'Schedule regular appointments with your healthcare provider to monitor your health status and adjust treatment plans as needed.',
        disclaimer: 'These insights are provided by Google Gemini AI models and are for informational purposes only. They do not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical decisions.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Generating AI health insights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="material-symbols-outlined text-blue-600 text-2xl mr-3">psychology</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Health Insights</h3>
                  <p className="text-sm text-gray-500">Comprehensive analysis based on your complete health profile</p>
                </div>
              </div>
              <button
                onClick={generateInsights}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                title="Retry Generating Health Insights"
              >
                <span className="material-symbols-outlined text-lg mr-1">refresh</span>
                Retry
              </button>
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={generateInsights}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <span className="material-symbols-outlined text-xl mr-2">refresh</span>
              Retry Generation
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Check your API key configuration and try again
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="material-symbols-outlined text-blue-600 text-2xl mr-3">psychology</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Health Insights</h3>
                  <p className="text-sm text-gray-500">Comprehensive analysis based on your complete health profile</p>
                </div>
              </div>
              <button
                onClick={generateInsights}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                title="Generate Health Insights"
              >
                <span className="material-symbols-outlined text-lg mr-1">refresh</span>
                Generate
              </button>
            </div>
          </div>
        </div>

        {/* No Insights Content */}
        <div className="p-6">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <span className="material-symbols-outlined text-4xl">psychology</span>
            </div>
            <p className="text-gray-600 mb-6">No health insights available yet</p>
            <button
              onClick={generateInsights}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
            >
              <span className="material-symbols-outlined text-xl mr-2">refresh</span>
              Generate Health Insights
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Analyze your complete health profile including records, medications, and documents
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'risks', label: 'Risk Factors', icon: 'warning' },
    { id: 'medications', label: 'Medications', icon: 'medication' },
    { id: 'lifestyle', label: 'Lifestyle', icon: 'favorite' },
    { id: 'followup', label: 'Follow-up', icon: 'calendar_month' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="material-symbols-outlined text-blue-600 text-2xl mr-3">psychology</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Health Insights</h3>
                <p className="text-sm text-gray-500">Comprehensive analysis based on your complete health profile</p>
              </div>
            </div>
            <button
              onClick={generateInsights}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
            >
              <span className="material-symbols-outlined text-lg mr-1">refresh</span>
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="material-symbols-outlined text-lg mr-2 align-middle">
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <span className="material-symbols-outlined text-blue-600 mr-2">summarize</span>
                Health Summary
              </h4>
              <p className="text-gray-700 leading-relaxed">{insights.summary}</p>
            </div>

            {insights.recommendations.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="material-symbols-outlined text-green-600 mr-2">tips_and_updates</span>
                  Key Recommendations
                </h4>
                <ul className="space-y-2">
                  {insights.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2 mt-0.5">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <span className="material-symbols-outlined text-orange-600 mr-2">warning</span>
                Identified Risk Factors
              </h4>
              {insights.riskFactors.length > 0 ? (
                <div className="grid gap-3">
                  {insights.riskFactors.map((risk, index) => (
                    <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <span className="text-orange-600 mr-3 mt-0.5">
                          <span className="material-symbols-outlined text-lg">priority_high</span>
                        </span>
                        <span className="text-gray-700">{risk}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No significant risk factors identified based on current data.</p>
              )}
            </div>

            {insights.preventiveCare.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="material-symbols-outlined text-blue-600 mr-2">health_and_safety</span>
                  Preventive Care Measures
                </h4>
                <ul className="space-y-2">
                  {insights.preventiveCare.map((care, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-0.5">
                        <span className="material-symbols-outlined text-lg">shield</span>
                      </span>
                      <span className="text-gray-700">{care}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <span className="material-symbols-outlined text-purple-600 mr-2">medication</span>
                Medication Analysis
              </h4>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{insights.medicationInsights}</p>
              </div>
            </div>

            {patient.currentMedications && patient.currentMedications.length > 0 && (
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3">Current Medications</h4>
                <div className="grid gap-3">
                  {patient.currentMedications.map((med, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="font-medium text-gray-900">{med.name}</div>
                      <div className="text-sm text-gray-600">
                        {med.dosage} - {med.frequency}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Started: {new Date(med.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lifestyle' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <span className="material-symbols-outlined text-green-600 mr-2">favorite</span>
                Lifestyle Recommendations
              </h4>
              {insights.lifestyleSuggestions.length > 0 ? (
                <div className="grid gap-3">
                  {insights.lifestyleSuggestions.map((suggestion, index) => (
                    <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <span className="text-green-600 mr-3 mt-0.5">
                          <span className="material-symbols-outlined text-lg">eco</span>
                        </span>
                        <span className="text-gray-700">{suggestion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No specific lifestyle recommendations at this time.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'followup' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <span className="material-symbols-outlined text-indigo-600 mr-2">calendar_month</span>
                Follow-up Care
              </h4>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{insights.followUpCare}</p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-yellow-600 mr-3 mt-0.5">
                <span className="material-symbols-outlined text-lg">info</span>
              </span>
              <div>
                <h5 className="font-medium text-gray-900 mb-1">Important Disclaimer</h5>
                <p className="text-sm text-gray-600">{insights.disclaimer}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

HealthInsights.displayName = 'HealthInsights';

export default HealthInsights;