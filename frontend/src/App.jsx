import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './state/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SkillsPage from './pages/SkillsPage.jsx';
import MatchesPage from './pages/MatchesPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import SessionsPage from './pages/SessionsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import HelpPage from "./pages/HelpPage";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-300">
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/help" element={<HelpPage />} />

      <Route
        path="/app"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        
      </Route>
    </Routes>
  );
};

export default App;

