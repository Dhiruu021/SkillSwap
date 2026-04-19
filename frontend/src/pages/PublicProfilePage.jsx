import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api.js';

const PublicProfilePage = () => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/profile/${username}`);
        setUser(res.data);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('User not found');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [username]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div></div>;

  if (error) return <div className="flex justify-center items-center min-h-screen"><p className="text-red-500">{error}</p></div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card">
        <div className="flex items-center space-x-6 mb-6">
          <img src={user.profilePhoto || '/default-avatar.png'} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{user.name}</h1>
            <p className="text-lg text-gray-600 dark:text-slate-400">@{user.username}</p>
            {user.isPremium && <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">Premium</span>}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">About</h2>
            <div className="space-y-3">
              {user.bio && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Bio</p>
                  <p className="text-gray-700 dark:text-slate-200">{user.bio}</p>
                </div>
              )}
              {user.country && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Country</p>
                  <p className="text-gray-700 dark:text-slate-200">{user.country}</p>
                </div>
              )}
              {user.timezone && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Timezone</p>
                  <p className="text-gray-700 dark:text-slate-200">{user.timezone}</p>
                </div>
              )}
              {user.languagePreference && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Language</p>
                  <p className="text-gray-700 dark:text-slate-200">{user.languagePreference.charAt(0).toUpperCase() + user.languagePreference.slice(1)}</p>
                </div>
              )}
              {user.gender && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Gender</p>
                  <p className="text-gray-700 dark:text-slate-200">{user.gender.charAt(0).toUpperCase() + user.gender.slice(1)}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Skills</h2>
            <div className="space-y-4">
              {user.teachSkills && user.teachSkills.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Can Teach</p>
                  <div className="flex flex-wrap gap-2">
                    {user.teachSkills.map((skill, index) => (
                      <span key={index} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {user.learnSkills && user.learnSkills.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">Wants to Learn</p>
                  <div className="flex flex-wrap gap-2">
                    {user.learnSkills.map((skill, index) => (
                      <span key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {user.averageRating > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-5 h-5 ${i < Math.floor(user.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-700 dark:text-slate-200">{user.averageRating.toFixed(1)} ({user.reviewCount} reviews)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfilePage;