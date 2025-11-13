import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { API_BASE_URL } from '../../config';
import { safeJsonParse } from '../../utils/api';

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

        const data = await safeJsonParse<{ message?: string }>(response);

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
          if (response.status === 410 || response.status === 422) {
            setStatus('expired');
            setMessage('Verification link has expired. Please register again.');
          } else {
            setStatus('error');
            setMessage(
              data.message || 'Email verification failed. Please try again.',
            );
          }
        }
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Network error. Please check your connection and try again.',
        );
      }
    };

    verifyEmail();
  }, [token, email, navigate]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center animate-fadeIn">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-6">邮箱验证</h1>

          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-600 border-t-indigo-600"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-indigo-400 animate-ping"></div>
              </div>
              <span className="text-slate-300 text-lg animate-pulse">
                验证中，请稍候...
              </span>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center animate-fadeIn">
              <div className="mx-auto mb-6 w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center animate-scaleIn">
                <svg
                  className="w-12 h-12 text-green-400 animate-checkmark"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-400 text-lg font-medium mb-3">
                {message}
              </p>
              <div className="flex items-center justify-center space-x-1 text-slate-400 text-sm">
                <span>正在跳转到首页</span>
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center animate-fadeIn">
              <div className="mx-auto mb-6 w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center animate-scaleIn">
                <svg
                  className="w-12 h-12 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-400 mb-8 text-lg">{message}</p>
              <div className="space-y-3">
                <Link
                  to="/signup"
                  className="block w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 font-medium"
                >
                  重新注册
                </Link>
                <Link
                  to="/"
                  className="block w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all duration-200 transform hover:scale-105 font-medium"
                >
                  返回首页
                </Link>
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center animate-fadeIn">
              <div className="mx-auto mb-6 w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center animate-scaleIn">
                <svg
                  className="w-12 h-12 text-yellow-400"
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
              <p className="text-yellow-400 mb-8 text-lg">{message}</p>
              <Link
                to="/signup"
                className="block w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 font-medium"
              >
                重新注册
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes checkmark {
          0% {
            stroke-dashoffset: 100;
            stroke-dasharray: 100;
          }
          100% {
            stroke-dashoffset: 0;
            stroke-dasharray: 100;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .animate-checkmark {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: checkmark 0.6s ease-out 0.2s forwards;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default EmailVerificationPage;
