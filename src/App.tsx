import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import { API_BASE_URL } from './config';
import EmailVerificationPage from './pages/Auth/EmailVerification';
import SignIn from './pages/Auth/SignIn';
import SignOut from './pages/Auth/SignOut';
import SignUp from './pages/Auth/SignUp';
import Chat from './pages/Chat';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import ProblemBank from './pages/ProblemBank';
import ProblemReview from './pages/ProblemReview';
import ProblemReviewDetail from './pages/ProblemReviewDetail';
import ProblemSetting from './pages/ProblemSetting';
import ProblemVerification from './pages/ProblemVerification';
import ProblemVerificationDetail from './pages/ProblemVerificationDetail';
import SuperAdmin from './pages/SuperAdmin';
import CompetitionDetail from './pages/SuperAdmin/CompetitionDetail';
import CompetitionManagement from './pages/SuperAdmin/Competitions';
import PersonnelManagement from './pages/SuperAdmin/Personnel';

function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let pageName = 'Home';

    // Map routes to page names
    if (path.includes('/signin')) pageName = 'Sign In';
    else if (path.includes('/signup')) pageName = 'Sign Up';
    else if (path.includes('/problemsetting')) pageName = 'Problem Setting';
    else if (path.includes('/chat')) pageName = 'Chat';
    else if (path.includes('/problemverification'))
      pageName = 'Problem Verification';
    else if (path.includes('/problembank')) pageName = 'Problem Bank';
    else if (path.includes('/problemreview')) pageName = 'Problem Review';
    else if (path.includes('/superadmin')) pageName = 'Super Admin';

    // Update document title
    document.title = `Algorithmia - ${pageName}`;
  }, [location]);

  return null;
}

function AppWithRouter() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]); // Store multiple roles
  const [userName, setUserName] = useState<string>('');
  const location = useLocation();
  const isAuthPage = ['/signin', '/signup'].includes(location.pathname);

  // Check auth status on initial load
  useEffect(() => {
    document.title = 'Algorithmia - Home';

    const checkAuthStatus = async () => {
      try {
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          // Fetch the current user data from the API
          const response = await fetch(`${API_BASE_URL}/users/current`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            // Get the user data with roles
            const userData = await response.json();
            const roles = userData.user?.roles || [];
            setUserRoles(roles);
            const name = userData.user?.username || userData.user?.email || '';
            setUserName(name);
          } else {
            // If API call fails, fallback to localStorage
            const rolesFromStorage = localStorage.getItem('userRoles');
            setUserRoles(rolesFromStorage ? JSON.parse(rolesFromStorage) : []);
            const nameFromStorage = localStorage.getItem('userName') || '';
            setUserName(nameFromStorage);
          }
        } else {
          setUserRoles([]);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Fallback to localStorage if API call fails
        const rolesFromStorage = localStorage.getItem('userRoles');
        setUserRoles(rolesFromStorage ? JSON.parse(rolesFromStorage) : []);
        const nameFromStorage = localStorage.getItem('userName') || '';
        setUserName(nameFromStorage);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();

    // React to cross-component auth changes (e.g., sign out)
    const onAuthChanged = () => {
      checkAuthStatus();
    };
    window.addEventListener('auth-changed', onAuthChanged);
    return () => window.removeEventListener('auth-changed', onAuthChanged);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <div className="text-indigo-400 text-2xl font-medium">Loading...</div>
      </div>
    );
  }

  // Helper function to check if user has verifier role
  const isVerifier = () => userRoles.includes('tester') || isAdmin();

  // Helper function to check if user is admin
  const isAdmin = () =>
    userRoles.includes('admin') || userRoles.includes('super_admin');

  // Helper function to check if user is super admin
  const isSuperAdmin = () => userRoles.includes('super_admin');

  const isReviewer = () => userRoles.includes('reviewer') || isAdmin();

  return (
    <div className="flex h-screen w-screen">
      <TitleManager />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#1e293b',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1e293b',
            },
          },
        }}
      />
      {isLoggedIn && !isAuthPage && (
        <Sidebar userRoles={userRoles} userName={userName} />
      )}
      <Routes>
        {/* Public routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signout" element={<SignOut />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />
        <Route path="/" element={isLoggedIn ? <Home /> : <LandingPage />} />

        {/* Protected routes */}
        <Route
          path="/problemsetting"
          element={isLoggedIn ? <ProblemSetting /> : <Navigate to="/signin" />}
        />
        <Route
          path="/chat/:id?"
          element={isLoggedIn ? <Chat /> : <Navigate to="/signin" />}
        />
        <Route
          path="/problemverification"
          element={
            isLoggedIn && isVerifier() ? (
              <ProblemVerification />
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        <Route
          path="/problemverification/:id"
          element={
            isLoggedIn ? (
              isVerifier() ? (
                <ProblemVerificationDetail />
              ) : (
                <Navigate to="/" />
              )
            ) : (
              <Navigate to="/signin" />
            )
          }
        />

        <Route
          path="/problembank"
          element={
            isLoggedIn && isAdmin() ? (
              <ProblemBank />
            ) : (
              <Navigate to="/signin" />
            )
          }
        />

        <Route
          path="/problemreview"
          element={
            isLoggedIn && isReviewer() ? (
              <ProblemReview />
            ) : (
              <Navigate to="/signin" />
            )
          }
        />
        <Route
          path="/problemreview/:id"
          element={
            isLoggedIn && isReviewer() ? (
              <ProblemReviewDetail />
            ) : (
              <Navigate to="/signin" />
            )
          }
        />

        {/* Super Admin Routes */}
        <Route
          path="/superadmin"
          element={
            isLoggedIn && isSuperAdmin() ? <SuperAdmin /> : <Navigate to="/" />
          }
        >
          <Route
            index
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold text-white">
                  Super Admin Dashboard
                </h1>
              </div>
            }
          />

          <Route path="personnel" element={<PersonnelManagement />} />
          <Route path="competitions" element={<CompetitionManagement />} />
          <Route path="competitions/:id" element={<CompetitionDetail />} />

          <Route
            path="settings"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold text-white">
                  System Settings
                </h1>
                <div className="mt-4 text-slate-300">
                  Settings configuration interface will be implemented here.
                </div>
              </div>
            }
          />
        </Route>
      </Routes>
    </div>
  );
}

export default AppWithRouter;
