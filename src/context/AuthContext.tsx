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

// Context
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

  // LOGIN
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      const frontendUser: User = {
        id: data.user.Username,
        username: data.user.Username,
        email: data.user.useremail[0]?.Email || email,
        fullName: `${data.user.First_name} ${data.user.Last_name}`,
        phone: data.user.userphone[0]?.Mobile_no || '',
        isAdmin: false,
      };

      localStorage.setItem('current_user', JSON.stringify(frontendUser));
      setUser(frontendUser);
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  // REGISTER
  const register = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      // Split fullName into first and last name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || 'Unknown';

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName, phone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      const frontendUser: User = {
        id: data.user.Username,
        username: data.user.Username,
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

  // LOGOUT
  const logout = () => {
    localStorage.removeItem('current_user');
    setUser(null);
  };

  // UPDATE PROFILE
const updateProfile = async (updates: Partial<User>) => {
  if (!user) throw new Error('Not logged in');
  try {
    const response = await fetch('/api/profile', {   // Changed endpoint from /api/update-profile to /api/profile
      method: 'PUT',                                // Confirm method is PUT!
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        username: user.username,
        ...updates,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    const data = await response.json();
    const updatedUser: User = {
      ...user,
      ...updates,
      id: data.user?.Username || user.id,
      username: data.user?.Username || user.username,
      email: data.user?.useremail?.[0]?.Email || user.email,
      fullName: data.user ? `${data.user.First_name} ${data.user.Last_name}` : user.fullName,
      phone: data.user?.userphone?.[0]?.Mobile_no || user.phone,
    };

    localStorage.setItem('current_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  } catch (error) {
    console.error('AuthContext: Profile update error:', error);
    throw error;
  }
};


  // CHANGE PASSWORD
  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error('Not logged in');
    const response = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        username: user.username,
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to change password');
    // No user update needed here
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};
