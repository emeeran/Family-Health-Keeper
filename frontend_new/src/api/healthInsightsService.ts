import { GoogleGenAI } from "@google/genai";
import { processMedicalDocument, analyzeDocumentForHealthInsights } from './ocrService';
import type { Patient, MedicalRecord, Document, Medication } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (!API_KEY) {
  console.error("API_KEY environment variable not set. AI insights will be disabled.");
} else {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("Failed to initialize Google AI for health insights:", error);
  }
}

interface HealthInsightData {
  profile: {
    age: number;
    gender: string;
    allergies: string[];
    conditions: string[];
    familyHistory: string;
    surgeries: string[];
  };
  doctorVisits: {
    date: string;
    complaint: string;
    diagnosis: string;
    prescription: string;
    notes: string;
    vitals?: any;
  }[];
  ocrRecords: {
    type: string;
    content: string;
    extractedAt: string;
  }[];
  currentMedications: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
  }[];
}

interface HealthInsightResult {
  summary: string;
  riskFactors: string[];
  recommendations: string[];
  medicationInsights: string;
  preventiveCare: string[];
  lifestyleSuggestions: string[];
  followUpCare: string;
  disclaimer: string;
}

export const generateComprehensiveHealthInsights = async (
  patient: Patient,
  documents: Document[] = []
): Promise<HealthInsightResult> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('Generating insights for patient:', patient.name);
  console.log('Patient records count:', patient.records?.length || 0);
  console.log('Patient medications count:', patient.currentMedications?.length || 0);
  console.log('Documents count:', documents?.length || 0);
  if (!ai || !API_KEY) {
    return {
      summary: "AI insights are not available. Please configure the API key to enable health insights.",
      riskFactors: [],
      recommendations: [],
      medicationInsights: "",
      preventiveCare: [],
      lifestyleSuggestions: [],
      followUpCare: "",
      disclaimer: "AI services are currently unavailable."
    };
  }

  // Prepare comprehensive health data
  const healthData: HealthInsightData = {
    profile: {
      age: calculateAge(patient.dateOfBirth),
      gender: patient.gender,
      allergies: patient.allergies || [],
      conditions: patient.conditions || [],
      familyHistory: patient.familyMedicalHistory || "",
      surgeries: patient.surgeries || []
    },
    doctorVisits: patient.records.map(record => ({
      date: record.date,
      complaint: record.complaint,
      diagnosis: record.diagnosis,
      prescription: record.prescription,
      notes: record.notes,
      vitals: record.vitals
    })),
    ocrRecords: processedDocuments.map(doc => ({
      type: doc.type,
      content: doc.ocrText || extractTextContent(doc),
      extractedAt: doc.uploadedAt,
      extractedData: doc.extractedData || {},
      analysis: doc.analysis || { summary: '', keyFindings: [], recommendations: [] }
    })),
    currentMedications: patient.currentMedications || []
  };

  const prompt = `
**ROLE:** You are HealthAI, an advanced AI assistant specialized in comprehensive health analysis and insights generation.

**TASK:** Analyze the complete health profile data provided and generate comprehensive, actionable health insights based on:
1. Patient demographic and profile information
2. Historical doctor visits and diagnoses
3. Current medications and treatment plans
4. OCR-processed medical records and lab results
5. Family medical history and risk factors

**PATIENT DATA:**
${JSON.stringify(healthData, null, 2)}

**ANALYSIS REQUIREMENTS:**

1. **HEALTH SUMMARY:** Provide a concise overview of the patient's current health status, including:
   - Active conditions and their management status
   - Overall health trajectory based on visit patterns
   - Key health indicators from recent visits
   - Medication adherence and effectiveness patterns

2. **RISK FACTORS:** Identify and categorize potential risk factors:
   - Genetic/family history risks
   - Lifestyle-related risk indicators
   - Medication-related risks
   - Age and gender-specific health risks
   - Environmental or occupational factors

3. **MEDICATION INSIGHTS:** Analyze current medications for:
   - Effectiveness based on visit outcomes
   - Potential side effects and interactions
   - Adherence patterns and suggestions
   - Alternative treatment considerations
   - Long-term medication management

4. **PREVENTIVE CARE RECOMMENDATIONS:** Suggest preventive measures:
   - Recommended screenings and vaccinations
   - Lifestyle modifications for risk reduction
   - Monitoring protocols for existing conditions
   - Early warning signs to watch for

5. **LIFESTYLE SUGGESTIONS:** Provide actionable lifestyle advice:
   - Diet and nutrition recommendations
   - Exercise and physical activity guidelines
   - Stress management and mental health support
   - Sleep hygiene recommendations
   - Substance use guidance

6. **FOLLOW-UP CARE:** Outline recommended follow-up:
   - Next scheduled visit priorities
   - Questions to discuss with healthcare providers
   - Tests or screenings to request
   - Specialist consultations if needed

**OUTPUT FORMAT:** Provide a JSON response with the following structure:
{
  "summary": "Comprehensive health summary paragraph",
  "riskFactors": ["List of identified risk factors"],
  "recommendations": ["List of actionable recommendations"],
  "medicationInsights": "Detailed medication analysis",
  "preventiveCare": ["List of preventive care suggestions"],
  "lifestyleSuggestions": ["List of lifestyle recommendations"],
  "followUpCare": "Follow-up care guidance",
  "disclaimer": "Standard medical disclaimer"
}

**IMPORTANT GUIDELINES:**
- Use clear, patient-friendly language
- Prioritize actionable insights over theoretical information
- Include specific recommendations based on the actual data provided
- Avoid making definitive medical diagnoses
- Emphasize the importance of professional medical consultation
- Consider age, gender, and individual health context
- Focus on preventive and proactive health management

**DISCLAIMER REQUIREMENT:** Always include: "These insights are provided by Google Gemini AI models and are for informational purposes only. They do not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical decisions."
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are HealthAI, an advanced AI assistant providing comprehensive health insights based on complete patient data including demographics, medical history, medications, and OCR-processed records. Focus on preventive care, risk assessment, and actionable health recommendations.",
        temperature: 0.3,
      }
    });

    const aiResponse = response.text;

    // Try to parse as JSON, fallback to text if needed
    try {
      return JSON.parse(aiResponse);
    } catch {
      // If JSON parsing fails, create structured response from text
      return {
        summary: aiResponse,
        riskFactors: extractListItems(aiResponse, "risk factors"),
        recommendations: extractListItems(aiResponse, "recommendations"),
        medicationInsights: extractSection(aiResponse, "medication"),
        preventiveCare: extractListItems(aiResponse, "preventive"),
        lifestyleSuggestions: extractListItems(aiResponse, "lifestyle"),
        followUpCare: extractSection(aiResponse, "follow up"),
        disclaimer: "These insights are provided by Google Gemini AI models and are for informational purposes only. They do not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical decisions."
      };
    }
  } catch (error) {
    console.error("Health insights generation failed:", error);
    return {
      summary: "Unable to generate health insights at this time. Please try again later.",
      riskFactors: [],
      recommendations: ["Consult with your healthcare provider for personalized health advice"],
      medicationInsights: "Medication analysis unavailable. Please consult your pharmacist or doctor.",
      preventiveCare: [],
      lifestyleSuggestions: [],
      followUpCare: "Schedule regular appointments with your healthcare providers.",
      disclaimer: "AI services are currently unavailable. Please consult with healthcare professionals."
    };
  }
};

// Helper functions
const calculateAge = (dateOfBirth: string): number => {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const extractTextContent = (document: Document): string => {
  // In a real implementation, this would extract text from OCR-processed documents
  // For now, return placeholder
  return `Document: ${document.name} (${document.type}) - Content would be extracted here`;
};

const extractListItems = (text: string, keyword: string): string[] => {
  const lines = text.toLowerCase().split('\n');
  const items: string[] = [];
  let capturing = false;

  for (const line of lines) {
    if (line.includes(keyword)) {
      capturing = true;
      continue;
    }
    if (capturing && (line.includes(':') || line.includes('-') || line.includes('•'))) {
      items.push(line.replace(/^[-•]\s*/, '').trim());
    }
  }
  return items;
};

const extractSection = (text: string, keyword: string): string => {
  const lines = text.split('\n');
  let section = '';
  let capturing = false;

  for (const line of lines) {
    if (line.toLowerCase().includes(keyword)) {
      capturing = true;
      continue;
    }
    if (capturing && line.trim() === '') {
      break;
    }
    if (capturing) {
      section += line + ' ';
    }
  }
  return section.trim();
};

export default generateComprehensiveHealthInsights;