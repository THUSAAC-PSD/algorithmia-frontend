import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { API_BASE_URL } from '../../config';

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<
    'loading' | 'success' | 'error' | 'expired'
  >('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage(
        'Invalid verification link. Please check your email for the correct link.',
      );
      return;
    }

    // Verify the email token
    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            token: token,
          }),
          credentials: 'include',
        });

        if (response.ok) {
          setStatus('success');
          setMessage(
            'Email verification successful! Your account has been activated.',
          );
          // Since backend sets the session cookie, reflect login state in client storage and go home
          localStorage.setItem('userRole', 'user');
          localStorage.setItem('isLoggedIn', 'true');
          setTimeout(() => {
            // Force page reload to ensure UI updates with authentication state
            window.location.href = '/';
          }, 2000);
        } else {
          const errorData = await response.json();
          if (response.status === 410 || response.status === 422) {
            setStatus('expired');
            setMessage('Verification link has expired. Please register again.');
          } else {
            setStatus('error');
            setMessage(
              errorData.message ||
                'Email verification failed. Please try again.',
            );
          }
        }
      } catch {
        setStatus('error');
        setMessage(
          'Network error. Please check your connection and try again.',
        );
      }
    };

    verifyEmail();
  }, [token, email, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">邮箱验证</h1>

          {status === 'loading' && (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-slate-300">验证中...</span>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-400 mb-4">{message}</p>
              <p className="text-slate-400 text-sm">正在跳转到首页...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  to="/signup"
                  className="block w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200"
                >
                  重新注册
                </Link>
                <Link
                  to="/"
                  className="block w-full px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition duration-200"
                >
                  返回首页
                </Link>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-yellow-400 mb-6">{message}</p>
              <Link
                to="/signup"
                className="block w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition duration-200"
              >
                重新注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
