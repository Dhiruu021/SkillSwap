import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const ResetPasswordPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      setMessage(res.data.message || 'Password reset successfully.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700 shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Reset Password</h1>
          <p className="text-slate-300">
            Enter your new password below and continue using SkillSwap.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">New password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Confirm password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400">
          Remembered your password?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
