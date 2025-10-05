import React from 'react';
import type { Patient, User, Doctor } from '../types';

interface HeaderProps {
    selectedPatient: Patient | null;
    theme: string;
    onToggleTheme: () => void;
    onMobileMenuToggle?: () => void;
    showMobileMenuButton?: boolean;
    user?: User | null;
    onLogin?: () => void;
    onLogout?: () => void;
    selectedDoctor?: Doctor | null;
    onBackup?: () => void;
    onRestore?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    selectedPatient,
    theme,
    onToggleTheme,
    onMobileMenuToggle,
    showMobileMenuButton = false,
    user,
    onLogin,
    onLogout,
    selectedDoctor,
    onBackup,
    onRestore,
}) => {
    const patientName = selectedPatient?.name || 'No Person Selected';
    const patientInitial = selectedPatient?.name?.charAt(0).toUpperCase() || '?';
    const userFirstName = user?.firstName || '';
    const userLastName = user?.lastName || '';
    const userName = userFirstName && userLastName ? `${userFirstName} ${userLastName}` : userFirstName || userLastName || 'User';
    const userInitial = userFirstName ? userFirstName.charAt(0).toUpperCase() : 'U';

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
                    {selectedDoctor && (
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-xs">stethoscope</span>
                            </div>
                            <span className="text-xs text-success-700 dark:text-success-300 font-medium">
                                Dr. {selectedDoctor.name} - {selectedDoctor.specialty}
                            </span>
                        </div>
                    )}
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

                {/* User Authentication Section */}
                {user ? (
                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-success-50 dark:bg-success-900/20 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">{userInitial}</span>
                            </div>
                            <span className="text-sm text-success-700 dark:text-success-300 font-medium">
                                {userName}
                            </span>
                        </div>
                        
                        {/* Backup Button */}
                        {onBackup && (
                            <button
                                onClick={onBackup}
                                className="btn-ghost p-3 rounded-xl hover-lift text-blue-600 dark:text-blue-400"
                                title="Create Backup"
                                aria-label="Create and download data backup"
                            >
                                <span className="material-symbols-outlined text-lg">backup</span>
                            </button>
                        )}
                        
                        {/* Restore Button */}
                        {onRestore && (
                            <button
                                onClick={onRestore}
                                className="btn-ghost p-3 rounded-xl hover-lift text-green-600 dark:text-green-400"
                                title="Restore Backup"
                                aria-label="Restore data from backup"
                            >
                                <span className="material-symbols-outlined text-lg">restore</span>
                            </button>
                        )}
                        
                        {/* Logout Button */}
                        <button
                            onClick={onLogout}
                            className="btn-ghost p-3 rounded-xl hover-lift text-red-600 dark:text-red-400"
                            title="Logout"
                            aria-label="Logout from your account"
                        >
                            <span className="material-symbols-outlined text-lg">logout</span>
                        </button>
                    </div>
                ) : onLogin && (
                    <button
                        onClick={onLogin}
                        className="btn-primary px-4 py-2 rounded-xl hover-lift text-sm"
                        title="Login"
                        aria-label="Login to your account"
                    >
                        <span className="material-symbols-outlined text-sm mr-1">login</span>
                        Login
                    </button>
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