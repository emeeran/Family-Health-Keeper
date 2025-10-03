import type { User, AuthSession, LoginCredentials, RegisterData } from '../types';
import { apiService } from './apiService';

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthResponse {
  user: User;
  session: AuthSession;
  success: boolean;
  message?: string;
}

class SimpleApiAuthService {
  private static instance: SimpleApiAuthService;
  private authState: AuthState;
  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    this.authState = {
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    };

    // Initialize auth state from token
    this.initializeAuthFromToken();
  }

  static getInstance(): SimpleApiAuthService {
    if (!SimpleApiAuthService.instance) {
      SimpleApiAuthService.instance = new SimpleApiAuthService();
    }
    return SimpleApiAuthService.instance;
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getAuthState());

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getAuthState()));
  }

  private updateAuthState(updates: Partial<AuthState>): void {
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
  }

  private async initializeAuthFromToken(): Promise<void> {
    if (apiService.isAuthenticated()) {
      try {
        this.updateAuthState({ isLoading: true });
        const response = await apiService.getCurrentUser();

        if (response.success) {
          const user = response.data;
          const session: AuthSession = {
            id: 'current-session',
            userId: user.id,
            token: apiService.getToken()!,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            createdAt: user.created_at,
            deviceId: 'web',
            deviceInfo: navigator.userAgent,
            isActive: true
          };

          this.updateAuthState({
            user,
            session,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          this.clearAuth();
        }
      } catch (error) {
        console.error('Failed to initialize auth from token:', error);
        this.clearAuth();
      }
    }
  }

  private async clearAuth(): Promise<void> {
    apiService.clearToken();
    this.updateAuthState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    this.updateAuthState({ isLoading: true, error: null });

    try {
      const response = await apiService.login({
        email: credentials.email,
        password: credentials.password,
        rememberMe: credentials.rememberMe
      });

      if (response.success && response.user && response.token) {
        const user = response.user;
        const session: AuthSession = {
          id: 'api-session',
          userId: user.id,
          token: response.token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          deviceId: 'web',
          deviceInfo: navigator.userAgent,
          isActive: true
        };

        this.updateAuthState({
          user,
          session,
          isAuthenticated: true,
          isLoading: false
        });

        return {
          user,
          session,
          success: true,
          message: response.message || 'Login successful'
        };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      this.updateAuthState({
        isLoading: false,
        error: errorMessage
      });

      return {
        user: null as any,
        session: null as any,
        success: false,
        message: errorMessage
      };
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    this.updateAuthState({ isLoading: true, error: null });

    try {
      const response = await apiService.register({
        email: userData.email,
        username: userData.username,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role
      });

      if (response.success && response.user && response.token) {
        const user = response.user;
        const session: AuthSession = {
          id: 'api-session',
          userId: user.id,
          token: response.token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          deviceId: 'web',
          deviceInfo: navigator.userAgent,
          isActive: true
        };

        this.updateAuthState({
          user,
          session,
          isAuthenticated: true,
          isLoading: false
        });

        return {
          user,
          session,
          success: true,
          message: response.message || 'Registration successful'
        };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      this.updateAuthState({
        isLoading: false,
        error: errorMessage
      });

      return {
        user: null as any,
        session: null as any,
        success: false,
        message: errorMessage
      };
    }
  }

  async logout(): Promise<void> {
    this.updateAuthState({ isLoading: true });

    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearAuth();
    }
  }

  async refreshSession(): Promise<boolean> {
    if (!this.authState.isAuthenticated || !apiService.isAuthenticated()) {
      return false;
    }

    try {
      const response = await apiService.getCurrentUser();
      if (response.success) {
        this.updateAuthState({
          user: response.data,
          isAuthenticated: true
        });
        return true;
      } else {
        await this.clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      await this.clearAuth();
      return false;
    }
  }

  // Initialize with demo user for testing
  async initializeDemoUser(): Promise<void> {
    // In API-based system, demo users should be created via the API
    // This is handled by the database seeding in the backend
    console.log('Demo user initialization handled by backend database seeding');
  }
}

export const simpleApiAuthService = SimpleApiAuthService.getInstance();