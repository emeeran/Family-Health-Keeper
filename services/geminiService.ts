
import { GoogleGenAI } from "@google/genai";
import type { MedicalRecord, Patient } from '../types';

const API_KEY = import.meta.env.VITE_API_KEY;
// Add Hugging Face credentials for fallback
const HUGGING_FACE_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY;
const HUGGING_FACE_MODEL_URL = "https://api-inference.huggingface.co/models/google/medigemma";

let ai: GoogleGenAI | null = null;

if (!API_KEY) {
  // A more user-friendly error could be shown in the UI
  console.error("API_KEY environment variable not set. AI features will be disabled.");
} else {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("Failed to initialize Google AI:", error);
  }
}

// Helper to check for quota errors specifically, to avoid falling back unnecessarily.
const isQuotaError = (error: unknown): boolean => {
    let errorObj: any = {};
    let errorTextForFallback = '';

    if (typeof error === 'string') {
        errorTextForFallback = error;
        try {
            errorObj = JSON.parse(error);
        } catch {
            // Not a JSON string, but we can still check the text
        }
    } else if (error instanceof Error) {
        errorTextForFallback = error.message;
         try {
            // The message might contain JSON
            errorObj = JSON.parse(error.message);
        } catch {
            // Not a JSON message, continue
        }
    } else if (typeof error === 'object' && error !== null) {
        errorObj = error;
        try {
            errorTextForFallback = JSON.stringify(error);
        } catch {
           // ignore
        }
    }

    // Direct check for Google API error structure
    if (errorObj?.error?.status === 'RESOURCE_EXHAUSTED') {
        return true;
    }
    
    // Fallback to string matching for broader compatibility
    const lowerErrorText = errorTextForFallback.toLowerCase();
    return lowerErrorText.includes('quota') || lowerErrorText.includes('limit') || lowerErrorText.includes('resource_exhausted');
};

// Fallback function using Hugging Face Inference API
const generateContentWithHuggingFace = async (prompt: string, context: 'summary' | 'insight'): Promise<string> => {
    if (!HUGGING_FACE_API_KEY) {
        console.warn("HUGGING_FACE_API_KEY is not set. Fallback is disabled.");
        return `Primary AI service failed. The fallback service is not configured.`;
    }

    console.log(`Attempting fallback for ${context} with Hugging Face Medigemma.`);

    try {
        const response = await fetch(HUGGING_FACE_MODEL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputs: prompt }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Hugging Face API request failed with status ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        
        // The response is typically an array: [{ "generated_text": "..." }]
        if (Array.isArray(result) && result[0]?.generated_text) {
            const fullText = result[0].generated_text;
            // Medigemma often repeats the prompt, so we remove it from the response.
            if (fullText.trim().startsWith(prompt.trim())) {
                return fullText.trim().substring(prompt.trim().length).trim();
            }
            return fullText;
        }

        console.error("Invalid response format from Hugging Face:", result);
        throw new Error("Invalid response format from Hugging Face API.");

    } catch (fallbackError) {
        console.error("Hugging Face fallback also failed:", fallbackError);
        return `The primary AI service failed, and the fallback service also encountered an error.`;
    }
};

export const summarizeMedicalHistory = async (patient: Patient): Promise<string> => {
  if (!ai || !API_KEY) {
     return "AI features are not available. Please configure the API key to enable AI-powered summaries.";
  }

  const recordsSummary = patient.records.map(record => `
    - Date: ${record.date}
    - Complaint: ${record.complaint}
    - Diagnosis: ${record.diagnosis}
    - Prescription: ${record.prescription}
    - Notes: ${record.notes}
  `).join('');

  const prompt = `
    **Task:**
    You are an AI assistant named HealthGemma. Your goal is to help users understand their family's health.
    Summarize the provided medical information into a single, concise, easy-to-read paragraph.
    Write in clear, simple language that a layperson can easily understand.

    **Instructions:**
    1.  Focus on chronic conditions, significant diagnoses, allergies, and recurring issues.
    2.  Synthesize information from the stated history and all visit records for a holistic overview.
    3.  Do not include speculative information or diagnoses not explicitly mentioned in the records.
    4.  The output must be a single paragraph.

    **Person's Stated Medical History:**
    ${patient.medicalHistory}

    **Person's Visit Records:**
    ${recordsSummary}

    **Summary Paragraph:**
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful AI assistant named HealthGemma, providing insights based on family health records to help users manage their family's well-being.",
        temperature: 0.3,
      }
    });
    return response.text;
  } catch (error) {
    if (isQuotaError(error)) {
        // Log as a warning, not an error, because it's a handled condition.
        console.warn("Gemini API quota limit reached for summary. This is a handled condition.");
        return `The AI summary feature has reached its daily limit. Please try again tomorrow.`;
    }
    
    // For other errors, log a warning and attempt the fallback.
    console.warn("Gemini API call failed for summary. Falling back to Hugging Face Medigemma.", error);
    return generateContentWithHuggingFace(prompt, 'summary');
  }
};


export const getMedicalInsight = async (record: MedicalRecord, patient: Patient, insightType: string): Promise<string> => {
  if (!ai || !API_KEY) {
     return "AI features are not available. Please configure the API key to enable AI-powered insights.";
  }

  const tasks: Record<string, string> = {
    general: `
      **Role:** You are an AI assistant named HealthGemma, helping a user understand a medical record.
      **Task:** Based on the person's history and the current record, provide helpful insights. Your tone should be cautious and empowering, encouraging the user to speak with their doctor.
      **Output Format:** A single, helpful paragraph.
      **Instructions:**
      1.  Focus on potential patterns, considerations for the prescribed treatment in the context of their history, or things to monitor.
      2.  Start your response with a phrase like: "Based on the record, here are a few points you might consider discussing with the doctor:"
      3.  **Crucially, do not provide medical advice.** Frame everything as suggestions for a conversation with a healthcare professional.
    `,
    interactions: `
      **Role:** You are an AI assistant specializing in pharmacology.
      **Task:** Analyze potential drug-drug and drug-condition interactions. Base your analysis on the person's medical history (for conditions), their list of current medications, and the new prescription from the current medical record.
      **Output Format:** A bulleted list.
      **Instructions:**
      1.  Prioritize clinically significant or common interactions.
      2.  For each identified potential interaction, use the exact format: "- **[Drug A] and [Drug B/Condition]:** [Clear, simple explanation of the potential interaction]."
      3.  Clearly distinguish between drug-drug interactions (a current medication interacting with a newly prescribed one) and drug-condition interactions (a newly prescribed drug interacting with a condition from the medical history).
      4.  If no significant interactions are apparent, you must state: "Based on the information provided, no common drug-drug or drug-condition interactions were noted. However, this is not a substitute for a professional review."
      5.  **Crucially, do not provide direct medical advice.** Your role is to highlight points for discussion with a healthcare provider.
      6.  Conclude with the mandatory disclaimer: "This information is provided by Google Gemini AI models and not a complete list of all possible interactions. Always consult with your doctor or pharmacist about all medications and health conditions before making any changes."
    `,
    monitoring: `
      **Role:** You are an AI assistant focused on patient care and education.
      **Task:** Suggest key things to monitor at home based on the diagnosis and prescription.
      **Output Format:** Two distinct sections with bullet points.
      **Instructions:**
      1.  Create a section titled "**Things to Monitor at Home:**" with a bulleted list of symptoms, side effects, or results to look out for.
      2.  Create a second section titled "**When to Contact a Doctor:**" with a bulleted list of 1-3 "red flag" signs that should prompt immediate medical contact.
      3.  **Crucially, do not provide medical advice.** Frame this as general information for awareness.
      4.  Conclude with the disclaimer: "This information is for general awareness and is not a substitute for professional medical advice. Always follow your doctor's instructions."
    `,
    questions: `
      **Role:** You are an AI assistant helping patients prepare for their doctor's appointments.
      **Task:** Generate a list of practical questions the user could ask their doctor about the current record.
      **Output Format:** A numbered list of 3 to 5 questions.
      **Instructions:**
      1.  The questions must relate directly to the diagnosis, treatment, and notes in the current record.
      2.  Questions should be open-ended to encourage a detailed response (e.g., start with "What...", "How...", "Could you explain...").
      3.  Avoid simple yes/no questions.
      4.  The goal is to help the user better understand their health plan.
    `,
  };

  const selectedTask = tasks[insightType] || tasks['general'];

  const currentMedicationsSummary = patient.currentMedications && patient.currentMedications.length > 0
      ? patient.currentMedications.map(med => `- ${med.name} (${med.strength || 'strength not specified'})`).join('\n')
      : 'None listed.';

  const prompt = `
    **Person's Stated Medical History & Allergies:**
    ${patient.medicalHistory}

    **Current Medications:**
    ${currentMedicationsSummary}

    **Current Medical Record Entry:**
    - Complaint: ${record.complaint}
    - Investigations: ${record.investigations}
    - Diagnosis: ${record.diagnosis}
    - Prescription: ${record.prescription}
    - Notes: ${record.notes}

    ---
    ${selectedTask}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful AI assistant named HealthGemma, providing insights based on family health records to help users manage their family's well-being. Your responses should be informative but must always emphasize that the user should consult with a healthcare professional and not treat your output as medical advice.",
        temperature: 0.5,
      }
    });
    return response.text;
  } catch (error) {
    if (isQuotaError(error)) {
        // Log as a warning, not an error, because it's a handled condition.
        console.warn(`Gemini API quota limit reached for ${insightType} insight. This is a handled condition.`);
        return `The AI insight feature has reached its daily limit. Please try again tomorrow.`;
    }
    
    // For other errors, log a warning and attempt the fallback.
    console.warn(`Gemini API call failed for ${insightType} insight. Falling back to Hugging Face Medigemma.`, error);
    return generateContentWithHuggingFace(prompt, 'insight');
  }
};
