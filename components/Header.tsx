import React from 'react';
import type { Patient } from '../types';

interface HeaderProps {
    selectedPatient: Patient | null;
}

const Header: React.FC<HeaderProps> = ({
    selectedPatient,
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
        </header>
    );
};

export default Header;