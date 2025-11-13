import {
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import SuccessCheck from '../../components/animations/SuccessCheck';
import { safeJsonParse } from '../../utils/api';

const SignUp = () => {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const REQUIRE_EMAIL_VERIFICATION =
    import.meta.env.REQUIRE_EMAIL_VERIFICATION === 'true';
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [usernameError, setUsernameError] = useState('');
  const navigate = useNavigate();

  // Validate password strength
  useEffect(() => {
    if (!password) {
      setPasswordErrors([]);
      return;
    }

    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (password !== confirmPassword && confirmPassword) {
      errors.push('Passwords do not match');
    }
    setPasswordErrors(errors);
  }, [password, confirmPassword]);

  // Validate username
  useEffect(() => {
    if (!username) {
      setUsernameError('');
      return;
    }

    if (username.length < 5) {
      setUsernameError('Username must be at least 5 characters');
    } else {
      setUsernameError('');
    }
  }, [username]);

  useEffect(() => {
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0]);
    } else if (usernameError) {
      setError(usernameError);
    } else {
      setError('');
    }
  }, [passwordErrors, usernameError]);
  const requestVerificationCode = async () => {
    // Clear previous errors
    setError('');
    setSuccess('');

    // Validate before sending request
    if (username.length < 5) {
      setError('Username must be at least 5 characters');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/email-verification`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        // Backend expects email, username, password
        body: JSON.stringify({ email, username, password }),
      });

      // Use safe JSON parsing to handle empty responses
      const data = await safeJsonParse<{ message?: string; code?: string }>(
        response,
      );

      if (!response.ok) {
        // Handle specific error messages from backend
        let errorMessage = data.message || 'Failed to send verification code';

        // Parse validation errors
        if (errorMessage.includes("'Password' failed on the 'min' tag")) {
          errorMessage = 'Password must be at least 8 characters';
        } else if (
          errorMessage.includes("'Username' failed on the 'min' tag")
        ) {
          errorMessage = 'Username must be at least 5 characters';
        } else if (errorMessage.includes('email')) {
          errorMessage = 'Invalid email address';
        }

        throw new Error(errorMessage);
      }

      // Check if we're in development mode (backend returns code directly)
      if (data.code) {
        // In development mode, skip email verification step and directly register
        setVerificationCode(data.code);
        await registerUser(data.code);
        return;
      }

      setSuccess('Verification code sent to your email');
      setShowSuccessAnim(true);
      // Step change will happen after animation completes
      setTimeout(() => {
        setShowSuccessAnim(false);
        setStep('verification');
      }, 1200);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to send verification code',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const registerUser = async (code: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username,
          email,
          password,
          email_verification_code: code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }

      localStorage.setItem('isLoggedIn', 'true');

      // Dispatch auth-changed event to trigger App.tsx to re-check auth status
      window.dispatchEvent(new Event('auth-changed'));

      // Small delay to allow the event to be processed before navigation
      await new Promise((resolve) => setTimeout(resolve, 100));

      navigate('/');
    } catch (error) {
      localStorage.setItem('isLoggedIn', 'false');
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create account. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (error) {
      return;
    }

    if (step === 'email') {
      await requestVerificationCode();
      return;
    }

    // basic client-side username validation to match backend requirement (min=5)
    if (!username || username.length < 5) {
      setError('Username must be at least 5 characters long');
      return;
    }

    await registerUser(verificationCode);
  };

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative">
      {showSuccessAnim && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-4">
            <SuccessCheck size={120} />
            <p className="text-emerald-300 text-sm">Verification email sent</p>
          </div>
        </div>
      )}
      <div className="max-w-md w-full space-y-6 bg-slate-800 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            <span className="text-indigo-400">Algo</span>rithmia
          </h2>
          <h3 className="mt-4 text-xl font-medium text-white">
            {step === 'email' ? 'Sign up to your account' : 'Verify your email'}
          </h3>
          {step === 'verification' && (
            <p className="mt-2 text-sm text-slate-400">
              Please enter the verification code sent to {email}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {step === 'email' ? (
            <>
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    minLength={5}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 bg-slate-700 border ${
                      username && usernameError
                        ? 'border-red-500 focus:ring-red-500'
                        : username && !usernameError
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-slate-600 focus:ring-indigo-500'
                    } placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:border-transparent`}
                    placeholder="Username (min. 5 characters)"
                  />
                  {username && !usernameError && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-green-500"
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
                  )}
                </div>
                {username && usernameError && (
                  <p className="mt-1 text-xs text-red-400">{usernameError}</p>
                )}
              </div>

              <div>
                <label htmlFor="name" className="sr-only">
                  Full name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 bg-slate-700 border border-slate-600 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 bg-slate-700 border border-slate-600 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 bg-slate-700 border ${
                      password && passwordErrors.length > 0
                        ? 'border-red-500 focus:ring-red-500'
                        : password && password.length >= 8
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-slate-600 focus:ring-indigo-500'
                    } placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:border-transparent`}
                    placeholder="Password (min. 8 characters)"
                  />
                  {password &&
                    password.length >= 8 &&
                    passwordErrors.length === 0 && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-green-500"
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
                    )}
                </div>
                {password && password.length < 8 && (
                  <p className="mt-1 text-xs text-red-400">
                    Password must be at least 8 characters
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`appearance-none relative block w-full pl-10 pr-3 py-3 bg-slate-700 border ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-500 focus:ring-red-500'
                        : confirmPassword &&
                            password === confirmPassword &&
                            password.length >= 8
                          ? 'border-green-500 focus:ring-green-500'
                          : 'border-slate-600 focus:ring-indigo-500'
                    } placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:border-transparent`}
                    placeholder="Confirm password"
                  />
                  {confirmPassword &&
                    password === confirmPassword &&
                    password.length >= 8 && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-green-500"
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
                    )}
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-400">
                    Passwords do not match
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="verification-code" className="sr-only">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShieldCheckIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="verification-code"
                    name="verification-code"
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 bg-slate-700 border border-slate-600 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Verification code"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={requestVerificationCode}
                  className="w-full flex justify-center py-3 px-4 border border-indigo-500/30 text-sm font-medium rounded-lg text-indigo-300 bg-transparent hover:bg-indigo-500/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors duration-200"
                >
                  {isVerifying ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || isVerifying}
              className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                isLoading || isVerifying
                  ? 'bg-indigo-500/50 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200`}
            >
              {isLoading
                ? 'Creating account...'
                : isVerifying
                  ? 'Sending code...'
                  : step === 'email'
                    ? REQUIRE_EMAIL_VERIFICATION
                      ? 'Request Verification Code'
                      : 'Sign Up'
                    : 'Complete Sign Up'}
            </button>
          </div>
        </form>

        <div className="text-center">
          {step === 'verification' && (
            <button
              type="button"
              onClick={() => setStep('email')}
              className="mb-3 text-sm text-indigo-400 hover:text-indigo-300 focus:outline-none block w-full"
            >
              ← Back to sign up
            </button>
          )}
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link
              to="/signin"
              className="font-medium text-indigo-400 hover:text-indigo-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
