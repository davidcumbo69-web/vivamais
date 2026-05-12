import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  CircleUser, 
  Search,
  MessageSquare,
  ChevronRight,
  HeartPulse,
  TrendingUp,
  LayoutDashboard,
  Brain,
  AlertCircle,
  History,
  Pill,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { cn, sanitizeAvatarUrl } from '../lib/utils';
import { Skeleton } from '../components/ui/Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService, AIEvolutionResult } from '../services/geminiService';

export default function MyPatients() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'approved' | 'requests'>('approved');
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // AI Evolution State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIEvolutionResult | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [analyzingPatient, setAnalyzingPatient] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      if (!profile.is_professional) {
        navigate('/perfil');
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

  const handleAnalyzeEvolution = async (patient: any) => {
    setAnalyzingPatient(patient);
    setIsAnalyzing(true);
    setAiResult(null);
    setShowAiModal(true);

    try {
      // Fetch patient's clinical history
      const { data: histories, error } = await supabase
        .from('clinical_histories')
        .select('*')
        .eq('patient_id', patient.user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!histories || histories.length === 0) {
        throw new Error('Nenhuma história clínica encontrada para este paciente.');
      }

      const result = await geminiService.analyzePatientEvolution(histories);
      setAiResult(result);
    } catch (error: any) {
      console.error('Error analyzing evolution:', error);
      alert(error.message || 'Erro ao analisar evolução do paciente.');
      setShowAiModal(false);
    } finally {
      setIsAnalyzing(false);
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
            <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 flex items-center space-x-6">
                    <Skeleton className="w-16 h-16 rounded-3xl shrink-0" />
                    <div className="flex-1 space-y-3">
                         <Skeleton className="h-6 w-1/3" />
                         <Skeleton className="h-3 w-20" />
                         <div className="flex space-x-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                         </div>
                    </div>
                    <div className="flex space-x-2 hidden sm:flex">
                        <Skeleton className="w-24 h-10 rounded-2xl" />
                        <Skeleton className="w-24 h-10 rounded-2xl" />
                    </div>
                  </div>
                ))}
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
                      <Link to={`/perfil/${patient.user_id}`} className="relative group/avatar">
                        <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform bg-gray-50 flex items-center justify-center">
                          {sanitizeAvatarUrl(patient.profiles.avatar_url) ? (
                            <img 
                              src={sanitizeAvatarUrl(patient.profiles.avatar_url)!} 
                              className="w-full h-full object-cover" 
                              alt="" 
                            />
                          ) : (
                            <CircleUser className="w-full h-full text-black stroke-[1px] p-2" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-xl p-1 border-4 border-white">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      </Link>
                      <div className="min-w-0">
                        <Link to={`/perfil/${patient.user_id}`} className="block group/name">
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
                       <button 
                         onClick={() => handleAnalyzeEvolution(patient)}
                         className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-purple-50 text-purple-700 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all border border-purple-100/50"
                         title="Análise de Evolução IA"
                       >
                          <Brain className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Análise IA</span>
                       </button>
                       <Link 
                         to={`/professional/clinical-history/${patient.user_id}`}
                         className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-emerald-50 text-[#006747] px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100/50"
                         title="História Clínica"
                       >
                          <HeartPulse className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">História Clínica</span>
                       </Link>
                       <Link 
                         to={`/perfil/${patient.user_id}`}
                         className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gray-50 text-gray-600 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-[#006747] transition-all"
                       >
                          <CircleUser className="w-3.5 h-3.5 text-black stroke-[1.5px]" />
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
                      <Link to={`/perfil/${req.user_id}`} className="relative group/avatar">
                        <div className="w-16 h-16 rounded-3xl overflow-hidden shadow-sm group-hover/avatar:scale-105 transition-transform bg-gray-50 flex items-center justify-center">
                          {sanitizeAvatarUrl(req.profiles.avatar_url) ? (
                            <img 
                              src={sanitizeAvatarUrl(req.profiles.avatar_url)!} 
                              className="w-full h-full object-cover" 
                              alt="" 
                            />
                          ) : (
                            <CircleUser className="w-full h-full text-black stroke-[1px] p-2" />
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-xl p-1 border-4 border-white animate-pulse">
                          <Clock className="w-3 h-3 text-white" />
                        </div>
                      </Link>
                      <div className="min-w-0">
                         <div className="flex items-center space-x-2">
                           <Link to={`/perfil/${req.user_id}`} className="group/name">
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

      {/* AI Evolution Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isAnalyzing && setShowAiModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 max-h-[80vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-100 rounded-2xl">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 leading-none">Evolução do Paciente</h2>
                      <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest mt-1">Análise por Inteligência Artificial</p>
                    </div>
                  </div>
                  {!isAnalyzing && (
                    <button
                      onClick={() => setShowAiModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  )}
                </div>

                {isAnalyzing ? (
                  <div className="py-20 text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 border-4 border-purple-100 rounded-full" />
                      <div className="absolute inset-0 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <Brain className="absolute inset-0 m-auto w-8 h-8 text-purple-600 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">Analisando Histórico...</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">
                      A processar todos os registos clínicos do paciente para identificar padrões e tendências.
                    </p>
                  </div>
                ) : aiResult && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Identification */}
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-sm">
                        {sanitizeAvatarUrl(analyzingPatient?.profiles?.avatar_url) ? (
                          <img 
                            src={sanitizeAvatarUrl(analyzingPatient.profiles.avatar_url)!} 
                            className="w-full h-full object-cover" 
                            alt="" 
                          />
                        ) : (
                          <CircleUser className="w-full h-full text-black stroke-[1px] p-1" />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Paciente</p>
                        <p className="text-sm font-black text-gray-900">{analyzingPatient?.profiles?.full_name}</p>
                      </div>
                    </div>

                    {/* Summary */}
                    <section>
                      <div className="flex items-center space-x-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-[#006747]" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#006747]">Resumo da Evolução</h4>
                      </div>
                      <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 text-sm leading-relaxed text-gray-700">
                        {aiResult.summary}
                      </div>
                    </section>

                    {/* Medications & Exams */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-4">
                          <Pill className="w-4 h-4 text-rose-600" />
                          <h4 className="text-xs font-black uppercase tracking-widest text-rose-600">Últimas Medicações</h4>
                        </div>
                        <ul className="space-y-2">
                          {(aiResult.lastMedications ?? []).length > 0 ? (
                            aiResult.lastMedications.map((med, idx) => (
                              <li key={idx} className="flex items-start space-x-2 p-3 bg-rose-50/30 rounded-xl border border-rose-50">
                                <div className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-1.5 flex-shrink-0" />
                                <span className="text-[11px] font-bold text-gray-700 leading-tight">{med}</span>
                              </li>
                            ))
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">Nenhuma medicação identificada.</p>
                          )}
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-4">
                          <FileText className="w-4 h-4 text-amber-600" />
                          <h4 className="text-xs font-black uppercase tracking-widest text-amber-600">Exames Realizados</h4>
                        </div>
                        <ul className="space-y-2">
                          {(aiResult.lastExams ?? []).length > 0 ? (
                            aiResult.lastExams.map((exam, idx) => (
                              <li key={idx} className="flex items-start space-x-2 p-3 bg-amber-50/30 rounded-xl border border-amber-50">
                                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />
                                <span className="text-[11px] font-bold text-gray-700 leading-tight">{exam}</span>
                              </li>
                            ))
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">Nenhum exame identificado.</p>
                          )}
                        </ul>
                      </div>
                    </section>

                    {/* Patterns & Trends */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-4">
                          <History className="w-4 h-4 text-purple-600" />
                          <h4 className="text-xs font-black uppercase tracking-widest text-purple-600">Padrões Identificados</h4>
                        </div>
                        <ul className="space-y-2">
                          {(aiResult.patterns ?? []).map((pattern, idx) => (
                            <li key={idx} className="flex items-start space-x-2 p-3 bg-purple-50/30 rounded-xl border border-purple-50">
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                              <span className="text-[11px] font-bold text-gray-700 leading-tight">{pattern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-4">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Tendências Críticas</h4>
                        </div>
                        <ul className="space-y-2">
                          {(aiResult.trends ?? []).map((trend, idx) => (
                            <li key={idx} className="flex items-start space-x-2 p-3 bg-blue-50/30 rounded-xl border border-blue-50">
                              <AlertCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-[11px] font-bold text-gray-700 leading-tight">{trend}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>

                    {/* Recommendations */}
                    <section className="p-6 bg-red-50/30 rounded-3xl border border-red-100">
                      <div className="flex items-center space-x-2 mb-4">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-red-600">Conduta Recomendada</h4>
                      </div>
                      <ul className="space-y-3">
                        {(aiResult.recommendations ?? []).map((rec, idx) => (
                          <li key={idx} className="flex items-start space-x-3 text-sm text-gray-700 leading-relaxed">
                            <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-[10px] font-black text-red-700">{idx + 1}</span>
                            </div>
                            <span className="font-bold">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <button
                      onClick={() => setShowAiModal(false)}
                      className="w-full py-4 bg-[#006747] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100"
                    >
                      Entendido
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
