import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import SignIn from './pages/Auth/SignIn';
import SignUp from './pages/Auth/SignUp';
import Chat from './pages/Chat';
import Home from './pages/Home';
import ProblemSetting from './pages/ProblemSetting';
import ProblemVerification from './pages/ProblemVerification';
import Submissions from './pages/Submissions';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('verifier'); // TODO: Replace with actual user role from API/localStorage
  const isAuthPage = ['/signin', '/signup'].includes(location.pathname);

  // Check auth status on initial load
  useEffect(() => {
    const checkAuthStatus = () => {
      // TODO: Replace with actual API call to check auth status
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);

      setUserRole(loggedIn ? 'verifier' : ''); // TODO: Replace with actual user role from API/localStorage

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
  const isVerifier = () => userRole === 'verifier' || userRole === 'admin';

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen">
        {isLoggedIn && !isAuthPage && <Sidebar userRole={userRole} />}
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={isLoggedIn ? <Home /> : <Navigate to="/signin" />}
          />
          <Route
            path="/problemsetting"
            element={
              isLoggedIn ? <ProblemSetting /> : <Navigate to="/signin" />
            }
          />
          <Route
            path="/chat/:id?"
            element={isLoggedIn ? <Chat /> : <Navigate to="/signin" />}
          />
          <Route
            path="/submissions"
            element={isLoggedIn ? <Submissions /> : <Navigate to="/signin" />}
          />

          {/* Verifier-only route */}
          <Route
            path="/problemverification"
            element={
              isLoggedIn ? (
                isVerifier() ? (
                  <ProblemVerification />
                ) : (
                  <Navigate to="/" />
                )
              ) : (
                <Navigate to="/signin" />
              )
            }
          />

          {/* Fallback route */}
          <Route
            path="*"
            element={<Navigate to={isLoggedIn ? '/' : '/signin'} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
