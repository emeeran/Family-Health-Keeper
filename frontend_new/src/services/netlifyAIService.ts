/**
 * Netlify Functions AI Service
 * Uses Netlify Functions to securely call AI APIs without exposing keys
 */

interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const netlifyAIService = {
  /**
   * Generate health insights via Netlify Function
   */
  async generateHealthInsights(patientData: any): Promise<AIResponse> {
    try {
      const response = await fetch('/.netlify/functions/generate-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Netlify AI service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Summarize medical history via Netlify Function
   */
  async summarizeMedicalHistory(medicalData: any): Promise<AIResponse> {
    try {
      const response = await fetch('/.netlify/functions/summarize-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ medicalData }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Netlify AI service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
};