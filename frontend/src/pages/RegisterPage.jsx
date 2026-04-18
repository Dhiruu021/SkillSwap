import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const RegisterPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    bio: '',
    country: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    languagePreference: 'english',
    gender: '',
    teachSkills: '',
    learnSkills: ''
  });
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
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        bio: form.bio,
        country: form.country.trim(),
        timezone: form.timezone,
        languagePreference: form.languagePreference,
        gender: form.gender,
        teachSkills: form.teachSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        learnSkills: form.learnSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      };
      const res = await api.post('/auth/register', payload);
      login(res.data.token, res.data.user);
      navigate('/app');
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900/80 backdrop-blur-md border border-slate-700 shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mb-4">
            <img src="/logo.svg" alt="Skill Swap Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Create your Skill Swap profile</h1>
          <p className="text-slate-300">
            Tell us what you can teach and what you want to learn.
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Name</label>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Short bio</label>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              name="bio"
              value={form.bio}
              onChange={handleChange}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Country</label>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="e.g. India, USA, Germany"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Timezone</label>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
              placeholder="e.g. Asia/Kolkata"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Preferred language</label>
            <select
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              name="languagePreference"
              value={form.languagePreference}
              onChange={handleChange}
            >
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">Gender</label>
            <select
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Skills you can teach
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors min-h-[80px]"
              name="teachSkills"
              value={form.teachSkills}
              onChange={handleChange}
              placeholder="e.g. Web Development, Python, UI Design"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Skills you want to learn
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-slate-50 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors min-h-[80px]"
              name="learnSkills"
              value={form.learnSkills}
              onChange={handleChange}
              placeholder="e.g. Guitar, Photography, Public Speaking"
            />
          </div>
          <button
            type="submit"
            className="md:col-span-2 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

