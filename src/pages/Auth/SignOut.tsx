import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SignOut = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('userId');
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'abc',
      },
    });
    navigate('/signin');
  }, [navigate]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
      <div className="text-indigo-400 text-2xl font-medium">Signing out...</div>
    </div>
  );
};

export default SignOut;
