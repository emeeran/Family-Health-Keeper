import React from 'react';
import { Pill, AlertTriangle, CheckCircle, Plus, Minus, Edit3, Info, TriangleAlert } from 'lucide-react';
import { MedicationReconciliationService, MedicationChange, ReconciliationResult } from '../services/medicationReconciliation';
import { Medication } from '../types';

interface MedicationReconciliationProps {
  result: ReconciliationResult;
  onApproveChanges?: (changes: MedicationChange[]) => void;
  onReviewMedication?: (medication: Medication) => void;
}

export const MedicationReconciliation: React.FC<MedicationReconciliationProps> = ({
  result,
  onApproveChanges,
  onReviewMedication
}) => {
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'discontinued':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified':
        return <Edit3 className="h-4 w-4 text-yellow-600" />;
      case 'continued':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Pill className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'discontinued':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'modified':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'continued':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatMedicationName = (medication: Medication) => {
    return `${medication.name}${medication.strength ? ` ${medication.strength}` : ''}`;
  };

  const requiresAttentionChanges = result.changes.filter(change =>
    change.changeType === 'added' ||
    change.changeType === 'discontinued' ||
    change.changeType === 'modified'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Medication Reconciliation</h3>
            <p className="text-sm text-gray-600">
              {MedicationReconciliationService.generateReconciliationSummary(result)}
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">{result.summary.added}</div>
            <div className="text-xs text-gray-600">Added</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-yellow-600">{result.summary.modified}</div>
            <div className="text-xs text-gray-600">Modified</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">{result.summary.discontinued}</div>
            <div className="text-xs text-gray-600">Discontinued</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{result.summary.continued}</div>
            <div className="text-xs text-gray-600">Continued</div>
          </div>
        </div>
      </div>

      {/* Requires Attention */}
      {requiresAttentionChanges.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h4 className="font-semibold text-amber-900">Requires Attention</h4>
            <span className="bg-amber-600 text-white text-xs px-2 py-1 rounded-full">
              {requiresAttentionChanges.length}
            </span>
          </div>
          <p className="text-sm text-amber-800 mb-3">
            The following medication changes need to be reviewed and approved:
          </p>
          <div className="space-y-2">
            {requiresAttentionChanges.map((change, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${getChangeColor(change.changeType)}`}
              >
                <div className="flex items-start gap-3">
                  {getChangeIcon(change.changeType)}
                  <div className="flex-1">
                    <div className="font-medium">
                      {formatMedicationName(change.medication)}
                    </div>
                    <div className="text-sm opacity-75">
                      {change.medication.dosage} - {change.medication.frequency}
                    </div>
                    {change.reason && (
                      <div className="text-xs mt-1 opacity-75">
                        Reason: {change.reason}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onReviewMedication?.(change.medication)}
                    className="p-1 hover:bg-white/50 rounded transition-colors"
                    title="Review medication"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {onApproveChanges && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => onApproveChanges(requiresAttentionChanges)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
              >
                Approve All Changes
              </button>
              <button
                className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium border border-gray-300"
              >
                Review Individually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detailed Changes */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Detailed Changes</h4>

        {result.changes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">No medication changes detected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {result.changes.map((change, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-all hover:shadow-md ${getChangeColor(change.changeType)}`}
              >
                <div className="flex items-start gap-3">
                  {getChangeIcon(change.changeType)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">
                        {change.changeType}
                      </span>
                      <span className="text-xs opacity-75">
                        via {change.source}
                      </span>
                    </div>
                    <div className="font-medium text-lg">
                      {formatMedicationName(change.medication)}
                    </div>
                    <div className="text-sm">
                      {change.medication.dosage} - {change.medication.frequency}
                    </div>

                    {/* Show previous medication for modifications */}
                    {change.changeType === 'modified' && change.previousMedication && (
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <div className="text-xs opacity-75 mb-1">Previously:</div>
                        <div className="text-sm">
                          {formatMedicationName(change.previousMedication)} - {change.previousMedication.dosage} - {change.previousMedication.frequency}
                        </div>
                      </div>
                    )}

                    {change.reason && (
                      <div className="text-xs mt-2 opacity-75">
                        {change.reason}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onReviewMedication?.(change.medication)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    title="Review medication details"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Medications Summary */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Current Medications ({result.currentMedications.length})</h4>
        {result.currentMedications.length > 0 ? (
          <div className="grid gap-2">
            {result.currentMedications.map((med, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">{formatMedicationName(med)}</span>
                <span className="text-gray-600">{med.dosage} - {med.frequency}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No active medications</p>
        )}
      </div>

      {/* Discontinued Medications */}
      {result.discontinuedMedications.length > 0 && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-200">
          <h4 className="font-semibold text-red-900 mb-3">Discontinued Medications ({result.discontinuedMedications.length})</h4>
          <div className="grid gap-2">
            {result.discontinuedMedications.map((med, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="font-medium text-red-800">{formatMedicationName(med)}</span>
                <span className="text-red-600">{med.dosage} - {med.frequency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="text-xs text-gray-500 text-center bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Info className="h-3 w-3" />
          <span>Medication reconciliation completed automatically</span>
        </div>
        <p>Review all changes carefully and consult with healthcare providers before implementing</p>
      </div>
    </div>
  );
};

export default MedicationReconciliation;