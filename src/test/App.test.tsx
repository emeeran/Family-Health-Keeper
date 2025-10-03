import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { databaseService } from '../../services/databaseService';
import { secureStorage } from '../../services/secureStorageService';
import type { Patient, Doctor } from '../../types';

// Mock services
vi.mock('../../services/databaseService');
vi.mock('../../services/secureStorageService');
vi.mock('../../services/geminiService', () => ({
  summarizeMedicalHistory: vi.fn().mockResolvedValue('Test summary'),
  getMedicalInsight: vi.fn().mockResolvedValue('Test insight')
}));

const mockDatabaseService = vi.mocked(databaseService);
const mockSecureStorage = vi.mocked(secureStorage);

// Mock components with lazy loading
vi.mock('../../components/PatientDetails', () => ({
  default: ({ selectedPatient, onClose }: any) => (
    <div data-testid="patient-details">
      <h2>{selectedPatient?.name}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

vi.mock('../../components/DoctorModal', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="doctor-modal">
      <h2>Doctor Modal</h2>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

vi.mock('../../components/PatientEditModal', () => ({
  default: ({ onClose }: any) => (
    <div data-testid="patient-edit-modal">
      <h2>Patient Edit Modal</h2>
      <button onClick={onClose}>Close</button>
    </div>
  )
}));

vi.mock('../../components/AIAssistant', () => ({
  default: ({ selectedPatient }: any) => (
    <div data-testid="ai-assistant">
      <h3>AI Assistant for {selectedPatient?.name}</h3>
    </div>
  )
}));

vi.mock('../../components/SecurityDashboard', () => ({
  default: () => (
    <div data-testid="security-dashboard">
      <h2>Security Dashboard</h2>
    </div>
  )
}));

// Mock Material Icons
const mockMaterialIcons = ['add', 'search', 'person', 'security', 'close'];

// Setup Material Icons
const setupMaterialIcons = () => {
  const span = document.createElement('span');
  span.className = 'material-symbols-outlined';
  span.innerHTML = mockMaterialIcons.join(' ');
  document.head.appendChild(span);

  // Mock the getComputedStyle to return the icon names
  Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
      getPropertyValue: vi.fn().mockReturnValue('add')
    })
  });
};

describe('App Component', () => {
  const mockPatients: Patient[] = [
    {
      id: 'patient-1',
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      bloodGroup: 'A+',
      contactNumber: '1234567890',
      email: 'john@example.com',
      address: '123 Test St',
      medicalHistory: 'No significant history',
      allergies: ['Peanuts'],
      records: [],
      reminders: [],
      currentMedications: []
    },
    {
      id: 'patient-2',
      name: 'Jane Doe',
      dateOfBirth: '1992-02-02',
      gender: 'Female',
      bloodGroup: 'B+',
      contactNumber: '0987654321',
      email: 'jane@example.com',
      address: '456 Test Ave',
      medicalHistory: 'Asthma',
      allergies: ['Dust'],
      records: [],
      reminders: [],
      currentMedications: []
    }
  ];

  const mockDoctors: Doctor[] = [
    {
      id: 'doctor-1',
      name: 'Dr. Smith',
      specialty: 'Cardiology',
      contactNumber: '1112223333',
      email: 'smith@hospital.com',
      address: '123 Medical Center'
    }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    setupMaterialIcons();

    // Mock database service
    mockDatabaseService.init.mockResolvedValue();
    mockDatabaseService.getAllPatients.mockResolvedValue(mockPatients);
    mockDatabaseService.getAllDoctors.mockResolvedValue(mockDoctors);
    mockDatabaseService.savePatient.mockResolvedValue();
    mockDatabaseService.saveDoctor.mockResolvedValue();
    mockDatabaseService.deletePatient.mockResolvedValue();

    // Mock secure storage
    mockSecureStorage.getSessionInfo.mockReturnValue({
      id: 'session-1',
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true
    });
    mockSecureStorage.getSecurityStatus.mockReturnValue({
      isActiveSession: true,
      lockoutStatus: false,
      failedAttempts: 0,
      encryptionEnabled: true,
      lastActivity: new Date()
    });
    mockSecureStorage.savePatients.mockResolvedValue();
    mockSecureStorage.saveDoctors.mockResolvedValue();
    mockSecureStorage.validateDataIntegrity.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderApp = () => {
    return render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
  };

  it('should render the application header', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Family Health Keeper')).toBeInTheDocument();
    });
  });

  it('should load and display patients', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    expect(mockDatabaseService.getAllPatients).toHaveBeenCalledTimes(1);
  });

  it('should load and display doctors', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    expect(mockDatabaseService.getAllDoctors).toHaveBeenCalledTimes(1);
  });

  it('should select patient when clicked', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getByTestId('patient-details')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('should open doctor modal when doctor button clicked', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });

    // Click on doctor name
    fireEvent.click(screen.getByText('Dr. Smith'));

    await waitFor(() => {
      expect(screen.getByTestId('doctor-modal')).toBeInTheDocument();
    });
  });

  it('should open new patient form when add button clicked', async () => {
    renderApp();

    // Look for add button (material-symbols-outlined add)
    const addButton = screen.getByText('add', { selector: '.material-symbols-outlined' });
    expect(addButton).toBeInTheDocument();

    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('patient-edit-modal')).toBeInTheDocument();
    });
  });

  it('should show AI assistant when patient is selected', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getByTestId('ai-assistant')).toBeInTheDocument();
      expect(screen.getByText('AI Assistant for John Doe')).toBeInTheDocument();
    });
  });

  it('should handle patient search', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    // Find search input
    const searchInput = screen.getByPlaceholderText('Search patients...');
    expect(searchInput).toBeInTheDocument();

    // Type search query
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // Should show John Doe but not Jane Doe
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    });
  });

  it('should handle patient deletion', async () => {
    const mockShowDeleteConfirmation = vi.fn();

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select patient first
    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(screen.getByTestId('patient-details')).toBeInTheDocument();
    });

    // Find and click delete button (material-symbols-outlined with appropriate text)
    const deleteButtons = screen.getAllByTestId('delete-button');
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
    }
  });

  it('should initialize database on mount', async () => {
    renderApp();

    await waitFor(() => {
      expect(mockDatabaseService.init).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle security dashboard access', async () => {
    renderApp();

    // Look for security button
    const securityButton = screen.getByText('security', { selector: '.material-symbols-outlined' });
    expect(securityButton).toBeInTheDocument();

    fireEvent.click(securityButton);

    await waitFor(() => {
      expect(screen.getByTestId('security-dashboard')).toBeInTheDocument();
    });
  });

  it('should handle empty patient list', async () => {
    mockDatabaseService.getAllPatients.mockResolvedValue([]);

    renderApp();

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    });

    // Should show empty state message
    expect(screen.getByText('No patients found')).toBeInTheDocument();
  });

  it('should handle empty doctor list', async () => {
    mockDatabaseService.getAllDoctors.mockResolvedValue([]);

    renderApp();

    await waitFor(() => {
      expect(screen.queryByText('Dr. Smith')).not.toBeInTheDocument();
    });
  });

  it('should handle database errors gracefully', async () => {
    mockDatabaseService.getAllPatients.mockRejectedValue(new Error('Database error'));

    // Mock alert
    const mockAlert = vi.fn();
    window.alert = mockAlert;

    renderApp();

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Failed to load patients: Error: Database error'
      );
    });
  });

  it('should handle secure storage errors gracefully', async () => {
    mockSecureStorage.savePatients.mockRejectedValue(new Error('Storage error'));

    const mockAlert = vi.fn();
    window.alert = mockAlert;

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select patient to trigger save operation
    fireEvent.click(screen.getByText('John Doe'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save patients')
      );
    });
  });

  it('should apply performance optimizations', async () => {
    const startTime = performance.now();

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (less than 1 second)
    expect(renderTime).toBeLessThan(1000);
  });
});