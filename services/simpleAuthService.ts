import type { User } from '../types';

export interface SimpleUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface SimpleAuthState {
  user: SimpleUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class SimpleAuthService {
  private static instance: SimpleAuthService;
  private authState: SimpleAuthState;
  private listeners: Array<(state: SimpleAuthState) => void> = [];

  private constructor() {
    this.authState = {
      user: null,
      isAuthenticated: false,
      isLoading: false
    };

    // Initialize from localStorage
    this.loadFromStorage();
  }

  static getInstance(): SimpleAuthService {
    if (!SimpleAuthService.instance) {
      SimpleAuthService.instance = new SimpleAuthService();
    }
    return SimpleAuthService.instance;
  }

  // Subscribe to auth state changes
  subscribe(listener: (state: SimpleAuthState) => void): () => void {
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

  private updateAuthState(updates: Partial<SimpleAuthState>): void {
    this.authState = { ...this.authState, ...updates };
    this.notifyListeners();
    this.saveToStorage();
  }

  private saveToStorage(): void {
    if (this.authState.user) {
      localStorage.setItem('simple_auth_user', JSON.stringify(this.authState.user));
      localStorage.setItem('simple_auth_authenticated', 'true');
    } else {
      localStorage.removeItem('simple_auth_user');
      localStorage.removeItem('simple_auth_authenticated');
    }
  }

  private loadFromStorage(): void {
    try {
      const storedUser = localStorage.getItem('simple_auth_user');
      const isAuthenticated = localStorage.getItem('simple_auth_authenticated') === 'true';

      // Only load from storage if explicitly requested (not on initialization)
      // This prevents auto-login behavior
      if (true && storedUser && isAuthenticated) { // Set to true to enable auto-login for better UX
        const user: SimpleUser = JSON.parse(storedUser);
        this.authState.user = user;
        this.authState.isAuthenticated = true;
      }
    } catch (error) {
      console.error('Failed to load auth from storage:', error);
      this.clearStorage();
    }
  }

  private clearStorage(): void {
    localStorage.removeItem('simple_auth_user');
    localStorage.removeItem('simple_auth_authenticated');
  }

  getAuthState(): SimpleAuthState {
    return { ...this.authState };
  }

  // Simple login with email and password
  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    this.updateAuthState({ isLoading: true });

    try {
      // Simple validation for demo admin user
      if (email === 'emeeranjp@gmail.com' && password === 'Jeny13y@fhk') {
        const user: SimpleUser = {
          id: 'admin_001',
          email: 'emeeranjp@gmail.com',
          name: 'Admin User',
          role: 'admin'
        };

        this.updateAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });

        return { success: true, message: 'Login successful' };
      }

      // Simple validation for demo regular user
      if (email === 'user@familyhealth.com' && password === 'password123') {
        const user: SimpleUser = {
          id: 'user_001',
          email: 'user@familyhealth.com',
          name: 'Demo User',
          role: 'user'
        };

        this.updateAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });

        return { success: true, message: 'Login successful' };
      }

      // For any other email, accept any 6+ character password (simple registration simulation)
      if (email.includes('@') && password.length >= 6) {
        const user: SimpleUser = {
          id: `user_${Date.now()}`,
          email: email,
          name: email.split('@')[0],
          role: 'user'
        };

        this.updateAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });

        return { success: true, message: 'Login successful' };
      }

      this.updateAuthState({ isLoading: false });
      return { success: false, message: 'Invalid email or password' };

    } catch (error) {
      this.updateAuthState({ isLoading: false });
      return { success: false, message: 'Login failed' };
    }
  }

  // Simple logout
  async logout(): Promise<void> {
    this.updateAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  // Get current user
  getCurrentUser(): SimpleUser | null {
    return this.authState.user;
  }

  // Get user role
  getUserRole(): string | null {
    return this.authState.user?.role || null;
  }

  // Check if admin
  isAdmin(): boolean {
    return this.authState.user?.role === 'admin';
  }
}

export const simpleAuthService = SimpleAuthService.getInstance();