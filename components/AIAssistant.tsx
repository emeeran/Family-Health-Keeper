import React, { useState } from 'react';
import { getMedicalInsight } from '../services/geminiService';
import type { MedicalRecord, Patient } from '../types';

interface AIAssistantProps {
    record: MedicalRecord;
    history: string;
    patient: Patient;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ record, history, patient }) => {
    const [insight, setInsight] = useState<string>("Select an insight type and click 'Generate Insight' to get AI-powered suggestions.");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [insightType, setInsightType] = useState<string>('general');

    const handleGenerateInsight = async () => {
        if (!record.complaint && !record.diagnosis) {
            setInsight("Please enter a complaint or diagnosis before generating insights.");
            return;
        }
        
        setIsLoading(true);
        setInsight(''); // Clear previous insight
        try {
            const result = await getMedicalInsight(record, patient, insightType);
            setInsight(result);
        } catch (error) {
            setInsight('Failed to load AI insight.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyInsight = () => {
        if (!insight || isLoading || isCopied) return;
        navigator.clipboard.writeText(insight).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div className="py-6 border-b border-border-light dark:border-border-dark">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-DEFAULT">auto_awesome</span>
                    <h4 className="text-lg font-semibold text-text-light dark:text-text-dark">HealthGemma Insights</h4>
                </div>
            </div>
            <div className="space-y-3 text-sm text-subtle-light dark:text-subtle-dark min-h-[60px]">
                {isLoading ? (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap">{insight}</p>
                )}
            </div>
            <div className="mt-4 flex items-center gap-3 flex-wrap">
                <div>
                    <label htmlFor="insight-type" className="sr-only">Insight Type</label>
                    <select
                        id="insight-type"
                        value={insightType}
                        onChange={(e) => setInsightType(e.target.value)}
                        className="w-full sm:w-auto rounded-md border-border-light dark:border-border-dark bg-input-bg-light dark:bg-input-bg-dark shadow-sm focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT text-sm"
                        disabled={isLoading}
                        aria-label="Select insight type"
                    >
                        <option value="general">General Insight</option>
                        <option value="interactions">Potential Interactions</option>
                        <option value="monitoring">Monitoring Suggestions</option>
                        <option value="questions">Questions for Doctor</option>
                    </select>
                </div>
                <button
                    onClick={handleGenerateInsight}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-DEFAULT rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-DEFAULT disabled:opacity-50 disabled:cursor-wait transition-colors"
                >
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    <span>{isLoading ? 'Generating...' : 'Generate Insight'}</span>
                </button>
                <button
                    onClick={handleCopyInsight}
                    disabled={!insight || insight.startsWith("Select") || insight.startsWith("Please") || isLoading || isCopied}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-subtle-light dark:text-subtle-dark bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                     <span className="material-symbols-outlined text-base">{isCopied ? 'done' : 'content_copy'}</span>
                    <span>{isCopied ? 'Copied!' : 'Copy Insight'}</span>
                </button>
            </div>
        </div>
    );
};

export default AIAssistant;