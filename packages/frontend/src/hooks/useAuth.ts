import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function requireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return { isAuthenticated: false, isLoading: true };
  }
  
  if (!isAuthenticated) {
    return { isAuthenticated: false, isLoading: false, location };
  }
  
  return { isAuthenticated: true, isLoading: false };
}