import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const init = () => {
      const storedUser = localStorage.getItem('current_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('current_user');
        }
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Calling backend login API...');
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 AuthContext: Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AuthContext: Login failed:', errorData);
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      console.log('AuthContext: Login successful:', data);
      
      // Convert your backend user format to frontend User type
      const frontendUser: User = {
        id: data.user.Username,
        email: data.user.useremail[0]?.Email || email,
        fullName: `${data.user.First_name} ${data.user.Last_name}`,
        phone: data.user.userphone[0]?.Mobile_no || '',
        isAdmin: false,
      };

      // Store in localStorage for persistence
      localStorage.setItem('current_user', JSON.stringify(frontendUser));
      setUser(frontendUser);

    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

const register = async (email: string, password: string, fullName: string, phone?: string) => {
  try {
    console.log('AuthContext: Calling backend register API...');
    
    // Split fullName into first and last name
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || 'Unknown';
    
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        phone,
      }),
    });

    console.log('AuthContext: Register response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AuthContext: Registration failed:', errorData);
      throw new Error(errorData.error || 'Registration failed');
    }

    const data = await response.json();
    console.log('AuthContext: Registration successful:', data);
    
    // Auto-login after registration
    const frontendUser: User = {
      id: data.user.Username,
      email: data.user.useremail[0]?.Email || email,
      fullName: `${data.user.First_name} ${data.user.Last_name}`,
      phone: data.user.userphone[0]?.Mobile_no || phone || '',
      isAdmin: false,
    };

    localStorage.setItem('current_user', JSON.stringify(frontendUser));
    setUser(frontendUser);

  } catch (error) {
    console.error('AuthContext: Registration error:', error);
    throw error;
  }
};

  const logout = () => {
    localStorage.removeItem('current_user');
    setUser(null);
  };

  // TODO: Implement these with backend API when ready
  const updateProfile = async (updates: Partial<User>) => {
    throw new Error('Update profile not implemented yet');
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    throw new Error('Change password not implemented yet');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};