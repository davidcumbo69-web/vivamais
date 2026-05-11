/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AlertProvider } from './hooks/useAlert';
import { Navbar } from './components/layout/Navbar';
import { cn } from './lib/utils';

// Optimized Lazy Imports (Code Splitting)
const Home = lazy(() => import('./pages/Home'));
const Reels = lazy(() => import('./pages/Reels'));
const Marketplace = lazy(() => import('./pages/OptimizedMarketplace'));
const MyOrders = lazy(() => import('./pages/MyOrders'));
const Profile = lazy(() => import('./pages/Profile'));
const ProfessionalSettings = lazy(() => import('./pages/ProfessionalSettings'));
const Professionals = lazy(() => import('./pages/Professionals'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Gamification = lazy(() => import('./pages/Gamification'));
const CommunityDetail = lazy(() => import('./pages/CommunityDetail'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Messages = lazy(() => import('./pages/Messages'));
const CreatePrescription = lazy(() => import('./pages/CreatePrescription'));
const CreateClinicalHistory = lazy(() => import('./pages/CreateClinicalHistory'));
const ProfessionalDashboard = lazy(() => import('./pages/ProfessionalDashboard'));
const MyPatients = lazy(() => import('./pages/MyPatients'));
const MyPrescriptions = lazy(() => import('./pages/MyPrescriptions'));
const DigitalPrescriptionView = lazy(() => import('./pages/PrescriptionVerification'));
const PrescriptionSearch = lazy(() => import('./pages/PrescriptionSearch'));
const EditProfile = lazy(() => import('./pages/EditProfile'));
const Login = lazy(() => import('./pages/Login'));

const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center p-20">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 border-4 border-[#006747]/20 border-t-[#006747] rounded-full animate-spin" />
    </div>
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
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

