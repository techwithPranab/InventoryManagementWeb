import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'client';
  mobileNo?: string;
  industry?: string;
  avatar?: string;
}

interface InventorySetup {
  _id: string;
  clientCode: string;
  databaseName: string;
  setupStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface AuthState {
  user: User | null;
  token: string | null;
  clientCode: string | null;
  inventorySetup: InventorySetup | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  clientCode: localStorage.getItem('clientCode'),
  inventorySetup: null,
  isLoading: true,
  isAuthenticated: false,
};

// Action types
type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; clientCode?: string; inventorySetup?: InventorySetup } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_INVENTORY_SETUP'; payload: InventorySetup };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        clientCode: action.payload.clientCode || null,
        inventorySetup: action.payload.inventorySetup || null,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        clientCode: null,
        inventorySetup: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_INVENTORY_SETUP':
      return {
        ...state,
        inventorySetup: action.payload,
        clientCode: action.payload.clientCode,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const clientCode = localStorage.getItem('clientCode');

      if (token && userData) {
        try {
          // Parse stored user data instead of making API call to avoid issues
          const user = JSON.parse(userData);
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token, clientCode: clientCode || undefined },
          });
        } catch (error) {
          // If parsing fails or token is invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('clientCode');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Login with AdminBackend
      const response = await authAPI.login({ email, password });
      const { user, token, clientCode, inventorySetup } = response.data.data;
      console.log('Login response:', response.data);
      // Store basic auth data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Store client code if available
      if (clientCode) {
        localStorage.setItem('clientCode', clientCode);
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token, clientCode, inventorySetup },
      });
      
    } catch (error: any) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('clientCode');
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.user;

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      dispatch({
        type: 'UPDATE_USER',
        payload: updatedUser,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
