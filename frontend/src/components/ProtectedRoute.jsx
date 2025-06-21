import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../services/api';

export default function ProtectedRoute({ children }) {
  const [isValidating, setIsValidating] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsValidating(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        // Validate token with backend
        const response = await api.get('/auth/validate', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.status === 200) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token'); // Clear invalid token
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Token is invalid or expired
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, []);

  // Show loading while validating
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Validating...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  return isAuthenticated ? children : <Navigate to="/login" />;
}