import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import SignIn from './pages/Auth/SignIn';
import SignUp from './pages/Auth/SignUp';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import ProblemSetting from './pages/ProblemSetting';
import Submissions from './pages/Submissions';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthPage = ['/signin', '/signup'].includes(location.pathname);

  // Check auth status on initial load
  useEffect(() => {
    const checkAuthStatus = () => {
      // TODO: Replace with actual API call to check auth status
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setIsLoggedIn(loggedIn);

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

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen">
        {isLoggedIn && !isAuthPage && <Sidebar />}
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
            path="/dashboard"
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/signin" />}
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
