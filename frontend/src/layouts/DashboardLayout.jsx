import React, { useEffect, useState, useRef } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import { useTheme } from "../state/ThemeContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import logo from "../assets/logo.png";

const navItems = [
  { to: "/app", label: "Dashboard" },
  { to: "/app/skills", label: "Skills" },
  { to: "/app/matches", label: "Matches" },
  { to: "/app/chat", label: "Chat" },
  { to: "/app/sessions", label: "Sessions" },
  { to: "/app/notifications", label: "Notifications" },
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  /* CLOSE DROPDOWN */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-64 p-4 transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <Link
          to="/app"
          className="flex items-center gap-3 mb-8"
          onClick={() => setSidebarOpen(false)}
        >
          <img
            src={logo}
            alt="Skill Swap Logo"
            className="h-12 w-12 rounded-full border-2 border-indigo-500 object-cover"
          />

          <span className="text-xl font-semibold tracking-wide">
            SkillSwap
          </span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/app"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-base font-medium transition-all ${
                  isActive
                    ? "text-white shadow"
                    : "hover:opacity-80"
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--text-accent)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-secondary)',
                ':hover': {
                  backgroundColor: isActive ? 'var(--text-accent)' : 'var(--bg-hover)'
                }
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex flex-1 flex-col">

        {/* HEADER */}
        <header
          className="flex items-center justify-between px-4 py-3"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)'
          }}
        >

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-xl"
          >
            ☰
          </button>

          <div className="flex items-center gap-3 ml-auto">

            {/* THEME TOGGLE */}
            <ThemeToggle />

            {/* PROFILE */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 transition"
                  style={{
                    color: 'var(--text-primary)'
                  }}
                >
                  <img
                    src={
                      user.profilePhoto ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user.name
                      )}`
                    }
                    alt={user.name}
                    className="h-8 w-8 rounded-full border border-slate-700"
                  />

                  <span className="text-sm">{user.name}</span>
                </button>

                {/* DROPDOWN */}
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-44 rounded-lg shadow-lg overflow-hidden"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-primary)',
                      boxShadow: '0 10px 15px -3px var(--shadow-primary)'
                    }}
                  >

                    <Link
                      to="/app/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 transition"
                      style={{
                        color: 'var(--text-primary)'
                      }}
                    >
                      👤 Profile
                    </Link>


                    <Link
                      to="/help"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 transition"
                      style={{
                        color: 'var(--text-primary)'
                      }}
                    >
                      ❓ Help
                    </Link>

                    <div style={{ borderColor: 'var(--border-primary)' }} className="border-t" />

                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 transition"
                      style={{
                        color: '#ef4444' // red color for logout
                      }}
                    >
                      🚪 Logout
                    </button>

                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* PAGE */}
        <main className="flex-1 p-4 md:p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default DashboardLayout;