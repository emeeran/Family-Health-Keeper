import { lazy, ComponentType } from 'react';

export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  return lazy(importFunc);
};

// Pre-defined lazy components for better code splitting
export const LazyAIAssistant = createLazyComponent(() => import('../components/AIAssistant'));
export const LazyDashboard = createLazyComponent(() => import('../components/Dashboard'));
export const LazySecurityDashboard = createLazyComponent(() => import('../components/SecurityDashboard'));
export const LazyEHRDashboard = createLazyComponent(() => import('../src/components/ehr/EHRDashboard'));
export const LazyAppointmentManager = createLazyComponent(() => import('../src/components/AppointmentManager'));

// Service lazy loading for heavy dependencies
export const loadGeminiService = () => import('../services/geminiService');
export const loadPDFService = () => import('../services/pdfService');

export const preloadComponent = (componentLoader: () => Promise<{ default: any }>) => {
  componentLoader();
};