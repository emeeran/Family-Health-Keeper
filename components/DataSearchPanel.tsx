import React, { useState, useEffect } from 'react';
import DataRetrievalService from '../services/dataRetrievalService';
import type { SearchableData, SearchFilters } from '../services/dataRetrievalService';

interface DataSearchPanelProps {
    patientId: string;
    patientName: string;
}

const DataSearchPanel: React.FC<DataSearchPanelProps> = ({ patientId, patientName }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [selectedUrgency, setSelectedUrgency] = useState<string>('');
    const [selectedSource, setSelectedSource] = useState<string>('');
    const [results, setResults] = useState<SearchableData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Data types for filtering
    const dataTypes = [
        { value: 'complaint', label: 'Complaints' },
        { value: 'diagnosis', label: 'Diagnoses' },
        { value: 'investigation', label: 'Investigations' },
        { value: 'prescription', label: 'Prescriptions' },
        { value: 'medication', label: 'Medications' },
        { value: 'note', label: 'Notes' }
    ];

    const urgencyLevels = [
        { value: 'low', label: 'Low Priority' },
        { value: 'medium', label: 'Medium Priority' },
        { value: 'high', label: 'High Priority' }
    ];

    const sourceTypes = [
        { value: 'manual_entry', label: 'Manual Entry' },
        { value: 'document_parsing', label: 'Document Parsing' }
    ];

    // Perform search
    const performSearch = async () => {
        setIsSearching(true);

        try {
            const filters: SearchFilters = {
                patientId,
                searchTerm: searchTerm || undefined,
                type: selectedType || undefined,
                urgency: selectedUrgency as any || undefined,
                source: selectedSource as any || undefined
            };

            const searchResults = DataRetrievalService.searchData(filters);
            setResults(searchResults);
        } catch (error) {
            console.error('Search failed:', error);
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Auto-search on input change (with debounce)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedType, selectedUrgency, selectedSource, patientId]);

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedType('');
        setSelectedUrgency('');
        setSelectedSource('');
    };

    // Get summary data
    const getSummary = () => {
        if (!patientId) return null;
        return DataRetrievalService.getPatientSummary(patientId);
    };

    const summary = getSummary();

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            complaint: 'sick',
            diagnosis: 'medical_information',
            investigation: 'biotech',
            prescription: 'medication',
            medication: 'medication',
            note: 'description',
            vital: 'monitor_heart'
        };
        return icons[type] || 'article';
    };

    const getUrgencyColor = (urgency: string) => {
        const colors: Record<string, string> = {
            low: 'text-green-600',
            medium: 'text-yellow-600',
            high: 'text-red-600'
        };
        return colors[urgency] || 'text-gray-600';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="material-symbols-outlined">search</span>
                        Medical Data Search
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Patient: {patientName}
                    </p>
                </div>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">tune</span>
                    {showAdvanced ? 'Simple' : 'Advanced'}
                </button>
            </div>

            {/* Search Input */}
            <div className="mb-4">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search medical data..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Data Type
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">All Types</option>
                                {dataTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Urgency
                            </label>
                            <select
                                value={selectedUrgency}
                                onChange={(e) => setSelectedUrgency(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">All Levels</option>
                                {urgencyLevels.map(level => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Source
                            </label>
                            <select
                                value={selectedSource}
                                onChange={(e) => setSelectedSource(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">All Sources</option>
                                {sourceTypes.map(source => (
                                    <option key={source.value} value={source.value}>
                                        {source.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={clearFilters}
                        className="w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}

            {/* Summary Stats */}
            {summary && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        Data Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <div className="text-gray-600 dark:text-gray-400">Total Records</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{summary.totalRecords}</div>
                        </div>
                        <div>
                            <div className="text-gray-600 dark:text-gray-400">Documents</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{summary.totalDocuments}</div>
                        </div>
                        <div>
                            <div className="text-gray-600 dark:text-gray-400">Medications</div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">{summary.healthTrends.medicationsCount}</div>
                        </div>
                        <div>
                            <div className="text-gray-600 dark:text-gray-400">High Urgency</div>
                            <div className="font-semibold text-red-600 dark:text-red-400">{summary.urgencyDistribution.high}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Results */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Search Results ({results.length})
                    </h4>
                    {isSearching && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                            Searching...
                        </div>
                    )}
                </div>

                {results.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                        <p>No results found</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {results.map((result, index) => (
                            <div
                                key={`${result.id}-${index}`}
                                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <span className="material-symbols-outlined text-lg text-gray-500 dark:text-gray-400 mt-0.5">
                                            {getTypeIcon(result.type)}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                                    {result.type.replace('_', ' ')}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getUrgencyColor(result.urgency)} bg-opacity-10`}>
                                                    {result.urgency}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(result.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                                                {result.content}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">source</span>
                                                    {result.source.replace('_', ' ')}
                                                </span>
                                                {result.metadata.doctor && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">person</span>
                                                        {result.metadata.doctor}
                                                    </span>
                                                )}
                                                {result.metadata.documentName && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm">description</span>
                                                        {result.metadata.documentName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataSearchPanel;