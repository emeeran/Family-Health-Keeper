import React, { useMemo } from 'react';
import type { Medication } from '../types';

interface DrugInteraction {
  severity: 'high' | 'moderate' | 'low';
  medication1: string;
  medication2: string;
  description: string;
  recommendation: string;
  evidence: string;
}

interface DrugInteractionsProps {
  medications: Medication[];
}

// Common drug interactions database
const commonInteractions: DrugInteraction[] = [
  {
    severity: 'high',
    medication1: 'warfarin',
    medication2: 'aspirin',
    description: 'Increased risk of bleeding',
    recommendation: 'Avoid concurrent use. If essential, monitor INR closely and watch for bleeding signs.',
    evidence: 'Significant increase in bleeding risk'
  },
  {
    severity: 'high',
    medication1: 'lisinopril',
    medication2: 'ibuprofen',
    description: 'Reduced antihypertensive effect and increased kidney risk',
    recommendation: 'Use acetaminophen instead for pain relief. Monitor blood pressure and kidney function.',
    evidence: 'NSAIDs can reduce ACE inhibitor effectiveness'
  },
  {
    severity: 'moderate',
    medication1: 'metformin',
    medication2: 'furosemide',
    description: 'Increased risk of lactic acidosis',
    recommendation: 'Monitor kidney function regularly. Watch for signs of lactic acidosis.',
    evidence: 'Both drugs affect kidney function'
  },
  {
    severity: 'high',
    medication1: 'simvastatin',
    medication2: 'clarithromycin',
    description: 'Increased risk of muscle damage and rhabdomyolysis',
    recommendation: 'Avoid concurrent use. Consider alternative antibiotics or statins.',
    evidence: 'Clarithromycin inhibits statin metabolism'
  },
  {
    severity: 'moderate',
    medication1: 'digoxin',
    medication2: 'furosemide',
    description: 'Increased risk of digoxin toxicity',
    recommendation: 'Monitor digoxin levels and electrolytes closely. Watch for toxicity signs.',
    evidence: 'Diuretics can increase digoxin levels'
  },
  {
    severity: 'moderate',
    medication1: 'sertraline',
    medication2: 'tramadol',
    description: 'Increased risk of seizures and serotonin syndrome',
    recommendation: 'Use with caution. Monitor for neurological symptoms.',
    evidence: 'Both affect serotonin levels'
  },
  {
    severity: 'high',
    medication1: 'clopidogrel',
    medication2: 'omeprazole',
    description: 'Reduced antiplatelet effect of clopidogrel',
    recommendation: 'Avoid omeprazole. Use alternative PPIs like pantoprazole.',
    evidence: 'Omeprazole inhibits clopidogrel activation'
  },
  {
    severity: 'moderate',
    medication1: 'metformin',
    medication2: 'contrast media',
    description: 'Increased risk of lactic acidosis',
    recommendation: 'Hold metformin before and after contrast procedures. Monitor kidney function.',
    evidence: 'Contrast can affect kidney function'
  },
  {
    severity: 'high',
    medication1: 'albuterol',
    medication2: 'propranolol',
    description: 'Reduced effectiveness of albuterol',
    recommendation: 'Use cardioselective beta-blockers. Monitor respiratory function.',
    evidence: 'Non-selective beta-blockers can block bronchodilation'
  },
  {
    severity: 'moderate',
    medication1: 'atorvastatin',
    medication2: 'grapefruit juice',
    description: 'Increased statin levels and side effects',
    recommendation: 'Avoid grapefruit juice. Monitor for muscle pain.',
    evidence: 'Grapefruit inhibits statin metabolism'
  }
];

const DrugInteractions: React.FC<DrugInteractionsProps> = ({ medications }) => {
  const interactions = useMemo(() => {
    if (medications.length < 2) return [];

    const foundInteractions: DrugInteraction[] = [];
    const medNames = medications.map(med => med.name.toLowerCase());

    commonInteractions.forEach(interaction => {
      const hasMed1 = medNames.some(name => name.includes(interaction.medication1));
      const hasMed2 = medNames.some(name => name.includes(interaction.medication2));

      if (hasMed1 && hasMed2) {
        foundInteractions.push(interaction);
      }
    });

    // Sort by severity
    const severityOrder = { high: 3, moderate: 2, low: 1 };
    return foundInteractions.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);
  }, [medications]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'moderate':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'High Risk';
      case 'moderate':
        return 'Moderate Risk';
      case 'low':
        return 'Low Risk';
      default:
        return 'Unknown Risk';
    }
  };

  if (medications.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Drug Interactions</h3>
        <p className="text-gray-600 dark:text-gray-400">No medications available to check for interactions.</p>
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Drug Interactions</h3>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <h4 className="font-medium text-green-800">No Significant Interactions Found</h4>
              <p className="text-green-700 text-sm mt-1">
                No known interactions detected among current medications ({medications.length} medications checked).
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p className="font-medium">Current medications:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {medications.map((med, index) => (
              <li key={index}>{med.name} {med.strength && `(${med.strength})`}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Drug Interactions</h3>

      <div className="mb-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <h4 className="font-medium text-amber-800">
                {interactions.length} Potential {interactions.length > 1 ? 'Interactions' : 'Interaction'} Found
              </h4>
              <p className="text-amber-700 text-sm mt-1">
                Review these interactions carefully and consult with healthcare providers.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {interactions.map((interaction, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getSeverityColor(interaction.severity)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <span className="text-xl mr-2">{getSeverityIcon(interaction.severity)}</span>
                <h4 className="font-medium">{getSeverityText(interaction.severity)}</h4>
              </div>
            </div>

            <div className="mb-3">
              <h5 className="font-medium text-sm mb-1">Interaction:</h5>
              <p className="text-sm opacity-90">
                <span className="font-medium">{interaction.medication1}</span> +{' '}
                <span className="font-medium">{interaction.medication2}</span>
              </p>
            </div>

            <div className="mb-3">
              <h5 className="font-medium text-sm mb-1">Description:</h5>
              <p className="text-sm opacity-90">{interaction.description}</p>
            </div>

            <div className="mb-3">
              <h5 className="font-medium text-sm mb-1">Recommendation:</h5>
              <p className="text-sm opacity-90 font-medium">{interaction.recommendation}</p>
            </div>

            <div>
              <h5 className="font-medium text-sm mb-1">Evidence:</h5>
              <p className="text-xs opacity-75 italic">{interaction.evidence}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-2">Disclaimer:</p>
          <p>
            This interaction checker provides general information and is not a substitute for professional medical advice.
            Always consult with healthcare providers before making any changes to medication regimens.
          </p>
          <p className="mt-2">
            Report any unusual symptoms to healthcare providers immediately.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DrugInteractions;