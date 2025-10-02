import type { User, AuthSession, LoginCredentials, RegisterData } from '../types';

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

class AuthService {
  private static instance: AuthService;
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

    // Initialize auth state from localStorage on app load
    this.initializeAuthFromStorage();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
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

    // Persist to localStorage if user is authenticated
    if (updates.user || updates.session) {
      this.persistAuthToStorage();
    }
  }

  private async persistAuthToStorage(): Promise<void> {
    if (this.authState.user && this.authState.session) {
      try {
        localStorage.setItem('auth_user', JSON.stringify(this.authState.user));
        localStorage.setItem('auth_session', JSON.stringify(this.authState.session));
        localStorage.setItem('is_authenticated', 'true');
      } catch (error) {
        console.error('Failed to persist auth state:', error);
      }
    }
  }

  private async initializeAuthFromStorage(): Promise<void> {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const storedSession = localStorage.getItem('auth_session');
      const isAuthenticated = localStorage.getItem('is_authenticated') === 'true';

      if (storedUser && storedSession && isAuthenticated) {
        const user: User = JSON.parse(storedUser);
        const session: AuthSession = JSON.parse(storedSession);

        // Check if session is still valid (not expired)
        if (new Date(session.expiresAt) > new Date()) {
          this.updateAuthState({
            user,
            session,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          // Session expired, clear auth
          await this.clearAuth();
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth from storage:', error);
      await this.clearAuth();
    }
  }

  private async clearAuth(): Promise<void> {
    try {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_session');
      localStorage.removeItem('is_authenticated');
    } catch (error) {
      console.error('Failed to clear auth storage:', error);
    }

    this.updateAuthState({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  }

  private generateToken(): string {
    // Simple token generation - in production, use proper JWT
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private async hashPassword(password: string): Promise<string> {
    // Simple password hashing using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'family_health_keeper_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    const hashedInput = await this.hashPassword(password);
    return hashedInput === hashedPassword;
  }

  getAuthState(): AuthState {
    return { ...this.authState };
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    this.updateAuthState({ isLoading: true, error: null });

    try {
      // Get users from IndexedDB
      const { databaseService } = await import('./databaseService');
      const users = await this.getAllUsers(databaseService);

      // Find user by email
      const user = users.find(u => u.email === credentials.email && u.isActive);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // For demo purposes, we'll use a simple password validation
      // In production, you'd validate against the hashed password

      // Check if it's the admin user
      if (user.email === 'emeeranjp@gmail.com') {
        if (credentials.password !== 'Jeny13y@fhk') {
          throw new Error('Invalid email or password');
        }
      } else {
        // For newly registered users, we'll accept any password for demo
        // In production, you'd validate against the stored hash
        if (credentials.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
      }

      // Create session
      const session: AuthSession = {
        id: `session_${Date.now()}`,
        userId: user.id,
        token: this.generateToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        createdAt: new Date().toISOString(),
        deviceId: 'web',
        deviceInfo: navigator.userAgent,
        isActive: true
      };

      // Update user's last login
      const updatedUser: User = {
        ...user,
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save updated user and session
      await this.saveUser(databaseService, updatedUser);
      await this.saveSession(databaseService, session);

      this.updateAuthState({
        user: updatedUser,
        session,
        isAuthenticated: true,
        isLoading: false
      });

      return {
        user: updatedUser,
        session,
        success: true,
        message: 'Login successful'
      };

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
      // Validate passwords match
      if (userData.password !== userData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Invalid email format');
      }

      const { databaseService } = await import('./databaseService');

      // Check if user already exists
      const existingUsers = await this.getAllUsers(databaseService);
      const existingUser = existingUsers.find(u => u.email === userData.email || u.username === userData.username);

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Create new user
      const newUser: User = {
        id: `user_${Date.now()}`,
        email: userData.email,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'user',
        avatarUrl: `https://picsum.photos/seed/${userData.username}/200/200`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        profileCompleted: false
      };

      // Save user to database
      await this.saveUser(databaseService, newUser);

      // Save the password for demo purposes - in production you'd hash it
      const userDataWithPassword = {
        ...userData,
        plainPassword: userData.password // Store plain text for demo only
      };

      // Auto-login after registration using the provided password
      const loginResult = await this.login({
        email: userData.email,
        password: userData.password,
        rememberMe: false
      });

      return {
        ...loginResult,
        message: 'Registration and login successful'
      };

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
      if (this.authState.session) {
        const { databaseService } = await import('./databaseService');

        // Deactivate session in database
        const updatedSession: AuthSession = {
          ...this.authState.session,
          isActive: false
        };
        await this.saveSession(databaseService, updatedSession);
      }

      await this.clearAuth();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local auth state
      await this.clearAuth();
    }
  }

  async refreshSession(): Promise<boolean> {
    if (!this.authState.session || !this.authState.isAuthenticated) {
      return false;
    }

    try {
      // Check if session is still valid
      if (new Date(this.authState.session.expiresAt) > new Date()) {
        return true;
      }

      // Session expired, try to refresh
      const { databaseService } = await import('./databaseService');

      const newSession: AuthSession = {
        id: `session_${Date.now()}`,
        userId: this.authState.user!.id,
        token: this.generateToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        deviceId: 'web',
        deviceInfo: navigator.userAgent,
        isActive: true
      };

      await this.saveSession(databaseService, newSession);

      this.updateAuthState({
        session: newSession
      });

      return true;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      await this.logout();
      return false;
    }
  }

  // Database helper methods for users and sessions
  private async getAllUsers(databaseService: any): Promise<User[]> {
    try {
      // Ensure database is initialized
      await databaseService.init();
      return await databaseService.getAllUsers();
    } catch (error) {
      // If users store doesn't exist yet, return empty array
      console.error('Error getting users:', error);
      return [];
    }
  }

  private async saveUser(databaseService: any, user: User): Promise<void> {
    await databaseService.init();
    await databaseService.saveUser(user);
  }

  private async saveSession(databaseService: any, session: AuthSession): Promise<void> {
    await databaseService.init();
    await databaseService.saveSession(session);
  }

  // Clear existing users and create new admin user
  async resetAdminUser(): Promise<void> {
    try {
      const { databaseService } = await import('./databaseService');
      await databaseService.init();

      // Clear localStorage authentication data
      await this.clearAuth();

      // Clear all existing users
      const users = await this.getAllUsers(databaseService);
      for (const user of users) {
        await databaseService.deleteUser(user.id);
      }

      // Clear all existing sessions
      const sessions = await databaseService.getAllSessions();
      for (const session of sessions) {
        await databaseService.deleteSession(session.id);
      }

      console.log('Cleared existing users and sessions');

      // Create new admin user
      const adminUser: User = {
        id: 'user_admin_001',
        email: 'emeeranjp@gmail.com',
        username: 'emeeranjp',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        avatarUrl: 'https://picsum.photos/seed/emeeranjp/200/200',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        profileCompleted: true
      };

      console.log('Creating new admin user...');
      await this.saveUser(databaseService, adminUser);
      console.log('Admin user created successfully');
    } catch (error) {
      console.error('Failed to reset admin user:', error);
    }
  }

  // Initialize with demo user for testing
  async initializeDemoUser(): Promise<void> {
    try {
      const { databaseService } = await import('./databaseService');
      await databaseService.init();
      const users = await this.getAllUsers(databaseService);

      if (users.length === 0) {
        // Create admin user
        const adminUser: User = {
          id: 'user_admin_001',
          email: 'emeeranjp@gmail.com',
          username: 'emeeranjp',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          avatarUrl: 'https://picsum.photos/seed/emeeranjp/200/200',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          profileCompleted: true
        };

        console.log('Creating admin user...');
        await this.saveUser(databaseService, adminUser);
        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }
    } catch (error) {
      console.error('Failed to initialize admin user:', error);
    }
  }
}

export const authService = AuthService.getInstance();