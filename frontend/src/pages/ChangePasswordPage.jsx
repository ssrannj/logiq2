import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const isForced = user?.forcePasswordChange === true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await changePassword(newPassword);
      const updated = { ...user, forcePasswordChange: false };
      localStorage.setItem('user', JSON.stringify(updated));
      setDone(true);
      setTimeout(() => {
        if (user?.role === 'ADMIN') navigate('/admin');
        else navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] flex items-center justify-center px-4 font-body">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#005a07]/10 mb-4">
            <span className="material-symbols-outlined text-[#005a07] text-3xl">lock_reset</span>
          </div>
          <h1 className="font-headline text-2xl font-extrabold text-[#1b1c1c]">
            {isForced ? 'Set Your New Password' : 'Change Password'}
          </h1>
          {isForced && (
            <p className="text-sm text-[#707a6b] mt-2 max-w-sm mx-auto">
              Your account was created with a temporary password. Please set a new secure password before continuing.
            </p>
          )}
          {!isForced && (
            <p className="text-sm text-[#707a6b] mt-2">
              Signed in as <strong>{user?.email}</strong>
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#e4e2e2] shadow-sm p-8">
          {done ? (
            <div className="text-center py-4">
              <span className="material-symbols-outlined text-[#005a07] text-5xl block mb-3">check_circle</span>
              <p className="font-bold text-[#1b1c1c] text-lg font-headline">Password Changed!</p>
              <p className="text-sm text-[#707a6b] mt-1">Redirecting you to the dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b] block mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-[#707a6b] block mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter new password"
                  className="w-full bg-[#f5f3f3] px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#005a07] text-sm transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-br from-[#005a07] to-[#1d741b] text-white py-3.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">lock</span> Set New Password</>
                )}
              </button>

              {!isForced && (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full py-3 text-sm text-[#707a6b] hover:text-[#1b1c1c] transition-colors"
                >
                  Cancel
                </button>
              )}
            </form>
          )}
        </div>

        {isForced && (
          <p className="text-center text-xs text-[#707a6b] mt-6">
            Need help?{' '}
            <button onClick={logout} className="text-[#005a07] font-semibold hover:underline">
              Sign out
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
