import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import Sidebar from './components/Sidebar';
import SignIn from './pages/Auth/SignIn';
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
  const [userRole, setUserRole] = useState('verifier'); // TODO: Replace with actual user role from API/localStorage
  const location = useLocation();
  const isAuthPage = ['/signin', '/signup'].includes(location.pathname);

  // Check auth status on initial load
  useEffect(() => {
    document.title = 'Algorithmia - Home';

    const checkAuthStatus = () => {
      // TODO: Replace with actual API call to check auth status
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);

      setUserRole(loggedIn ? 'super_admin' : ''); // TODO: Replace with actual user role from API/localStorage

      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <div className="text-indigo-400 text-2xl font-medium">Loading...</div>
      </div>
    );
  }

  // Helper function to check if user has verifier role
  const isVerifier = () => userRole === 'verifier' || isAdmin();

  // Helper function to check if user is admin
  const isAdmin = () => userRole === 'admin' || userRole === 'super_admin';

  // Helper function to check if user is super admin
  const isSuperAdmin = () => userRole === 'super_admin';

  const isReviewer = () => userRole === 'reviewer' || isAdmin();

  return (
    <div className="flex h-screen w-screen">
      <TitleManager />
      {isLoggedIn && !isAuthPage && <Sidebar userRole={userRole} />}
      <Routes>
        {/* Public routes */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
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
