import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const LoginPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/app" replace />;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-white/30 dark:border-slate-700/50 shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <img src="/logo.svg" alt="Skill Swap Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-gray-600 dark:text-slate-300">
            Log in to continue exchanging skills with the community.
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Email</label>
            <input
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Password</label>
            <input
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 dark:text-slate-400">
          New here?{' '}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

