import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const ForgotPasswordPage = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');
    setDevResetUrl('');
    setError('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setStatus(
        res.data.message ||
          'If this email is registered, password reset instructions have been sent.'
      );
      setDevResetUrl(res.data.devResetUrl || '');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700 shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Forgot Password</h1>
          <p className="text-slate-300">
            Enter your email and we&apos;ll send reset instructions if your account exists.
          </p>
        </div>

        {status && (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {status}
          </div>
        )}

        {devResetUrl && (
          <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <p className="font-semibold text-amber-100 mb-2">Local dev — email not configured</p>
            <p className="text-amber-200/90 mb-2">Open this link to reset (configure SMTP in backend <code className="text-amber-100">.env</code> for real emails):</p>
            <a
              href={devResetUrl}
              className="break-all text-indigo-300 hover:text-indigo-200 underline"
            >
              {devResetUrl}
            </a>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-400">
          Remembered it?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
