/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AlertProvider } from './hooks/useAlert';
import { Navbar } from './components/layout/Navbar';
import Home from './pages/Home';
import Reels from './pages/Reels';
import Marketplace from './pages/Marketplace';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import ProfessionalSettings from './pages/ProfessionalSettings';
import Professionals from './pages/Professionals';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import Gamification from './pages/Gamification';
import CommunityDetail from './pages/CommunityDetail';
import Appointments from './pages/Appointments';
import Messages from './pages/Messages';
import CreatePrescription from './pages/CreatePrescription';
import CreateClinicalHistory from './pages/CreateClinicalHistory';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import MyPatients from './pages/MyPatients';
import MyPrescriptions from './pages/MyPrescriptions';
import DigitalPrescriptionView from './pages/PrescriptionVerification';
import PrescriptionSearch from './pages/PrescriptionSearch';
import EditProfile from './pages/EditProfile';
import Login from './pages/Login';
import { cn } from './lib/utils';

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();

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

  // If not logged in and not on verification page, show login page
  const isPublicRoute = location.pathname === '/verificar' || 
                       location.pathname.startsWith('/verificar-receita/');

  if (!user && !isPublicRoute) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#dae0e6] flex flex-col md:flex-row">
      {user && <Navbar />}
      <main className={cn("flex-1 overflow-y-auto", user && "md:ml-20 lg:ml-64")}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/loja-viva" element={<Marketplace />} />
          <Route path="/minhas-encomendas" element={<MyOrders />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/perfil/editar" element={<EditProfile />} />
          <Route path="/perfil/:userId" element={<Profile />} />
          <Route path="/definicoes" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/conquistas" element={<Gamification />} />
          <Route path="/consultas" element={<Appointments />} />
          <Route path="/mensagens" element={<Messages />} />
          <Route path="/prescrever/:patientId" element={<CreatePrescription />} />
          <Route path="/professional/clinical-history/:patientId" element={<CreateClinicalHistory />} />
          <Route path="/historico-receitas" element={<MyPrescriptions />} />
          <Route path="/professional/dashboard" element={<ProfessionalDashboard />} />
          <Route path="/professional/patients" element={<MyPatients />} />
          <Route path="/verificar" element={<PrescriptionSearch />} />
          <Route path="/verificar-receita/:id" element={<DigitalPrescriptionView />} />
          <Route path="/c/:name" element={<CommunityDetail />} />
          <Route path="/profissionais" element={<Professionals />} />
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
      <AlertProvider>
        <Router>
          <AppContent />
        </Router>
      </AlertProvider>
    </AuthProvider>
  );
}

