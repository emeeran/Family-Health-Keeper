import type { MedicalRecord, Patient } from '../types';

// Security Note: This service should be moved to a backend server
// For now, we'll create a wrapper that prepares for server migration
class SecureAIService {
  private static instance: SecureAIService;
  private apiKey: string | null = null;

  private constructor() {
    // API key should only be available server-side
    // This is a temporary placeholder for development
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!this.apiKey && import.meta.env.DEV) {
      console.warn('Gemini API key not configured. AI features will be disabled.');
    }
  }

  static getInstance(): SecureAIService {
    if (!SecureAIService.instance) {
      SecureAIService.instance = new SecureAIService();
    }
    return SecureAIService.instance;
  }

  async isAvailable(): Promise<boolean> {
    // Check if API key is available (would be server-side validation)
    return !!this.apiKey && import.meta.env.DEV;
  }

  async summarizeMedicalHistory(records: MedicalRecord[]): Promise<string> {
    // This should make a server-side API call
    // For now, return a placeholder
    if (!await this.isAvailable()) {
      return "AI summary unavailable - API key not configured";
    }

    // TODO: Implement secure server-side API call
    return "Medical history summary will be available when backend is implemented.";
  }

  async generateHealthInsights(patient: Patient): Promise<string> {
    if (!await this.isAvailable()) {
      return "Health insights unavailable - API key not configured";
    }

    // TODO: Implement secure server-side API call
    return "Health insights will be available when backend is implemented.";
  }
}

export const secureAIService = SecureAIService.getInstance();