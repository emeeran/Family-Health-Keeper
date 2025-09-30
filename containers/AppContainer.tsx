import React, { useEffect } from 'react';
import Header from '../components/Header';
import SidebarContainer from './SidebarContainer';
import PatientContainer from './PatientContainer';
import ModalContainer from './ModalContainer';
import { useUIStore } from '../stores/features/uiStore';
import { useSecureHealthStore } from '../stores/useSecureHealthStore';
import type { Patient, MedicalRecord } from '../types';

const AppContainer: React.FC = () => {
  const {
    theme,
    setTheme,
    initializeData
  } = useUIStore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    initializeData();
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="h-screen flex text-text-light dark:text-text-dark overflow-hidden">
      <SidebarContainer />
      <div className="flex-1 flex flex-col overflow-hidden bg-background-light dark:bg-background-dark">
        <Header theme={theme} onToggleTheme={toggleTheme} />
        <PatientContainer />
      </div>
      <ModalContainer />
    </div>
  );
};

export default AppContainer;