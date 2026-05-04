/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/layout/Navbar';
import Home from './pages/Home';
import Reels from './pages/Reels';
import Marketplace from './pages/Marketplace';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import ProfessionalSettings from './pages/ProfessionalSettings';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import Gamification from './pages/Gamification';
import CommunityDetail from './pages/CommunityDetail';
import Appointments from './pages/Appointments';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import Login from './pages/Login';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#dae0e6]">
        <div className="flex flex-col items-center">
           <h1 className="text-4xl font-bold text-[#006747] animate-pulse">VIVA+</h1>
           <div className="mt-4 w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#006747] animate-progress w-full" />
           </div>
        </div>
      </div>
    );
  }

  // If not logged in, show login page
  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#dae0e6] flex flex-col md:flex-row">
      <Navbar />
      <main className="flex-1 md:ml-20 lg:ml-64 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/gamification" element={<Gamification />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
          <Route path="/c/:name" element={<CommunityDetail />} />
          <Route path="/professional/settings" element={<ProfessionalSettings />} />
          <Route path="/explore" element={<Home />} /> {/* Mock redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

