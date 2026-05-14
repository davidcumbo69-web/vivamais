import React, { useEffect, useState } from 'react';
import { supabase, type ProfessionalVerification, type Post, type PostVideo, type Reel } from '../lib/supabase';
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
  FileText,
  Eye,
  Megaphone,
  Plus,
  Image as ImageIcon,
  Trash2,
  Layout,
  CircleUser,
  Store,
  MapPin,
  Phone,
  Building2
} from 'lucide-react';
import { sanitizeAvatarUrl } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<ProfessionalVerification[]>([]);
  const [pendingReels, setPendingReels] = useState<Reel[]>([]);
  const [pendingVideos, setPendingVideos] = useState<PostVideo[]>([]);
  const [pharmaciesReq, setPharmaciesReq] = useState<any[]>([]);
  const [establishmentsReq, setEstablishmentsReq] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'reels' | 'ads' | 'videos' | 'pharmacies' | 'establishments'>('users');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAddAd, setShowAddAd] = useState(false);
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    target_category: 'Geral',
    ad_type: 'image',
    display_location: 'all'
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  // Check if admin - Use both user.email and profile.email for reliability
  const isAdmin = user?.email === 'davidcumbo69@gmail.com' || profile?.email === 'davidcumbo69@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      console.log('[AdminDashboard] Admin detected. Tab:', activeTab, 'Filter:', filter);
      if (activeTab === 'users') {
        fetchRequests();
      } else if (activeTab === 'reels') {
        fetchReels();
      } else if (activeTab === 'videos') {
        fetchVideos();
      } else if (activeTab === 'pharmacies') {
        fetchPharmacies();
      } else if (activeTab === 'establishments') {
        fetchEstablishments();
      } else {
        fetchAds();
      }
    } else if (user) {
      console.warn('[AdminDashboard] User is not an admin:', user.email);
    }
  }, [isAdmin, filter, activeTab, user]);

  const fetchAds = async () => {
    setLoading(true);
    const { data, error: adError } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (adError) {
      showNotification(adError.message, 'error');
    } else {
      setAds(data || []);
    }
    setLoading(false);
  };

  const handleCreateAd = async () => {
    if (!newAd.title) return showNotification('Título é obrigatório', 'error');
    
    setProcessingId('new-ad');
    try {
      const { error } = await supabase.from('ads').insert([newAd]);
      if (error) throw error;
      
      showNotification('✅ Anúncio criado com sucesso!');
      setShowAddAd(false);
      setNewAd({
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        target_category: 'Geral',
        ad_type: 'image',
        display_location: 'all'
      });
      fetchAds();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleAdStatus = async (adId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ is_active: !currentStatus })
        .eq('id', adId);
      if (error) throw error;
      fetchAds();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!confirm('Tem certeza?')) return;
    try {
      const { error } = await supabase.from('ads').delete().eq('id', adId);
      if (error) throw error;
      fetchAds();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleAdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingId('uploading');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `ads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('ad-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('ad-images').getPublicUrl(filePath);
      setNewAd(prev => ({ ...prev, image_url: data.publicUrl }));
      showNotification('Imagem carregada!');
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

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

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { data, error: videoError } = await supabase
        .from('post_videos')
        .select('*, profiles(*)')
        .eq('is_approved', filter === 'approved')
        .order('created_at', { ascending: false });

      if (videoError) {
        setError(videoError.message);
      } else {
        setPendingVideos(data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPharmacies = async () => {
    setLoading(true);
    console.log('[AdminDashboard] Fetching pharmacies with filter:', filter);
    
    try {
      // First, try to fetch just the pharmacies to confirm they exist
      const { data: rawData, error: rawError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('status', filter);
      
      console.log('[AdminDashboard] RAW Pharmacies data (no join):', rawData, 'Error:', rawError);

      // Now fetch with join
      const { data, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select(`
          *,
          profiles:owner_id (
            id,
            username,
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('status', filter)
        .order('created_at', { ascending: false });

      if (pharmacyError) {
        console.error('[AdminDashboard] Error fetching pharmacies (with join):', pharmacyError);
        setError(pharmacyError.message);
        showNotification('Erro ao carregar farmácias: ' + pharmacyError.message, 'error');
      } else {
        console.log('[AdminDashboard] Pharmacies fetched with profile join:', data);
        setPharmaciesReq(data || []);
      }
    } catch (err: any) {
      console.error('[AdminDashboard] Unexpected error in fetchPharmacies:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePharmacyAction = async (pharmacyId: string, action: 'approved' | 'rejected') => {
    if (profile?.email !== 'davidcumbo69@gmail.com') {
      showNotification('⚠️ Ação não permitida.', 'error');
      return;
    }

    setProcessingId(pharmacyId);
    try {
      const { error } = await supabase
        .from('pharmacies')
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq('id', pharmacyId);

      if (error) throw error;
      showNotification(`✅ Farmácia ${action === 'approved' ? 'aprovada' : 'rejeitada'}!`);
      fetchPharmacies();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const fetchEstablishments = async () => {
    setLoading(true);
    try {
      const { data, error: estError } = await supabase
        .from('medical_establishments')
        .select('*, profiles:owner_id(*)')
        .eq('status', filter)
        .order('created_at', { ascending: false });

      if (estError) throw estError;
      setEstablishmentsReq(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEstablishmentAction = async (estId: string, action: 'approved' | 'rejected') => {
    if (profile?.email !== 'davidcumbo69@gmail.com') return;

    setProcessingId(estId);
    try {
      const { error } = await supabase
        .from('medical_establishments')
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq('id', estId);

      if (error) throw error;
      showNotification(`✅ Estabelecimento ${action}!`);
      fetchEstablishments();
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setProcessingId(null);
    }
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

  const handleVideoAction = async (videoId: string, approved: boolean, youtubeUrl?: string) => {
    if (profile?.email !== 'davidcumbo69@gmail.com') {
      showNotification('⚠️ Ação não permitida para a sua conta.', 'error');
      return;
    }

    if (approved && !youtubeUrl) {
      showNotification('⚠️ Insira o link de incorporação do YouTube.', 'error');
      return;
    }

    setProcessingId(videoId);
    try {
      if (approved) {
        const { error } = await supabase
          .from('post_videos')
          .update({ 
            is_approved: true,
            youtube_url: youtubeUrl
          })
          .eq('id', videoId);
        if (error) throw error;
        showNotification('✅ Vídeo aprovado com sucesso!');
      } else {
        const { error } = await supabase
          .from('post_videos')
          .delete()
          .eq('id', videoId);
        if (error) throw error;
        showNotification('❌ Pedido de vídeo eliminado.', 'success');
      }
      fetchVideos();
    } catch (err: any) {
      showNotification(err.message || 'Erro ao processar vídeo.', 'error');
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
                  <Eye className="w-3.5 h-3.5" />
                  <span>Reels</span>
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                    activeTab === 'videos' 
                      ? 'bg-[#006747] text-white shadow-md' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Vídeos</span>
                </button>
                <button
                  onClick={() => setActiveTab('ads')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                    activeTab === 'ads' 
                      ? 'bg-[#006747] text-white shadow-md' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Ads</span>
                </button>
                <button
                  onClick={() => setActiveTab('pharmacies')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                    activeTab === 'pharmacies' 
                      ? 'bg-[#006747] text-white shadow-md' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Farmácias</span>
                </button>
                <button
                  onClick={() => setActiveTab('establishments')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                    activeTab === 'establishments' 
                      ? 'bg-[#006747] text-white shadow-md' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Estabelecimentos</span>
                </button>
            </div>

            {activeTab !== 'ads' && (
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
            )}

            {activeTab === 'ads' && (
              <button
                onClick={() => setShowAddAd(true)}
                className="bg-[#006747] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 hover:bg-emerald-800 transition-all shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Anúncio</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 rounded-xl" />
                  <Skeleton className="h-10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (activeTab === 'users' ? requests : 
  activeTab === 'reels' ? pendingReels : 
  activeTab === 'videos' ? pendingVideos : 
  activeTab === 'pharmacies' ? pharmaciesReq :
  activeTab === 'establishments' ? establishmentsReq :
  ads).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Não existem itens nesta categoria.</p>
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
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                          {sanitizeAvatarUrl(req.image_url || req.profiles?.avatar_url) ? (
                            <img src={req.image_url || req.profiles?.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <CircleUser className="w-full h-full text-black stroke-[1px] p-2" />
                          )}
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
        ) : activeTab === 'pharmacies' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {pharmaciesReq.map((ph) => (
                <motion.div
                  key={ph.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <Store className="w-6 h-6 text-[#006747]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{ph.name}</h3>
                          <p className="text-xs text-gray-400">Proprietário: {ph.profiles?.full_name || ph.profiles?.username}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ph.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                        ph.status === 'approved' ? 'bg-green-50 text-green-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {ph.status}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-xs text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{ph.address}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Licença: {ph.license_number}</span>
                      </div>
                      {ph.phone && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{ph.phone}</span>
                        </div>
                      )}
                    </div>

                    {ph.opening_hours && (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Horário de Funcionamento</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          {Object.entries(ph.opening_hours).map(([day, hours]: [any, any]) => (
                            <div key={day} className="flex justify-between">
                              <span className="font-bold uppercase">{day}:</span>
                              <span className="text-gray-500">{hours}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {ph.status === 'pending' && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center space-x-3 mt-auto">
                      <button
                        onClick={() => handlePharmacyAction(ph.id, 'approved')}
                        disabled={!!processingId}
                        className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-100 disabled:opacity-50"
                      >
                        {processingId === ph.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Aprovar Farmácia</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handlePharmacyAction(ph.id, 'rejected')}
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
        ) : activeTab === 'establishments' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {establishmentsReq.map((est) => (
                <motion.div
                  key={est.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{est.name}</h3>
                          <p className="text-xs text-gray-400">Tipo: {est.type} • De: {est.profiles?.full_name}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        est.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {est.status}
                      </div>
                    </div>
                    <div className="space-y-2 text-xs text-gray-600">
                      <p>📍 {est.province} • {est.municipality}</p>
                      <p>🏠 {est.address}</p>
                      <p>📜 Licença: {est.license_number}</p>
                      {est.services && est.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {est.services.map((s: string) => (
                            <span key={s} className="bg-gray-100 px-2 py-0.5 rounded text-[9px] font-bold">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {est.status === 'pending' && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center space-x-3">
                      <button
                        onClick={() => handleEstablishmentAction(est.id, 'approved')}
                        disabled={!!processingId}
                        className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                         {processingId === est.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Aprovar</span>}
                      </button>
                      <button
                        onClick={() => handleEstablishmentAction(est.id, 'rejected')}
                        disabled={!!processingId}
                        className="flex-1 bg-white text-red-600 border border-red-100 rounded-xl py-2.5 text-sm font-bold disabled:opacity-50"
                      >
                        Rejeitar
                      </button>
                    </div>
                   )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : activeTab === 'videos' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {pendingVideos.map((video) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                          {sanitizeAvatarUrl(video.profiles?.avatar_url) ? (
                            <img src={video.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <CircleUser className="w-full h-full text-black stroke-[1px] p-2" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{video.profiles?.full_name || video.profiles?.username}</h3>
                          <p className="text-xs text-gray-400">{new Date(video.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        !video.is_approved ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {video.is_approved ? 'Aprovado' : 'Pendente'}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4">
                      <div className="flex items-center text-xs text-gray-500 italic">
                        <FileText className="w-3 h-3 mr-2" />
                        <span>Legenda Sugerida:</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {video.caption}
                      </p>
                    </div>

                    {filter === 'approved' && video.youtube_url && (
                        <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
                             <div className="flex items-center text-xs text-emerald-600 font-bold">
                                <Play className="w-3 h-3 mr-2" />
                                <span>Link de Incorporação:</span>
                             </div>
                             <p className="text-xs font-mono text-emerald-800 break-all">{video.youtube_url}</p>
                        </div>
                    )}
                  </div>

                  {!video.is_approved && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-3 mt-auto">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Link de Incorporação (YouTube Embed URL)</label>
                        <input 
                          type="text"
                          id={`youtube-url-${video.id}`}
                          placeholder="https://www.youtube.com/embed/..."
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-[#006747] focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            const url = (document.getElementById(`youtube-url-${video.id}`) as HTMLInputElement).value;
                            handleVideoAction(video.id, true, url);
                          }}
                          disabled={!!processingId}
                          className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-100 disabled:opacity-50"
                        >
                          {processingId === video.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Aprovar com Link</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleVideoAction(video.id, false)}
                          disabled={!!processingId}
                          className="flex-1 bg-white text-red-600 border border-red-100 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center space-x-2 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Rejeitar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : activeTab === 'reels' ? (
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
                            <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                               {sanitizeAvatarUrl(reel.profiles?.avatar_url) ? (
                                   <img 
                                     src={reel.profiles.avatar_url} 
                                     className="w-full h-full object-cover" 
                                     alt="" 
                                   />
                               ) : (
                                   <CircleUser className="w-full h-full text-black stroke-[1px] p-2" />
                               )}
                            </div>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <AnimatePresence>
               {ads.map((ad) => (
                 <motion.div
                   key={ad.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
                 >
                   <div className="relative aspect-video bg-gray-100">
                      {ad.image_url ? (
                        <img src={ad.image_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button 
                          onClick={() => handleToggleAdStatus(ad.id, ad.is_active)}
                          className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-white shadow-sm transition-colors ${
                            ad.is_active ? 'text-green-600' : 'text-red-500'
                          }`}
                        >
                          {ad.is_active ? 'Ativo' : 'Pausado'}
                        </button>
                      </div>
                   </div>
                   <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-[8px] font-black uppercase bg-emerald-50 text-[#006747] px-2 py-0.5 rounded-full">{ad.target_category}</span>
                        <span className="text-[8px] font-black uppercase bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">{ad.display_location}</span>
                      </div>
                      <h4 className="font-bold text-sm mb-1">{ad.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-4">{ad.description}</p>
                      
                      <div className="flex items-center space-x-2 mt-auto">
                        <button 
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <a 
                          href={ad.link_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-1 text-center bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1"
                        >
                          <span>Ver Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>
          </div>
        )}
      </div>

      {/* Ad Creation Modal */}
      <AnimatePresence>
        {showAddAd && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddAd(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                   <h2 className="text-xl font-black text-[#006747] uppercase tracking-tight">Novo Anúncio VIVA+</h2>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Impulsionar visibilidade</p>
                </div>
                <button onClick={() => setShowAddAd(false)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-400">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#006747] mb-2">Título do Anúncio</label>
                  <input 
                    type="text" 
                    value={newAd.title}
                    onChange={(e) => setNewAd({...newAd, title: e.target.value})}
                    placeholder="Ex: Novo Suplemento Omega 3"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006747]/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#006747] mb-2">Descrição / Texto</label>
                  <textarea 
                    value={newAd.description}
                    onChange={(e) => setNewAd({...newAd, description: e.target.value})}
                    placeholder="O que deseja anunciar?"
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006747]/20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#006747] mb-2">Categoria Alvo</label>
                    <select 
                      value={newAd.target_category}
                      onChange={(e) => setNewAd({...newAd, target_category: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    >
                      <option>Geral</option>
                      <option>Nutrição</option>
                      <option>Psicologia</option>
                      <option>Fisioterapia</option>
                      <option>Cardiologia</option>
                      <option>Odontologia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#006747] mb-2">Local de Exibição</label>
                    <select 
                      value={newAd.display_location}
                      onChange={(e) => setNewAd({...newAd, display_location: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    >
                      <option value="all">Todos (Capa + Perfil)</option>
                      <option value="groups">Apenas Grupos</option>
                      <option value="profiles">Apenas Perfis</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#006747] mb-2">Imagem de Capa</label>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-200">
                      {newAd.image_url ? (
                        <img src={newAd.image_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input 
                        type="file" 
                        id="ad-image" 
                        className="hidden" 
                        onChange={handleAdImageUpload}
                        accept="image/*"
                      />
                      <label 
                        htmlFor="ad-image"
                        className="inline-block bg-white border border-[#006747] text-[#006747] px-6 py-2.5 rounded-xl font-bold text-xs cursor-pointer hover:bg-emerald-50 transition-colors"
                      >
                        Carregar Imagem
                      </label>
                      <p className="text-[10px] text-gray-400 mt-2">Formatos: JPG, PNG. Recomendado: 1200x400px</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#006747] mb-2">Link Externo (URL)</label>
                  <input 
                    type="url" 
                    value={newAd.link_url}
                    onChange={(e) => setNewAd({...newAd, link_url: e.target.value})}
                    placeholder="https://exemplo.com"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={handleCreateAd}
                  disabled={!!processingId}
                  className="w-full bg-[#006747] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/10 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {processingId === 'new-ad' ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : (
                    <>
                      <Layout className="w-4 h-4" />
                      <span>Publicar Anúncio Agora</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
