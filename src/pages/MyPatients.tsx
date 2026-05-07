import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Search,
  MessageSquare,
  ChevronRight,
  HeartPulse,
  LayoutDashboard
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function MyPatients() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'approved' | 'requests'>('approved');
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile) {
      if (!profile.is_professional) {
        navigate('/profile');
        return;
      }
      fetchData();
    }
  }, [profile]);

  async function fetchData() {
    if (!profile) return;
    setLoading(true);
    try {
      // Fetch accepted patients
      const { data: acceptedData, error: accError } = await supabase
        .from('patients')
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url, bio, birth_date, province)
        `)
        .eq('professional_id', profile.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (accError) throw accError;
      setPatients(acceptedData || []);

      // Fetch pending requests
      const { data: pendingData, error: penError } = await supabase
        .from('patients')
        .select(`
          *,
          profiles:user_id (id, username, full_name, avatar_url, bio, birth_date, province)
        `)
        .eq('professional_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (penError) throw penError;
      setRequests(pendingData || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (requestId: string, action: 'accept' | 'reject' | 'remove') => {
    try {
      if (action === 'remove' && !confirm('Tem a certeza que deseja remover este paciente?')) return;
      if (action === 'reject' && !confirm('Tem a certeza que deseja recusar esta solicitação?')) return;

      if (action === 'accept') {
        const { data: patientRel, error: updateError } = await supabase
          .from('patients')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', requestId)
          .select('user_id, professional_id')
          .single();
        
        if (updateError) throw updateError;

        // Automatically follow when becoming a patient
        if (patientRel) {
          await supabase.from('professional_followers').upsert({
             follower_id: patientRel.user_id,
             professional_id: patientRel.professional_id
          });
        }
      } else {
        const { error } = await supabase
          .from('patients')
          .delete()
          .eq('id', requestId);
        if (error) throw error;
      }
      fetchData();
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Erro ao processar solicitação.');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.profiles.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = requests.filter(r => 
    r.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.profiles.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading) return null;

  return (
    <div className="pb-20 min-h-screen bg-[#f8fafc]">
      <Header />
      
      <div className="max-w-4xl mx-auto pt-6 px-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2.5 bg-white text-gray-400 rounded-2xl shadow-sm hover:text-[#006747] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 leading-none">Gestão de Pacientes</h1>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Área Profissional</p>
            </div>
          </div>
          
          <Link 
            to="/professional/dashboard"
            className="flex items-center space-x-2 bg-emerald-50 text-[#006747] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou nome de utilizador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-none rounded-[2rem] py-4 pl-12 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 bg-white p-1.5 rounded-[2rem] shadow-sm mb-8 border border-gray-100">
          <button
            onClick={() => setActiveTab('approved')}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'approved' 
                ? "bg-[#006747] text-white shadow-lg shadow-emerald-100" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Users className="w-4 h-4" />
            <span>Meus Pacientes</span>
            {patients.length > 0 && (
              <span className={cn(
                "ml-1.5 px-2 py-0.5 rounded-md text-[8px]",
                activeTab === 'approved' ? "bg-white/20" : "bg-gray-100"
              )}>
                {patients.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={cn(
              "flex-1 flex items-center justify-center space-x-2 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'requests' 
                ? "bg-[#006747] text-white shadow-lg shadow-emerald-100" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <UserPlus className="w-4 h-4" />
            <span>Solicitações</span>
            {requests.length > 0 && (
              <span className={cn(
                "ml-1.5 px-2 py-0.5 rounded-md text-[8px] animate-pulse",
                activeTab === 'requests' ? "bg-white/20" : "bg-red-50 text-red-500"
              )}>
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* List Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#006747] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400 text-sm font-medium">Carregando dados...</p>
            </div>
          ) : activeTab === 'approved' ? (
            filteredPatients.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredPatients.map(patient => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={patient.id}
                    className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between group hover:border-emerald-200 transition-all"
                  >
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <Link to={`/profile/${patient.user_id}`} className="relative group/avatar">
                        <img 
                          src={patient.profiles.avatar_url || `https://i.pravatar.cc/150?u=${patient.profiles.username}`} 
                          className="w-16 h-16 rounded-3xl object-cover shadow-sm group-hover:scale-105 transition-transform" 
                          alt="" 
                        />
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-xl p-1 border-4 border-white">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      </Link>
                      <div className="min-w-0">
                        <Link to={`/profile/${patient.user_id}`} className="block group/name">
                          <h3 className="font-black text-gray-900 group-hover/name:text-[#006747] transition-colors truncate">
                            {patient.profiles.full_name || patient.profiles.username}
                          </h3>
                        </Link>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">@{patient.profiles.username}</p>
                        <div className="flex items-center space-x-3 mt-1.5">
                           {patient.profiles.birth_date && (
                             <span className="text-[9px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-bold transition-all">
                               {new Date().getFullYear() - new Date(patient.profiles.birth_date).getFullYear()} anos
                             </span>
                           )}
                           {patient.profiles.province && (
                             <span className="text-[9px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-bold transition-all">
                               {patient.profiles.province}
                             </span>
                           )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                       <Link 
                         to={`/professional/clinical-history/${patient.user_id}`}
                         className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-emerald-50 text-[#006747] px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100/50"
                         title="História Clínica"
                       >
                          <HeartPulse className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">História Clínica</span>
                       </Link>
                       <Link 
                         to={`/profile/${patient.user_id}`}
                         className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gray-50 text-gray-600 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-[#006747] transition-all"
                       >
                          <User className="w-3.5 h-3.5" />
                          <span>Ver Perfil</span>
                       </Link>
                       <button 
                         onClick={() => handleAction(patient.id, 'remove')}
                         className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm shadow-red-100"
                         title="Remover Paciente"
                       >
                          <XCircle className="w-5 h-5" />
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] p-12 text-center border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Sem Pacientes</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8">
                  Ainda não tem pacientes na sua lista. As adesões confirmadas aparecerão aqui.
                </p>
              </div>
            )
          ) : (
            filteredRequests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredRequests.map(req => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={req.id}
                    className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between group hover:shadow-md transition-all"
                  >
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                      <Link to={`/profile/${req.user_id}`} className="relative group/avatar">
                        <img 
                          src={req.profiles.avatar_url || `https://i.pravatar.cc/150?u=${req.profiles.username}`} 
                          className="w-16 h-16 rounded-3xl object-cover shadow-sm group-hover/avatar:scale-105 transition-transform" 
                          alt="" 
                        />
                        <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-xl p-1 border-4 border-white animate-pulse">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                      </Link>
                      <div className="min-w-0">
                         <div className="flex items-center space-x-2">
                           <Link to={`/profile/${req.user_id}`} className="group/name">
                             <h3 className="font-black text-gray-900 group-hover/name:text-[#006747] transition-colors truncate">
                               {req.profiles.full_name || req.profiles.username}
                             </h3>
                           </Link>
                           <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Pendente</span>
                         </div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">@{req.profiles.username}</p>
                        <p className="text-[9px] text-gray-500 mt-2 italic line-clamp-1">"{req.profiles.bio || 'Interessado em ser seu paciente.'}"</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                       <button 
                         onClick={() => handleAction(req.id, 'reject')}
                         className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-red-50 text-red-500 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                       >
                          <XCircle className="w-4 h-4" />
                          <span>Recusar</span>
                       </button>
                       <button 
                         onClick={() => handleAction(req.id, 'accept')}
                         className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-[#006747] text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100"
                       >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aceitar</span>
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] p-12 text-center border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="w-10 h-10 text-emerald-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Sem Solicitações</h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  Não existem novos pedidos de pacientes para analisar neste momento.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
