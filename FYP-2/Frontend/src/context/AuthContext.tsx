import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';
import { API_CONFIG } from '@/lib/config';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = API_CONFIG.BASE_URL; // Replace with your actual API URL

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if there's a saved token in localStorage
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    setIsLoading(false);
  }, []);

 const login = async (email: string, password: string): Promise<User> => {
  setIsLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData?.error || "Invalid email or password";
      throw new Error(errorMessage);
    }

    const data = await response.json();

    const userData: User = {
      id: data.user._id,
      name: data.user.name || email.split('@')[0],
      email: data.user.email,
      phone: data.user.phone || '',
      role: data.user.role
    };

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', data.token);
    toast.success('Logged in successfully!');
    return userData;

  } catch (error: any) {
    const msg = error.message || "Login failed. Please try again.";
    toast.error(msg);
    throw new Error(msg);
  } finally {
    setIsLoading(false);
  }
};


 const register = async (name: string, email: string, password: string, phone: string, role: UserRole): Promise<void> => {
  setIsLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, phone, role }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData?.error || "Registration failed";
      throw new Error(errorMessage);
    }

    const data = await response.json();

    const userData: User = {
      id: data.user._id,
      name: name || email.split('@')[0],
      email: data.user.email,
      phone: data.user.phone,
      role: data.user.role
    };

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', data.token);
    toast.success('Registered successfully!');
  } catch (error: any) {
    const msg = error.message || "Failed to register.";
    toast.error(msg);
    throw new Error(msg);
  } finally {
    setIsLoading(false);
  }
};


  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
