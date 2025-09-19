import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { API_BASE_URL } from '../../config';

/**
 * SignOut component that handles user logout
 * Clears local storage authentication data and redirects to home page
 */
const SignOut = () => {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // Try to invalidate session on the server side
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
      } catch {
        // ignore network errors on logout
      }

      // Clear authentication data from local storage
      localStorage.removeItem('userRole');
      localStorage.removeItem('userRoles');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('isLoggedIn');

      // Notify the app that auth state changed (same-tab)
      window.dispatchEvent(new Event('auth-changed'));

      // Redirect to home page without full reload
      navigate('/', { replace: true });
    })();
  }, [navigate]);

  // Return null as this component only handles the logout action
  // and doesn't need to render anything
  return null;
};

export default SignOut;
