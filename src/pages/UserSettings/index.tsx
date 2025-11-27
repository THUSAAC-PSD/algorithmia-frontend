import { ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { FormEvent, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { API_BASE_URL } from '../../config';

const UserSettings = () => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      newPassword.length >= 8 &&
      confirmPassword.length > 0 &&
      newPassword === confirmPassword &&
      newPassword.length >= 8
    );
  }, [confirmPassword, newPassword]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!canSubmit) {
      setError(
        t(
          'userSettings.errors.invalidFields',
          'Please fill out all fields correctly.',
        ),
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      if (!response.ok) {
        let message = t(
          'userSettings.errors.generic',
          'Unable to update password. Please try again.',
        );
        try {
          const data = await response.json();
          if (
            typeof data?.message === 'string' &&
            data.message.trim().length > 0
          ) {
            message = data.message;
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }

      toast.success(
        t('userSettings.success', 'Password updated successfully.'),
      );
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t(
              'userSettings.errors.generic',
              'Unable to update password. Please try again.',
            );
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrengthHint =
    newPassword.length >= 12
      ? t('userSettings.hints.strong', 'Looks strong')
      : newPassword.length >= 8
        ? t('userSettings.hints.medium', 'Meets the minimum requirement')
        : t('userSettings.hints.short', 'At least 8 characters');

  return (
    <div className="bg-slate-900 min-h-screen w-full p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
            <LockClosedIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {t('userSettings.title', 'User Settings')}
            </h1>
            <p className="text-slate-400">
              {t(
                'userSettings.subtitle',
                'Manage your account security and update your password.',
              )}
            </p>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl shadow-slate-900/40">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {t('userSettings.resetPassword', 'Reset Password')}
              </h2>
              <p className="text-sm text-slate-400">
                {t(
                  'userSettings.passwordDescription',
                  'Choose a strong password that you do not use elsewhere.',
                )}
              </p>
            </div>
            {submitting && (
              <div className="flex items-center gap-2 text-indigo-300 text-sm">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                {t('userSettings.status.updating', 'Updating...')}
              </div>
            )}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-300">
                  {t('userSettings.fields.newPassword', 'New password')}
                </label>
                <input
                  type="password"
                  className={`w-full rounded-lg border px-4 py-3 text-white placeholder:text-slate-500 transition focus:ring-2 ${
                    newPassword.length > 0
                      ? newPassword.length >= 8
                        ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/30'
                        : 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/30'
                      : 'border-slate-700 bg-slate-900/60 focus:border-indigo-500 focus:ring-indigo-500/30'
                  } bg-slate-900/60`}
                  placeholder={t(
                    'userSettings.placeholders.new',
                    'At least 8 characters',
                  )}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-slate-400">{passwordStrengthHint}</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-300">
                  {t(
                    'userSettings.fields.confirmPassword',
                    'Confirm new password',
                  )}
                </label>
                <input
                  type="password"
                  className={`w-full rounded-lg border px-4 py-3 text-white placeholder:text-slate-500 transition focus:ring-2 ${
                    confirmPassword.length > 0
                      ? confirmPassword === newPassword
                        ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/30'
                        : 'border-amber-500 focus:border-amber-500 focus:ring-amber-500/30'
                      : 'border-slate-700 bg-slate-900/60 focus:border-indigo-500 focus:ring-indigo-500/30'
                  } bg-slate-900/60`}
                  placeholder={t(
                    'userSettings.placeholders.confirm',
                    'Re-enter new password',
                  )}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {submitting && (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                )}
                {t('userSettings.actions.save', 'Update password')}
              </button>
              <p className="text-xs text-slate-500">
                {t(
                  'userSettings.status.session',
                  'You will stay signed in after updating.',
                )}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
