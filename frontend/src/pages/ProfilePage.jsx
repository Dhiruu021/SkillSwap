import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { useAuth } from '../state/AuthContext.jsx';

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic",
  "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador",
  "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia",
  "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania",
  "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
  "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu",
  "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const TIMEZONES = [
  "UTC", "UTC+1", "UTC+2", "UTC+3", "UTC+4", "UTC+5", "UTC+5:30", "UTC+6", "UTC+7", "UTC+8", "UTC+9", "UTC+10", "UTC+11", "UTC+12",
  "UTC-1", "UTC-2", "UTC-3", "UTC-4", "UTC-5", "UTC-6", "UTC-7", "UTC-8", "UTC-9", "UTC-10", "UTC-11", "UTC-12",
  "Africa/Johannesburg", "Africa/Cairo", "Africa/Lagos", "Africa/Nairobi", "Africa/Casablanca", "Africa/Algiers",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage", "America/Toronto",
  "America/Mexico_City", "America/Buenos_Aires", "America/Sao_Paulo", "America/Lima",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore", "Asia/Bangkok", "Asia/Jakarta", "Asia/Manila",
  "Asia/Seoul", "Asia/Dubai", "Asia/Kolkata", "Asia/Bangkok", "Asia/Ho_Chi_Minh", "Asia/Yangon", "Asia/Karachi",
  "Asia/Kathmandu", "Asia/Kabul", "Asia/Beirut", "Asia/Jerusalem", "Asia/Istanbul", "Asia/Tehran",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Amsterdam",
  "Europe/Brussels", "Europe/Vienna", "Europe/Prague", "Europe/Warsaw", "Europe/Moscow", "Europe/Athens",
  "Europe/Dublin", "Europe/Lisbon", "Europe/Stockholm", "Europe/Copenhagen", "Europe/Helsinki", "Europe/Istanbul",
  "Australia/Sydney", "Australia/Melbourne", "Australia/Brisbane", "Australia/Perth", "Australia/Adelaide",
  "Pacific/Auckland", "Pacific/Fiji", "Pacific/Honolulu", "Pacific/Tongatapu"
];

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    country: user?.country || '',
    timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    languagePreference: user?.languagePreference || 'english',
    gender: user?.gender || '',
    profilePhoto: null
  });

  const [filteredCountries, setFilteredCountries] = useState([]);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [filteredTimezones, setFilteredTimezones] = useState([]);
  const [showTimezoneSuggestions, setShowTimezoneSuggestions] = useState(false);

  const formatUserId = (rawId) => {
    const idString = String(rawId || '');
    const hash = Array.from(idString).reduce((acc, char) => {
      return (acc * 31 + char.charCodeAt(0)) % 100000000;
    }, 0);
    return String(hash).padStart(8, '0');
  };
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(user?.profilePhoto || '');

  const resetForm = () => {
    setForm({
      name: user?.name || '',
      username: user?.username || '',
      bio: user?.bio || '',
      country: user?.country || '',
      timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      languagePreference: user?.languagePreference || 'english',
      gender: user?.gender || '',
      profilePhoto: null
    });
    setPreview(user?.profilePhoto || '');
    setMessage('');
  };

  useEffect(() => {
    if (user) {
      resetForm();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowCountrySuggestions(false);
      setShowTimezoneSuggestions(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'username') {
      processedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    setForm((prev) => ({ ...prev, [name]: processedValue }));

    // Filter countries when typing in country field
    if (name === 'country') {
      if (value.length > 0) {
        const filtered = COUNTRIES.filter(country =>
          country.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCountries(filtered);
        setShowCountrySuggestions(true);
      } else {
        setFilteredCountries([]);
        setShowCountrySuggestions(false);
      }
    }

    // Filter timezones when typing in timezone field
    if (name === 'timezone') {
      if (value.length > 0) {
        const filtered = TIMEZONES.filter(tz =>
          tz.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredTimezones(filtered);
        setShowTimezoneSuggestions(true);
      } else {
        setFilteredTimezones([]);
        setShowTimezoneSuggestions(false);
      }
    }
  };

  const handleSelectCountry = (country) => {
    setForm((prev) => ({ ...prev, country }));
    setFilteredCountries([]);
    setShowCountrySuggestions(false);
  };

  const handleSelectTimezone = (timezone) => {
    setForm((prev) => ({ ...prev, timezone }));
    setFilteredTimezones([]);
    setShowTimezoneSuggestions(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({ ...prev, profilePhoto: reader.result }));
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await api.put('/users/me', form);
      login(localStorage.getItem('token'), res.data);
      setMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/${user.username}`;
    const shareData = {
      title: `${user.name}'s Profile - Skill Swap`,
      text: `Check out ${user.name}'s profile on Skill Swap!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setMessage('Profile link copied to clipboard!');
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        console.error('Failed to copy:', err);
        setMessage('Failed to copy link');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-slate-100">Profile</h1>
        {!isEditing && (
          <div className="flex space-x-2">
            {user.username && (
              <button
                className="btn-secondary"
                onClick={handleShare}
              >
                Share Profile
              </button>
            )}
            <button
              className="btn-primary"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center space-x-4">
          <img src={preview || '/default-avatar.png'} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">{user.name}</p>
            <p className="text-sm text-gray-600 dark:text-slate-400">{user.email}</p>
            <p className="text-sm text-gray-600 dark:text-slate-400">@{user.username}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-slate-400">Bio</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-slate-200">{user.bio || 'No bio added yet.'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-slate-400">Country</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-slate-200">{user.country || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-slate-400">Timezone</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-slate-200">{user.timezone || 'UTC'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-slate-400">Language</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-slate-200">{user.languagePreference || 'English'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500 dark:text-slate-400">Gender</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-slate-200">{user.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : 'Not specified'}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 break-all">User ID: {formatUserId(user._id || user.id)}</p>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div className="flex items-center space-x-4">
            <img src={preview || '/default-avatar.png'} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">Profile Picture</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm text-gray-600 dark:text-slate-400" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">Name</label>
            <input className="input" name="name" value={form.name} onChange={handleChange} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">Username</label>
            <input className="input" name="username" value={form.username} onChange={handleChange} placeholder="lowercase letters, numbers, underscores only" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">Bio</label>
            <textarea
              className="input min-h-[80px]"
              name="bio"
              value={form.bio}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">Country</label>
            <div className="relative">
              <input
                className="input"
                name="country"
                value={form.country}
                onChange={handleChange}
                onFocus={() => form.country && setShowCountrySuggestions(true)}
                placeholder="Your country"
              />
              {showCountrySuggestions && filteredCountries.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredCountries.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => handleSelectCountry(country)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-100 transition"
                    >
                      {country}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">Timezone</label>
            <div className="relative">
              <input
                className="input"
                name="timezone"
                value={form.timezone}
                onChange={handleChange}
                onFocus={() => form.timezone && setShowTimezoneSuggestions(true)}
                placeholder="e.g. Asia/Kolkata"
              />
              {showTimezoneSuggestions && filteredTimezones.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredTimezones.map((tz) => (
                    <button
                      key={tz}
                      type="button"
                      onClick={() => handleSelectTimezone(tz)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-100 transition"
                    >
                      {tz}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">Preferred language</label>
            <select
              className="input"
              name="languagePreference"
              value={form.languagePreference}
              onChange={handleChange}
            >
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">Gender</label>
            <select
              className="input"
              name="gender"
              value={form.gender}
              onChange={handleChange}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
          </div>
          {message && <p className="text-sm text-gray-600 dark:text-slate-400">{message}</p>}
        </form>
      )}
    </div>
  );
};

export default ProfilePage;

