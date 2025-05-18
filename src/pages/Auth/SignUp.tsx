import {
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignUp = () => {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  console.log(API_BASE_URL);
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setError(password === confirmPassword ? '' : 'Passwords do not match');
  }, [password, confirmPassword]);
  const requestVerificationCode = async () => {
    if (error) return;

    setError('');
    setIsVerifying(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/email-verification`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }

      setSuccess('Verification code sent to your email');
      setStep('verification');
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

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          verification_code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create account');
      }
      localStorage.setItem('isLoggedIn', 'true');

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

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 bg-slate-700 border border-slate-600 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Password"
                  />
                </div>
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
                    className="appearance-none relative block w-full pl-10 pr-3 py-3 bg-slate-700 border border-slate-600 placeholder-slate-400 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Confirm password"
                  />
                </div>
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
                    ? 'Request Verification Code'
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
