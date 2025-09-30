import React from 'react';
import type { Patient } from '../types';

interface HeaderProps {
    selectedPatient: Patient | null;
    theme: string;
    onToggleTheme: () => void;
    onMobileMenuToggle?: () => void;
    showMobileMenuButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({
    selectedPatient,
    theme,
    onToggleTheme,
    onMobileMenuToggle,
    showMobileMenuButton = false,
}) => {
    const patientName = selectedPatient?.name || 'No Person Selected';
    const patientInitial = selectedPatient?.name?.charAt(0).toUpperCase() || '?';

    return (
        <header className="bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-lg border-b border-border-light/50 dark:border-border-dark/50 p-6 flex items-center justify-between sticky top-0 z-10 gap-4 shrink-0 shadow-sm">
            {/* Left Section: Patient Info */}
            <div className="flex items-center gap-4 flex-1">
                {showMobileMenuButton && (
                    <button
                        onClick={onMobileMenuToggle}
                        className="btn-ghost p-3 rounded-xl hover-lift lg:hidden"
                        title="Toggle Menu"
                        aria-label="Toggle navigation menu"
                    >
                        <span className="material-symbols-outlined text-lg">menu</span>
                    </button>
                )}
                {selectedPatient && (
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                            {patientInitial}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-surface-light dark:border-surface-dark"></div>
                    </div>
                )}
                <div className="flex flex-col min-w-0 flex-1">
                    <h1 className="text-xl lg:text-2xl font-bold text-text-light dark:text-text-dark truncate tracking-tight">
                        {selectedPatient ? patientName : 'Welcome to Family Health Keeper'}
                    </h1>
                    <p className="text-sm text-subtle-light dark:text-subtle-dark truncate">
                        {selectedPatient ? 'Medical Record Dashboard' : 'Select a person to view their health records'}
                    </p>
                </div>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-2">
                {selectedPatient && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <span className="material-symbols-outlined text-primary-600 dark:text-primary-400 text-sm">medical_information</span>
                        <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
                            {selectedPatient.records.length} Record{selectedPatient.records.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}

                <button
                    onClick={onToggleTheme}
                    className="btn-ghost p-3 rounded-xl hover-lift"
                    title="Toggle Theme"
                    aria-label="Toggle between light and dark theme"
                >
                    <span className="material-symbols-outlined text-lg">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                </button>
            </div>
        </header>
    );
};

export default Header;