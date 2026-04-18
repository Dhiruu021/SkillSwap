import React, { useEffect, useState, useRef } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
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

  const [dark, setDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuRef = useRef(null);

  /* THEME */
  useEffect(() => {
    const root = document.documentElement;

    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

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
    <div className="flex min-h-screen bg-slate-950 text-slate-100">

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed md:static z-50 top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 p-4 transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
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
                    ? "bg-indigo-500 text-white shadow"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`
              }
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
          className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800"
        >

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-xl"
          >
            ☰
          </button>

          <div className="flex items-center gap-3 ml-auto">

            {/* PROFILE */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 transition text-slate-100 hover:text-slate-300"
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
                    className="absolute right-0 mt-2 w-44 rounded-lg shadow-lg overflow-hidden bg-slate-800 border border-slate-700"
                  >

                    <Link
                      to="/app/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 transition text-slate-100 hover:bg-slate-700"
                    >
                      👤 Profile
                    </Link>


                    <Link
                      to="/help"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 transition text-slate-100 hover:bg-slate-700"
                    >
                      ❓ Help
                    </Link>

                    <div className="border-t border-slate-600" />

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
        <main className="flex-1 p-4 md:p-6 bg-slate-950">
          <Outlet />
        </main>

      </div>
    </div>
  );
};

export default DashboardLayout;