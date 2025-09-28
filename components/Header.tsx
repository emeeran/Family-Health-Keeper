import React from 'react';
import type { Patient } from '../types';

interface HeaderProps {
    selectedPatient: Patient | null;
    theme: string;
    onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({
    selectedPatient,
    theme,
    onToggleTheme,
}) => {
    const patientName = selectedPatient?.name || 'No Person Selected';

    return (
        <header className="bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark p-4 flex items-center justify-between sticky top-0 z-10 gap-4 shrink-0">
            {/* Left Section: Patient Name */}
            <div className="flex-1 flex items-center gap-4">
                 <h2 className="text-2xl font-bold text-text-light dark:text-text-dark whitespace-nowrap">
                    {selectedPatient ? `${patientName}'s Record` : patientName}
                 </h2>
            </div>
            {/* Right Section: Actions */}
            <div className="flex items-center gap-4">
                <button onClick={onToggleTheme} className="p-2 text-subtle-light dark:text-subtle-dark rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Toggle Theme" aria-label="Toggle between light and dark theme">
                    <span className="material-symbols-outlined text-base">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                </button>
            </div>
        </header>
    );
};

export default Header;