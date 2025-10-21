import React from 'react';
import { FileText, AlertTriangle, CheckCircle, Clock, Pill, Calendar, User } from 'lucide-react';
import { VisitOverview as VisitOverviewType } from '../services/medicalRecordParser';

interface VisitOverviewProps {
  overview: VisitOverviewType;
  patientName?: string;
  doctorName?: string;
  visitDate?: string;
}

// Simple markdown formatter for medical content
const formatMarkdown = (text: string): string => {
  return text
    // Convert **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* to <em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-slate-900 mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-slate-900 mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-slate-900 mt-8 mb-4">$1</h1>')
    // Convert bullet points
    .replace(/^[\*\-] (.*$)/gim, '<li class="ml-4 mb-1">• $1</li>')
    // Convert numbered lists
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-1 list-decimal">$1</li>')
    // Convert line breaks
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/\n/g, '<br />')
    // Wrap in paragraphs if not already wrapped
    .replace(/^(?!<[h|l|p])/gim, '<p class="mb-4">')
    .replace(/(?<!>)$/gim, '</p>');
};

export const VisitOverview: React.FC<VisitOverviewProps> = ({
  overview,
  patientName,
  doctorName,
  visitDate,
}) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <AlertTriangle className='h-4 w-4' />;
      case 'medium':
        return <Clock className='h-4 w-4' />;
      case 'low':
        return <CheckCircle className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Professional Header */}
      <div className='bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-xl border border-slate-200 shadow-sm'>
        <div className='flex items-start justify-between'>
          <div>
            <h3 className='text-2xl font-bold text-slate-900 mb-3 flex items-center gap-3'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <FileText className='h-5 w-5 text-blue-700' />
              </div>
              Overview of this Visit
            </h3>

            {(patientName || doctorName || visitDate) && (
              <div className='flex flex-wrap gap-4 text-sm text-slate-600 bg-white/50 p-3 rounded-lg'>
                {patientName && (
                  <div className='flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-slate-200'>
                    <User className='h-4 w-4 text-slate-500' />
                    <span className='font-medium'>Patient:</span>
                    <span>{patientName}</span>
                  </div>
                )}
                {doctorName && (
                  <div className='flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-slate-200'>
                    <FileText className='h-4 w-4 text-slate-500' />
                    <span className='font-medium'>Provider:</span>
                    <span>{doctorName}</span>
                  </div>
                )}
                {visitDate && (
                  <div className='flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-slate-200'>
                    <Calendar className='h-4 w-4 text-slate-500' />
                    <span className='font-medium'>Date:</span>
                    <span>
                      {new Date(visitDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Urgency Indicator */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getUrgencyColor(overview.urgencyLevel)}`}
      >
        {getUrgencyIcon(overview.urgencyLevel)}
        <span className='font-medium capitalize'>{overview.urgencyLevel} Priority</span>
      </div>

      {/* Clinical Summary - Formatted in Markdown */}
      <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
        <h4 className='text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2'>
          <div className='w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center'>
            <FileText className='h-4 w-4 text-blue-700' />
          </div>
          Clinical Summary
        </h4>
        <div className='bg-slate-50 p-4 rounded-lg border border-slate-100'>
          <div
            className='prose prose-slate max-w-none text-slate-700 leading-relaxed'
            dangerouslySetInnerHTML={{
              __html: formatMarkdown(overview.summary)
            }}
          />
        </div>
      </div>

      {/* Key Clinical Findings */}
      {overview.keyFindings.length > 0 && (
        <div className='bg-white p-6 rounded-xl border border-slate-200 shadow-sm'>
          <h4 className='text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2'>
            <div className='w-6 h-6 bg-green-100 rounded-md flex items-center justify-center'>
              <CheckCircle className='h-4 w-4 text-green-700' />
            </div>
            Key Clinical Findings
          </h4>
          <div className='space-y-3'>
            {overview.keyFindings.map((finding, index) => (
              <div
                key={index}
                className='flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100'
              >
                <div className='w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0'></div>
                <span className='text-slate-700 font-medium'>{finding}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Red Flags */}
      {overview.redFlags.length > 0 && (
        <div className='bg-red-50 p-6 rounded-xl border border-red-200'>
          <h4 className='text-lg font-semibold text-red-900 mb-3 flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5' />
            Important Alerts
          </h4>
          <ul className='space-y-2'>
            {overview.redFlags.map((flag, index) => (
              <li key={index} className='flex items-start gap-3'>
                <div className='w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0'></div>
                <span className='text-red-800'>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Medication Changes */}
      {(overview.medicationChanges.added.length > 0 ||
        overview.medicationChanges.modified.length > 0 ||
        overview.medicationChanges.discontinued.length > 0) && (
        <div className='bg-white p-6 rounded-xl border border-gray-200 shadow-sm'>
          <h4 className='text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2'>
            <Pill className='h-5 w-5' />
            Medication Changes
          </h4>

          {overview.medicationChanges.added.length > 0 && (
            <div className='mb-4'>
              <h5 className='font-medium text-green-700 mb-2'>New Medications:</h5>
              <ul className='space-y-1'>
                {overview.medicationChanges.added.map((med, index) => (
                  <li key={index} className='text-sm text-gray-700 ml-4'>
                    • {med.name} {med.strength ? `(${med.strength})` : ''} - {med.dosage}{' '}
                    {med.frequency}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overview.medicationChanges.modified.length > 0 && (
            <div className='mb-4'>
              <h5 className='font-medium text-yellow-700 mb-2'>Modified Medications:</h5>
              <ul className='space-y-1'>
                {overview.medicationChanges.modified.map((med, index) => (
                  <li key={index} className='text-sm text-gray-700 ml-4'>
                    • {med.name} {med.strength ? `(${med.strength})` : ''} - {med.dosage}{' '}
                    {med.frequency}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {overview.medicationChanges.discontinued.length > 0 && (
            <div>
              <h5 className='font-medium text-red-700 mb-2'>Discontinued Medications:</h5>
              <ul className='space-y-1'>
                {overview.medicationChanges.discontinued.map((med, index) => (
                  <li key={index} className='text-sm text-gray-700 ml-4'>
                    • {med}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendations - Formatted in Markdown */}
      {overview.recommendations.length > 0 && (
        <div className='bg-blue-50 p-6 rounded-xl border border-blue-200'>
          <h4 className='text-lg font-semibold text-blue-900 mb-3'>Recommendations</h4>
          <div className='space-y-2'>
            {overview.recommendations.map((recommendation, index) => (
              <div key={index} className='flex items-start gap-3'>
                <CheckCircle className='h-4 w-4 text-blue-600 mt-1 flex-shrink-0' />
                <div
                  className='text-blue-800 leading-relaxed'
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdown(recommendation)
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up Plan - Formatted in Markdown */}
      <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200'>
        <h4 className='text-lg font-semibold text-green-900 mb-3 flex items-center gap-2'>
          <Calendar className='h-5 w-5' />
          Follow-up Plan
        </h4>
        <div
          className='text-green-800 font-medium leading-relaxed'
          dangerouslySetInnerHTML={{
            __html: formatMarkdown(overview.followUpPlan)
          }}
        />
      </div>

      {/* Footer */}
      <div className='text-xs text-gray-500 text-center pt-4 border-t border-gray-200'>
        AI-generated overview based on medical record analysis. Please verify all medical
        information with your healthcare provider.
      </div>
    </div>
  );
};

export default VisitOverview;
