import { Patient, MedicalRecord, Document } from '../types';
import { ParsedMedicalData } from './medicalRecordParser';

export interface SearchableData {
  id: string;
  patientId: string;
  recordId: string;
  documentId?: string;
  type: 'complaint' | 'diagnosis' | 'investigation' | 'prescription' | 'note' | 'vital' | 'medication';
  content: string;
  originalText: string;
  date: string;
  urgency: 'low' | 'medium' | 'high';
  source: 'manual_entry' | 'document_parsing';
  metadata: {
    doctor?: string;
    documentName?: string;
    documentType?: string;
  };
}

export interface SearchFilters {
  patientId?: string;
  type?: SearchableData['type'];
  urgency?: SearchableData['urgency'];
  source?: SearchableData['source'];
  dateRange?: {
    start: string;
    end: string;
  };
  searchTerm?: string;
}

export class DataRetrievalService {
  private static instance: DataRetrievalService;
  private indexedData: Map<string, SearchableData[]> = new Map();

  private constructor() {}

  static getInstance(): DataRetrievalService {
    if (!DataRetrievalService.instance) {
      DataRetrievalService.instance = new DataRetrievalService();
    }
    return DataRetrievalService.instance;
  }

  /**
   * Index patient data for fast retrieval
   */
  indexPatientData(patient: Patient): void {
    const searchableData: SearchableData[] = [];

    // Process all medical records
    for (const record of patient.records) {
      const doctor = this.getDoctorName(record.doctorId);

      // Index manually entered data
      if (record.parsedData) {
        this.indexParsedData(record.parsedData, patient.id, record.id, undefined, 'manual_entry', record.date, doctor, searchableData);
      }

      // Index basic record data as fallback
      this.indexBasicRecordData(record, patient.id, doctor, searchableData);

      // Process documents
      for (const document of record.documents) {
        if (document.parsedData) {
          this.indexParsedData(
            document.parsedData,
            patient.id,
            record.id,
            document.id,
            'document_parsing',
            record.date,
            doctor,
            searchableData,
            document.name,
            document.type
          );
        }
      }
    }

    // Store indexed data for this patient
    this.indexedData.set(patient.id, searchableData);
  }

  /**
   * Search indexed data with filters
   */
  searchData(filters: SearchFilters): SearchableData[] {
    let results: SearchableData[] = [];

    // If patient filter is specified, search only that patient's data
    if (filters.patientId) {
      results = this.indexedData.get(filters.patientId) || [];
    } else {
      // Search all patients' data
      for (const patientData of this.indexedData.values()) {
        results.push(...patientData);
      }
    }

    // Apply filters
    results = this.applyFilters(results, filters);

    // Sort by date (most recent first)
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return results;
  }

  /**
   * Get comprehensive patient summary
   */
  getPatientSummary(patientId: string): {
    totalRecords: number;
    totalDocuments: number;
    dataByType: Record<string, number>;
    urgencyDistribution: Record<string, number>;
    recentActivity: SearchableData[];
    healthTrends: {
      commonComplaints: string[];
      commonDiagnoses: string[];
      medicationsCount: number;
    };
  } {
    const data = this.indexedData.get(patientId) || [];

    // Count by type
    const dataByType: Record<string, number> = {};
    data.forEach(item => {
      dataByType[item.type] = (dataByType[item.type] || 0) + 1;
    });

    // Count by urgency
    const urgencyDistribution: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0
    };
    data.forEach(item => {
      urgencyDistribution[item.urgency]++;
    });

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentActivity = data.filter(item => new Date(item.date) >= thirtyDaysAgo).slice(0, 10);

    // Health trends analysis
    const complaints = new Map<string, number>();
    const diagnoses = new Map<string, number>();
    let medicationsCount = 0;

    data.forEach(item => {
      if (item.type === 'complaint') {
        complaints.set(item.content, (complaints.get(item.content) || 0) + 1);
      } else if (item.type === 'diagnosis') {
        diagnoses.set(item.content, (diagnoses.get(item.content) || 0) + 1);
      } else if (item.type === 'prescription' || item.type === 'medication') {
        medicationsCount++;
      }
    });

    return {
      totalRecords: new Set(data.map(item => item.recordId)).size,
      totalDocuments: new Set(data.filter(item => item.documentId).map(item => item.documentId)).size,
      dataByType,
      urgencyDistribution,
      recentActivity,
      healthTrends: {
        commonComplaints: Array.from(complaints.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([complaint]) => complaint),
        commonDiagnoses: Array.from(diagnoses.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([diagnosis]) => diagnosis),
        medicationsCount
      }
    };
  }

  /**
   * Get medication history
   */
  getMedicationHistory(patientId: string): SearchableData[] {
    return this.searchData({
      patientId,
      type: 'medication'
    });
  }

  /**
   * Get documents by type
   */
  getDocumentsByType(patientId: string, documentType: string): SearchableData[] {
    return this.searchData({
      patientId,
      searchTerm: documentType
    }).filter(item => item.metadata.documentType === documentType);
  }

  /**
   * Get urgent medical data
   */
  getUrgentData(patientId: string): SearchableData[] {
    return this.searchData({
      patientId,
      urgency: 'high'
    });
  }

  private indexParsedData(
    parsedData: ParsedMedicalData,
    patientId: string,
    recordId: string,
    documentId: string | undefined,
    source: SearchableData['source'],
    date: string,
    doctor: string,
    results: SearchableData[],
    documentName?: string,
    documentType?: string
  ): void {
    // Index chief complaints
    parsedData.chiefComplaints.forEach(complaint => {
      results.push({
        id: `${recordId}-complaint-${Date.now()}`,
        patientId,
        recordId,
        documentId,
        type: 'complaint',
        content: complaint,
        originalText: complaint,
        date,
        urgency: parsedData.urgency,
        source,
        metadata: { doctor, documentName, documentType }
      });
    });

    // Index investigations
    parsedData.investigations.forEach(investigation => {
      results.push({
        id: `${recordId}-investigation-${Date.now()}`,
        patientId,
        recordId,
        documentId,
        type: 'investigation',
        content: investigation,
        originalText: investigation,
        date,
        urgency: parsedData.urgency,
        source,
        metadata: { doctor, documentName, documentType }
      });
    });

    // Index diagnoses
    parsedData.diagnoses.forEach(diagnosis => {
      results.push({
        id: `${recordId}-diagnosis-${Date.now()}`,
        patientId,
        recordId,
        documentId,
        type: 'diagnosis',
        content: diagnosis,
        originalText: diagnosis,
        date,
        urgency: parsedData.urgency,
        source,
        metadata: { doctor, documentName, documentType }
      });
    });

    // Index prescriptions/medications
    parsedData.prescriptions.forEach(prescription => {
      results.push({
        id: `${recordId}-prescription-${Date.now()}`,
        patientId,
        recordId,
        documentId,
        type: 'prescription',
        content: `${prescription.name} ${prescription.strength || ''}`,
        originalText: prescription.name,
        date,
        urgency: parsedData.urgency,
        source,
        metadata: { doctor, documentName, documentType }
      });
    });

    // Index notes
    parsedData.notes.forEach(note => {
      results.push({
        id: `${recordId}-note-${Date.now()}`,
        patientId,
        recordId,
        documentId,
        type: 'note',
        content: note,
        originalText: note,
        date,
        urgency: parsedData.urgency,
        source,
        metadata: { doctor, documentName, documentType }
      });
    });
  }

  private indexBasicRecordData(record: MedicalRecord, patientId: string, doctor: string, results: SearchableData[]): void {
    // Index basic complaint
    if (record.complaint) {
      results.push({
        id: `${record.id}-basic-complaint`,
        patientId,
        recordId: record.id,
        type: 'complaint',
        content: record.complaint,
        originalText: record.complaint,
        date: record.date,
        urgency: 'medium',
        source: 'manual_entry',
        metadata: { doctor }
      });
    }

    // Index basic diagnosis
    if (record.diagnosis) {
      results.push({
        id: `${record.id}-basic-diagnosis`,
        patientId,
        recordId: record.id,
        type: 'diagnosis',
        content: record.diagnosis,
        originalText: record.diagnosis,
        date: record.date,
        urgency: 'medium',
        source: 'manual_entry',
        metadata: { doctor }
      });
    }

    // Index basic investigations
    if (record.investigations) {
      results.push({
        id: `${record.id}-basic-investigations`,
        patientId,
        recordId: record.id,
        type: 'investigation',
        content: record.investigations,
        originalText: record.investigations,
        date: record.date,
        urgency: 'medium',
        source: 'manual_entry',
        metadata: { doctor }
      });
    }
  }

  private applyFilters(data: SearchableData[], filters: SearchFilters): SearchableData[] {
    let filtered = data;

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(item => item.type === filters.type);
    }

    // Filter by urgency
    if (filters.urgency) {
      filtered = filtered.filter(item => item.urgency === filters.urgency);
    }

    // Filter by source
    if (filters.source) {
      filtered = filtered.filter(item => item.source === filters.source);
    }

    // Filter by date range
    if (filters.dateRange) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= new Date(filters.dateRange!.start) && itemDate <= new Date(filters.dateRange!.end);
      });
    }

    // Filter by search term
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.content.toLowerCase().includes(searchTerm) ||
        item.originalText.toLowerCase().includes(searchTerm) ||
        item.metadata.doctor?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }

  private getDoctorName(doctorId: string): string {
    // In a real implementation, this would look up the doctor from a doctors service/store
    return 'Dr. Unknown';
  }

  /**
   * Clear indexed data for a patient (useful when patient data is updated)
   */
  clearPatientData(patientId: string): void {
    this.indexedData.delete(patientId);
  }

  /**
   * Get all indexed patient IDs
   */
  getIndexedPatientIds(): string[] {
    return Array.from(this.indexedData.keys());
  }
}

export default DataRetrievalService.getInstance();