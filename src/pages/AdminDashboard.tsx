import React, { useEffect, useState } from 'react';
import { supabase, type ProfessionalVerification, type Post } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  MessageSquare,
  Loader2,
  AlertCircle,
  Search,
  Play,
  Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<ProfessionalVerification[]>([]);
  const [pendingReels, setPendingReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'reels'>('users');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  // Check if admin
  const isAdmin = profile?.email === 'davidcumbo69@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'users') {
        fetchRequests();
      } else {
        fetchReels();
      }
    }
  }, [isAdmin, filter, activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error: reqError } = await supabase
      .from('professional_verifications')
      .select('*, profiles(*)')
      .eq('status', filter)
      .order('created_at', { ascending: false });

    if (reqError) {
      setError(reqError.message);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const fetchReels = async () => {
    setLoading(true);
    const { data, error: reelError } = await supabase
      .from('reels')
      .select('*, profiles(*)')
      .eq('is_approved', filter === 'approved')
      .order('created_at', { ascending: false });

    if (reelError) {
      setError(reelError.message);
    } else {
      setPendingReels(data || []);
    }
    setLoading(false);
  };

  const handleAction = async (request: ProfessionalVerification, action: 'approved' | 'rejected', notes?: string) => {
    // Security check: Only davidcumbo69@gmail.com can perform these actions
    if (profile?.email !== 'davidcumbo69@gmail.com') {
      showNotification('⚠️ Ação não permitida para a sua conta.', 'error');
      return;
    }

    setProcessingId(request.id);
    try {
      // 1. Update verification record
      const { error: updateError } = await supabase
        .from('professional_verifications')
        .update({ 
          status: action,
          admin_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // 2. If approved, update profile and professional record
      if (action === 'approved') {
        // Update Profile - Ensure is_professional becomes TRUE
        const { error: profError } = await supabase
          .from('profiles')
          .update({
            is_professional: true, // This is the critical part requested
            is_verified: true,
            specialty: request.specialty,
            license_number: request.license_number
          })
          .eq('id', request.user_id);
        
        if (profError) throw profError;

        // Upsert Health Professional entry
        const { error: healthError } = await supabase
          .from('health_professionals')
          .upsert({
            id: request.user_id,
            professional_order: request.professional_order,
            license_number: request.license_number,
            workplace_name: request.workplace_name,
            workplace_address: request.workplace_address,
            specialty: request.specialty,
            academic_degree: request.academic_degree,
            phone_business: request.phone_business,
            image_url: request.image_url,
            is_verified: true,
            verified_at: new Date().toISOString()
          });

        if (healthError) throw healthError;
      }

      // Refresh data
      fetchRequests();
      if (action === 'approved') {
        showNotification('✅ Profissional aprovado! A conta agora tem permissões de especialista (is_professional = TRUE).');
      } else if (action === 'rejected') {
        showNotification('❌ Pedido de verificação rejeitado.', 'success');
      }
    } catch (err: any) {
      console.error('Error in handleAction:', err);
      showNotification(err.message || 'Erro inesperado ao processar ação.', 'error');
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReelAction = async (reelId: string, approved: boolean) => {
    // Security check: Only davidcumbo69@gmail.com can perform these actions
    if (profile?.email !== 'davidcumbo69@gmail.com') {
      showNotification('⚠️ Ação não permitida para a sua conta.', 'error');
      return;
    }

    setProcessingId(reelId);
    try {
      if (approved) {
        const { error } = await supabase
          .from('reels')
          .update({ is_approved: true })
          .eq('id', reelId);
        if (error) throw error;
        showNotification('✅ Reel aprovado com sucesso!');
      } else {
        const { error } = await supabase
          .from('reels')
          .delete()
          .eq('id', reelId);
        if (error) throw error;
        showNotification('❌ Reel eliminado.', 'success');
      }
      fetchReels();
    } catch (err: any) {
      showNotification(err.message || 'Erro ao processar reel.', 'error');
      setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold">Acesso Negado</h1>
        <p className="text-gray-500 max-w-sm">Esta área é restrita a administradores da plataforma VIVA+.</p>
        <a href="/" className="mt-6 text-[#006747] font-bold">Voltar para a Home</a>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-[#dae0e6]">
      <Header />
      
      <div className="max-w-6xl mx-auto pt-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <ShieldCheck className="w-7 h-7 mr-2 text-[#006747]" />
              Painel de Gestão VIVA+
            </h1>
            <p className="text-gray-400 text-sm mt-1">Moderação de profissionais e conteúdos da plataforma.</p>
          </div>

          <div className="flex space-x-2">
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                    activeTab === 'users' 
                      ? 'bg-[#006747] text-white shadow-md' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Profissionais</span>
                </button>
                <button
                  onClick={() => setActiveTab('reels')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                    activeTab === 'reels' 
                      ? 'bg-[#006747] text-white shadow-md' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Reels</span>
                </button>
            </div>

            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
               {(['pending', 'approved', 'rejected'] as const).map((s) => (
                 <button
                   key={s}
                   onClick={() => setFilter(s)}
                   className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                     filter === s 
                      ? 'bg-[#006747] text-white shadow-md' 
                      : 'text-gray-400 hover:text-gray-600'
                   }`}
                 >
                   {s === 'pending' ? 'Pendentes' : s === 'approved' ? 'Aprovados' : 'Rejeitados'}
                 </button>
               ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#006747] mb-2" />
            <p className="text-gray-400 text-sm">A carregar dados...</p>
          </div>
        ) : (activeTab === 'users' ? requests : pendingReels).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Não existem itens {filter === 'pending' ? 'pendentes' : filter === 'approved' ? 'aprovados' : 'rejeitados'}.</p>
          </div>
        ) : activeTab === 'users' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {requests.map((req) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 bg-gray-50">
                          <img src={req.image_url || req.profiles?.avatar_url || 'https://i.pravatar.cc/150'} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{req.profiles?.full_name || req.profiles?.username}</h3>
                          <p className="text-xs text-gray-400">{req.profiles?.email}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                        req.status === 'approved' ? 'bg-green-50 text-green-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {req.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Ordem</p>
                        <p className="text-sm font-semibold">{req.professional_order}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Cédula</p>
                        <p className="text-sm font-semibold">{req.license_number}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Especialidade</p>
                        <p className="text-sm font-semibold">{req.specialty}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Grau</p>
                        <p className="text-sm font-semibold">{req.academic_degree}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4">
                      <div className="flex items-center text-xs text-gray-500 italic">
                        <MessageSquare className="w-3 h-3 mr-2" />
                        <span>Informações Adicionais:</span>
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        Local: {req.workplace_name} ({req.workplace_address})
                      </p>
                      {req.phone_business && (
                        <p className="text-xs text-gray-500">Tel: {req.phone_business}</p>
                      )}
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center space-x-3 mt-auto">
                      <button
                        onClick={() => handleAction(req, 'approved')}
                        disabled={!!processingId}
                        className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-100 disabled:opacity-50"
                      >
                        {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Aprovar</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Motivo da rejeição (opcional):');
                          handleAction(req, 'rejected', notes || undefined);
                        }}
                        disabled={!!processingId}
                        className="flex-1 bg-white text-red-600 border border-red-100 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center space-x-2 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Rejeitar</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {pendingReels.map((reel) => (
                <motion.div
                  key={reel.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm flex flex-col"
                >
                  <div className="relative aspect-[9/16] bg-black">
                     <video src={reel.video_url} className="w-full h-full object-cover" />
                     <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <p className="text-white text-xs line-clamp-2">{reel.caption}</p>
                     </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                     <div className="flex items-center space-x-3 mb-4">
                        <img 
                          src={reel.profiles?.avatar_url || 'https://i.pravatar.cc/150'} 
                          className="w-10 h-10 rounded-full border border-gray-200" 
                          alt="" 
                        />
                        <div>
                           <p className="text-sm font-bold">{reel.profiles?.username}</p>
                           <p className="text-[10px] text-gray-400">{new Date(reel.created_at).toLocaleDateString()}</p>
                        </div>
                     </div>

                     <div className="flex items-center space-x-2 mt-auto">
                        {!reel.is_approved ? (
                          <>
                            <button
                               onClick={() => handleReelAction(reel.id, true)}
                               disabled={!!processingId}
                               className="flex-1 bg-[#006747] text-white py-3 rounded-xl text-xs font-bold hover:bg-emerald-800 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-50"
                            >
                               {processingId === reel.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                               <span>Aprovar</span>
                            </button>
                            <button
                               onClick={() => handleReelAction(reel.id, false)}
                               disabled={!!processingId}
                               className="px-4 bg-red-50 text-red-600 rounded-xl py-3 text-xs font-bold hover:bg-red-100 transition-all"
                            >
                               <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleReelAction(reel.id, false)}
                            className="w-full bg-gray-50 text-gray-400 py-3 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                             Eliminar Reel Aprovado
                          </button>
                        )}
                     </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center space-x-3 px-6 py-4 rounded-3xl shadow-2xl backdrop-blur-md border ${
              notification.type === 'success' 
                ? 'bg-emerald-900/90 border-emerald-500/30 text-emerald-50' 
                : 'bg-red-900/90 border-red-500/30 text-red-50'
            }`}
          >
            <div className={`p-2 rounded-xl ${
              notification.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Gestão VIVA+</p>
              <p className="text-sm font-bold tracking-tight">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
