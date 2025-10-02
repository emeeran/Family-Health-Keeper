import type { Document } from '../types';

interface OCRResult {
  text: string;
  confidence: number;
  extractedData: {
    patientName?: string;
    date?: string;
    diagnosis?: string[];
    medications?: string[];
    labResults?: Array<{
      test: string;
      value: string;
      unit: string;
      reference?: string;
    }>;
    vitals?: Array<{
      measurement: string;
      value: string;
      unit: string;
    }>;
  };
}

export const processMedicalDocument = async (document: Document): Promise<OCRResult> => {
  // In a real implementation, this would use OCR services like:
  // - Google Vision API
  // - Tesseract.js
  // - Azure Computer Vision
  // - Amazon Textract

  // For now, simulate OCR processing based on document type
  const mockOCRResult = simulateOCRProcessing(document);

  // Add delay to simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  return mockOCRResult;
};

const simulateOCRProcessing = (document: Document): OCRResult => {
  const baseResult: OCRResult = {
    text: `Document: ${document.name}\nType: ${document.type}\nUpload Date: ${new Date(document.uploadedAt).toLocaleDateString()}`,
    confidence: 0.95,
    extractedData: {}
  };

  // Simulate different OCR results based on document type
  switch (document.type) {
    case 'pdf':
      return {
        ...baseResult,
        text: `${baseResult.text}\n\nMEDICAL REPORT\nPatient: John Doe\nDate: 2024-01-15\nDiagnosis: Hypertension, Type 2 Diabetes\nMedications: Metformin 500mg, Lisinopril 10mg\nLab Results:\n- Fasting Glucose: 125 mg/dL (High)\n- Blood Pressure: 140/90 mmHg (High)\n- HbA1c: 7.2% (High)\nRecommendations: Continue current medications, follow up in 3 months`,
        extractedData: {
          patientName: "John Doe",
          date: "2024-01-15",
          diagnosis: ["Hypertension", "Type 2 Diabetes"],
          medications: ["Metformin 500mg", "Lisinopril 10mg"],
          labResults: [
            { test: "Fasting Glucose", value: "125", unit: "mg/dL", reference: "High" },
            { test: "Blood Pressure", value: "140/90", unit: "mmHg", reference: "High" },
            { test: "HbA1c", value: "7.2", unit: "%", reference: "High" }
          ],
          vitals: [
            { measurement: "Blood Pressure", value: "140/90", unit: "mmHg" }
          ]
        }
      };

    case 'image':
      return {
        ...baseResult,
        text: `${baseResult.text}\n\nPRESCRIPTION\nDr. Sarah Johnson\nDate: 2024-01-20\nPatient: John Doe\nRx:\n1. Metformin 500mg - Take 1 tablet twice daily with meals\n2. Lisinopril 10mg - Take 1 tablet daily\nRefills: 3\nNext Appointment: 2024-04-20`,
        extractedData: {
          patientName: "John Doe",
          date: "2024-01-20",
          medications: ["Metformin 500mg - 1 tablet twice daily", "Lisinopril 10mg - 1 tablet daily"]
        }
      };

    default:
      return baseResult;
  }
};

export const extractMedicalKeywords = (text: string): string[] => {
  const medicalKeywords = [
    'diagnosis', 'treatment', 'medication', 'prescription', 'symptoms',
    'hypertension', 'diabetes', 'cholesterol', 'glucose', 'blood pressure',
    'heart rate', 'temperature', 'weight', 'height', 'bmi',
    'lab results', 'blood test', 'x-ray', 'mri', 'ct scan',
    'referral', 'consultation', 'follow-up', 'appointment'
  ];

  const foundKeywords: string[] = [];
  const lowerText = text.toLowerCase();

  medicalKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  });

  return [...new Set(foundKeywords)]; // Remove duplicates
};

export const analyzeDocumentForHealthInsights = async (
  document: Document,
  patient: any
): Promise<{
  summary: string;
  keyFindings: string[];
  recommendations: string[];
}> => {
  const ocrResult = await processMedicalDocument(document);
  const keywords = extractMedicalKeywords(ocrResult.text);

  // Analyze the extracted data for health insights
  const keyFindings: string[] = [];
  const recommendations: string[] = [];

  // Analyze lab results
  if (ocrResult.extractedData.labResults) {
    ocrResult.extractedData.labResults.forEach(result => {
      if (result.reference === 'High' || result.reference === 'Low') {
        keyFindings.push(`${result.test}: ${result.value} ${result.unit} (${result.reference})`);

        // Add specific recommendations based on the abnormal result
        if (result.test.toLowerCase().includes('glucose')) {
          recommendations.push('Monitor blood sugar levels regularly');
          recommendations.push('Follow dietary guidelines for diabetes management');
        } else if (result.test.toLowerCase().includes('pressure')) {
          recommendations.push('Monitor blood pressure daily');
          recommendations.push('Reduce sodium intake');
        }
      }
    });
  }

  // Analyze medications
  if (ocrResult.extractedData.medications) {
    keyFindings.push(`Current medications: ${ocrResult.extractedData.medications.join(', ')}`);
    recommendations.push('Take medications as prescribed');
    recommendations.push('Report any side effects to your doctor');
  }

  // Analyze diagnoses
  if (ocrResult.extractedData.diagnosis) {
    keyFindings.push(`Diagnoses: ${ocrResult.extractedData.diagnosis.join(', ')}`);
    recommendations.push('Follow treatment plan as outlined by your healthcare provider');
  }

  const summary = `Document analysis complete. Found ${keywords.length} medical keywords and ${keyFindings.length} key findings.`;

  return {
    summary,
    keyFindings,
    recommendations
  };
};

export default processMedicalDocument;